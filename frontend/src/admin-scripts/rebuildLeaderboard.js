const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const SCORE_BY_DIFFICULTY = {
  Easy: 10,
  Medium: 25,
  Hard: 45,
};

const serviceAccountCandidates = ["serviceAccountKey.json", "ServiceAccountkey.json"];

const serviceAccountPath = serviceAccountCandidates
  .map((name) => path.join(__dirname, name))
  .find((candidatePath) => fs.existsSync(candidatePath));

if (!serviceAccountPath) {
  console.error(
    "Missing service account json. Add one of these files in this folder: serviceAccountKey.json or ServiceAccountkey.json"
  );
  process.exit(1);
}

if (!admin.apps.length) {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

const normalizeDifficulty = (value) => {
  if (value === "Medium" || value === "Hard") return value;
  return "Easy";
};

async function rebuildLeaderboard() {
  const [usersSnapshot, problemsSnapshot, submissionsSnapshot] = await Promise.all([
    db.collection("users").get(),
    db.collection("problems").get(),
    db.collection("submissions").get(),
  ]);

  const userById = new Map();
  usersSnapshot.docs.forEach((docSnapshot) => {
    userById.set(docSnapshot.id, docSnapshot.data());
  });

  const problemDifficultyById = new Map();
  problemsSnapshot.docs.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    const difficulty = normalizeDifficulty(data.difficulty ?? data.Difficulty ?? data["Difficulty "]);
    problemDifficultyById.set(docSnapshot.id, difficulty);
  });

  const statsByUser = new Map();

  submissionsSnapshot.docs.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    const uid = String(data.userId || "");
    if (!uid) return;

    if (!statsByUser.has(uid)) {
      statsByUser.set(uid, {
        uid,
        score: 0,
        solvedCount: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        totalSubmissions: 0,
        totalAccepted: 0,
        solvedProblemIds: new Set(),
        lastSubmissionAt: null,
        lastAcceptedAt: null,
        lastSolvedAt: null,
        lastSubmissionStatus: "Submitted",
        lastSubmissionProblemId: "",
        lastSubmissionProblemName: "",
      });
    }

    const stat = statsByUser.get(uid);
    const status = String(data.status || "Submitted");
    const problemId = String(data.problemId || "");
    const problemName = String(data.problemName || "Untitled Problem");

    const submitTime =
      data.submitTime && typeof data.submitTime.toDate === "function"
        ? data.submitTime.toDate()
        : data.timestamp && typeof data.timestamp.toDate === "function"
        ? data.timestamp.toDate()
        : null;

    const fallbackDifficulty = problemDifficultyById.get(problemId) || "Easy";
    const difficulty = normalizeDifficulty(data.problemDifficulty || fallbackDifficulty);

    stat.totalSubmissions += 1;

    if (!stat.lastSubmissionAt || (submitTime && submitTime > stat.lastSubmissionAt)) {
      stat.lastSubmissionAt = submitTime;
      stat.lastSubmissionStatus = status;
      stat.lastSubmissionProblemId = problemId;
      stat.lastSubmissionProblemName = problemName;
    }

    if (status === "Accepted") {
      stat.totalAccepted += 1;

      if (!stat.lastAcceptedAt || (submitTime && submitTime > stat.lastAcceptedAt)) {
        stat.lastAcceptedAt = submitTime;
      }

      if (!stat.solvedProblemIds.has(problemId) && problemId) {
        stat.solvedProblemIds.add(problemId);
        stat.solvedCount += 1;
        stat.score += SCORE_BY_DIFFICULTY[difficulty] || SCORE_BY_DIFFICULTY.Easy;

        if (difficulty === "Easy") stat.easySolved += 1;
        if (difficulty === "Medium") stat.mediumSolved += 1;
        if (difficulty === "Hard") stat.hardSolved += 1;

        if (!stat.lastSolvedAt || (submitTime && submitTime > stat.lastSolvedAt)) {
          stat.lastSolvedAt = submitTime;
        }
      }
    }
  });

  const writes = Array.from(statsByUser.values());
  const batchSize = 400;

  for (let i = 0; i < writes.length; i += batchSize) {
    const batch = db.batch();
    const chunk = writes.slice(i, i + batchSize);

    chunk.forEach((entry) => {
      const userProfile = userById.get(entry.uid) || {};
      const email = String(userProfile.email || "");
      const displayName =
        String(userProfile.displayName || "") || (email ? email.split("@")[0] : "User");

      const totalSubmissions = entry.totalSubmissions;
      const totalAccepted = entry.totalAccepted;
      const acceptanceRate = Number(
        ((totalAccepted / Math.max(totalSubmissions, 1)) * 100).toFixed(2)
      );

      batch.set(
        db.collection("leaderboard").doc(entry.uid),
        {
          uid: entry.uid,
          displayName,
          email,
          avatarSeed: entry.uid,
          score: entry.score,
          solvedCount: entry.solvedCount,
          easySolved: entry.easySolved,
          mediumSolved: entry.mediumSolved,
          hardSolved: entry.hardSolved,
          totalSubmissions,
          totalAccepted,
          acceptanceRate,
          solvedProblemIds: Array.from(entry.solvedProblemIds),
          lastSubmissionStatus: entry.lastSubmissionStatus,
          lastSubmissionProblemId: entry.lastSubmissionProblemId,
          lastSubmissionProblemName: entry.lastSubmissionProblemName,
          lastSubmissionAt: entry.lastSubmissionAt || null,
          lastAcceptedAt: entry.lastAcceptedAt || null,
          lastSolvedAt: entry.lastSolvedAt || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    await batch.commit();
  }

  console.log(`Leaderboard rebuild complete: ${writes.length} users aggregated.`);
}

rebuildLeaderboard()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
