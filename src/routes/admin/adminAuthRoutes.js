const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const adminAuth = require("../../middleware/adminAuth");
const requireRole = require("../../middleware/requireRole");

const {
  adminLogin,
} = require("../../controllers/admin/adminAuthController");

// ── PUBLIC ───────────────────────────────────────────────────────────────────
router.post("/login", adminLogin);

module.exports = router;