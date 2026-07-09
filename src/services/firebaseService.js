// services/firebaseService.js
// NOTE: firebase-admin v13+ uses modular sub-path imports instead of the
// old `admin.credential.cert(...)` shortcut — that's why we import from
// "firebase-admin/app" and "firebase-admin/messaging" directly below.
const { initializeApp, cert } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const path = require("path");

// Loads the service account JSON you downloaded from
// Firebase Console → Project Settings → Service accounts → Generate new private key
const serviceAccount = require(
  path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./config/firebaseServiceAccount.json")
);

const firebaseApp = initializeApp({
  credential: cert(serviceAccount),
});

/**
 * Sends the plaintext OTP to a device via Firebase Cloud Messaging.
 * Does NOT store or verify the OTP — that stays in MongoDB.
 *
 * @param {string} fcmToken - the recipient device's FCM token
 * @param {string} otp - plaintext OTP to display
 * @returns {Promise<object>} result of the send attempt
 */
exports.sendPushOtp = async (fcmToken, otp) => {
  if (!fcmToken) {
    console.log("No FCM token available — OTP not pushed:", otp);
    return { skipped: true, reason: "no_fcm_token" };
  }

  const message = {
    token: fcmToken,
    notification: {
      title: "Your PAYO OTP",
      body: `Your OTP is ${otp}. Valid for 2 minutes.`,
    },
    data: {
      otp: String(otp),
      type: "OTP",
    },
  };

  try {
    const response = await getMessaging(firebaseApp).send(message);
    console.log("FCM push sent:", response);
    return { success: true, response };
  } catch (err) {
    console.error("FCM push error:", err.message);
    return { success: false, error: err.message };
  }
};