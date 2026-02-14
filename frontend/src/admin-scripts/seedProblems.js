const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccountCandidates = [
  "serviceAccountKey.json",
  "ServiceAccountkey.json",
];

const serviceAccountPath = serviceAccountCandidates
  .map((name) => path.join(__dirname, name))
  .find((candidatePath) => fs.existsSync(candidatePath));

if (!serviceAccountPath) {
  console.error(
    "Missing service account json. Add one of these files in this folder: serviceAccountKey.json or ServiceAccountkey.json"
  );
  process.exit(1);
}

const problemBankPath = path.join(__dirname, "problemBank.json");
if (!fs.existsSync(problemBankPath)) {
  console.error("Missing problemBank.json in admin-scripts folder.");
  process.exit(1);
}

if (!admin.apps.length) {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const problemBank = require(problemBankPath);

const validateProblems = (problems) => {
  if (!Array.isArray(problems) || problems.length === 0) {
    throw new Error("problemBank.json must be a non-empty array.");
  }

  const slugSet = new Set();
  const validDifficulties = new Set(["Easy", "Medium", "Hard"]);

  for (const [index, problem] of problems.entries()) {
    if (!problem.slug || typeof problem.slug !== "string") {
      throw new Error(`Problem at index ${index} has invalid slug.`);
    }
    if (slugSet.has(problem.slug)) {
      throw new Error(`Duplicate slug found: ${problem.slug}`);
    }
    slugSet.add(problem.slug);

    if (!validDifficulties.has(problem.difficulty)) {
      throw new Error(`Problem ${problem.slug} has invalid difficulty: ${problem.difficulty}`);
    }
    if (!problem.problemName || !Array.isArray(problem.tags) || problem.tags.length === 0) {
      throw new Error(`Problem ${problem.slug} is missing required fields.`);
    }
  }
};

const chunkArray = (arr, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
};

async function seedProblems() {
  validateProblems(problemBank);

  const chunks = chunkArray(problemBank, 400);
  let totalWrites = 0;

  for (const chunk of chunks) {
    const batch = db.batch();
    const now = admin.firestore.FieldValue.serverTimestamp();

    for (const [index, problem] of chunk.entries()) {
      const globalIndex = totalWrites + index + 1;
      const problemRef = db.collection("problems").doc(problem.slug);

      batch.set(
        problemRef,
        {
          problemName: problem.problemName,
          difficulty: problem.difficulty,
          tags: problem.tags,
          description: problem.description,
          examples: problem.examples,
          constraints: problem.constraints,
          slug: problem.slug,
          order: globalIndex,
          seeded: true,
          updatedAt: now,
        },
        { merge: true }
      );
    }

    await batch.commit();
    totalWrites += chunk.length;
  }

  console.log(`Seed complete: upserted ${totalWrites} problems into Firestore.`);
}

seedProblems()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
