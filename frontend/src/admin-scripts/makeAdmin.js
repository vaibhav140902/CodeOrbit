const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = "CT8H5qeB4bfQW3QftTr60PJHh3c2";

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log("✅ User is now ADMIN");
    process.exit();
  })
  .catch((error) => {
    console.error(error);
  });
