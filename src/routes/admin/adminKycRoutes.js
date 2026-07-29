const express = require("express");
const router = express.Router();

// Comment these for testing
const auth = require("../../middleware/auth");
const adminAuth = require("../../middleware/adminAuth");
// const requireRole = require("../../middleware/requireRole");

const {
  getAllSubmissions,
  getSubmissionDetails,
  approveRejectKyc,
} = require("../../controllers/admin/adminKycController");

// Disable auth middleware for testing
router.use(adminAuth);

router.get("/all-submissions", getAllSubmissions);

router.get("/submission-details/:userId", getSubmissionDetails);

router.patch(
  "/approve-reject/:docId",
  adminAuth,
  approveRejectKyc
);

module.exports = router;