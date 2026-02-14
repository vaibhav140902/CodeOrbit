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

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = process.argv[2];

if (!uid) {
  console.error("Usage: node makeAdmin.js <uid>");
  process.exit(1);
}

async function makeAdmin(targetUid) {
  await admin.auth().setCustomUserClaims(targetUid, { admin: true });

  await admin
    .firestore()
    .doc(`users/${targetUid}`)
    .set(
      {
        isAdmin: true,
        role: "admin",
        status: "active",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  console.log(`✅ User ${targetUid} is now ADMIN (custom claim + Firestore doc)`);
}

makeAdmin(uid)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
