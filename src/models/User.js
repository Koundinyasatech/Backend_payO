const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,

  email: {
    type: String,
    unique: true,
  },

  mobile: {
    type: String,
    unique: true,
    required: true,
  },

  referredBy: {
    type: String,
    default: null,
  },

  password: String,

  referralcode: String,

  isVerified: {
    type: Boolean,
    default: false,
  },

  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Wallet",
  },

  myReferralCode: {
    type: String,
  },

  transactionPin: {
    type: String,
  },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },

  // ── ADDED FOR ROLE-BASED ACCESS CONTROL ──────────────────────────────────
  adminRole: {
    type: String,
    enum: ["super_admin", "kyc_admin", "operations_admin", "support_admin"],
    default: null,
  },
  // ─────────────────────────────────────────────────────────────────────────

  kycVerified: {
    type: Boolean,
    default: false,
  },

  walletActivated: {
    type: Boolean,
    default: false,
  },

  // ── NEW: FOR FIREBASE CLOUD MESSAGING (OTP push delivery) ────────────────
  // Set via /auth/save-fcm-token after login, or refreshed by the app
  // whenever Firebase issues a new token for the device.
  fcmToken: {
    type: String,
    default: null,
  },
  // ─────────────────────────────────────────────────────────────────────────
});

module.exports = mongoose.model("User", userSchema);