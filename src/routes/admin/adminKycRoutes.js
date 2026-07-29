const express = require("express");
const router = express.Router();

const adminAuth = require("../../middleware/adminAuth");

const {
  
  getAllSubmissions,
  getSubmissionDetails,
  approveRejectKyc
} = require("../../controllers/admin/adminKycController");

router.use(adminAuth);
router.get("/all-submissions", getAllSubmissions);

router.get("/submission-details/:userId", getSubmissionDetails);

router.patch(
  "/approve-reject/:docId",
  adminAuth,
  approveRejectKyc
);

module.exports = router;