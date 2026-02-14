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

if (!admin.apps.length) {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

async function fetchAllAuthUsers() {
  let nextPageToken = undefined;
  const users = [];

  do {
    const result = await admin.auth().listUsers(1000, nextPageToken);
    users.push(...result.users);
    nextPageToken = result.pageToken;
  } while (nextPageToken);

  return users;
}

async function syncUsersFromAuth() {
  const authUsers = await fetchAllAuthUsers();
  const existingSnapshot = await db.collection("users").get();

  const existingById = new Map();
  existingSnapshot.docs.forEach((snapshotDoc) => {
    existingById.set(snapshotDoc.id, snapshotDoc.data());
  });

  let syncedCount = 0;
  const batchSize = 400;

  for (let i = 0; i < authUsers.length; i += batchSize) {
    const batch = db.batch();
    const chunk = authUsers.slice(i, i + batchSize);

    chunk.forEach((authUser) => {
      const existing = existingById.get(authUser.uid) || {};
      const createdAt = toDate(authUser.metadata?.creationTime);
      const lastLoginAt = toDate(authUser.metadata?.lastSignInTime);

      const payload = {
        email: authUser.email || existing.email || null,
        displayName:
          authUser.displayName ||
          existing.displayName ||
          (authUser.email ? authUser.email.split("@")[0] : "User"),
        emailVerified: authUser.emailVerified,
        providerIds: authUser.providerData.map((provider) => provider.providerId),
        status: authUser.disabled ? "disabled" : existing.status || "active",
        role: existing.role || (existing.isAdmin ? "admin" : "user"),
        isAdmin: typeof existing.isAdmin === "boolean" ? existing.isAdmin : false,
        points: typeof existing.points === "number" ? existing.points : 0,
        createdAt: existing.createdAt || createdAt || admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: lastLoginAt || existing.lastLoginAt || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      batch.set(db.collection("users").doc(authUser.uid), payload, { merge: true });
      syncedCount += 1;
    });

    await batch.commit();
  }

  console.log(`User sync complete: ${syncedCount} auth users upserted to Firestore users collection.`);
}

syncUsersFromAuth()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
