// config/firebase.js
// Single, shared Firebase Admin initialization — every other file should
// import from HERE instead of calling initializeApp() again themselves.
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const path = require("path");

const serviceAccount = require(
  path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./config/firebaseServiceAccount.json")
);

const firebaseApp = initializeApp({
  credential: cert(serviceAccount),
});

console.log("Firebase initialized");

module.exports = {
  firebaseApp,
  firebaseAuth: getAuth(firebaseApp),
};