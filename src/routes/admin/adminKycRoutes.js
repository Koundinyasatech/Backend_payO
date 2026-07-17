/*const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const adminAuth = require("../../middleware/adminAuth");
const requireRole = require("../../middleware/requireRole");

const {
  getDashboardStats,
  getAllSubmissions,
  listPendingReviews,
  getSubmissionDetails,
  approveVerification,
  rejectVerification,
  bulkApprove,
  bulkReject,
  searchUserKyc,
  deleteKycRecord,
  getAuditLog,
  getAllKycIds,
} = require("../../controllers/admin/adminKycController");

// ── ALL ROUTES BELOW REQUIRE: valid JWT (auth) + admin role (adminAuth) ──────
router.use(auth, adminAuth);

// ── ALL ADMINS ────────────────────────────────────────────────────────────────
// Dashboard stats and audit log are read-only summaries — visible to everyone
router.get("/dashboard-stats", getDashboardStats);
router.get("/audit-log", getAuditLog);

// ── SUPER ADMIN + KYC ADMIN + OPERATIONS ADMIN ───────────────────────────────
// operations_admin needs all-submissions for the Wallets page and Analytics page
// (both pages derive wallet/analytics data from KYC submissions)
router.get(
  "/all-submissions",
  requireRole("super_admin", "kyc_admin", "operations_admin"),
  getAllSubmissions
);

// ── SUPER ADMIN + KYC ADMIN ONLY ─────────────────────────────────────────────
// Viewing and acting on individual KYC records is restricted to KYC team
router.get(
  "/pending-reviews",
  requireRole("super_admin", "kyc_admin"),
  listPendingReviews
);

router.get(
  "/search-user",
  requireRole("super_admin", "kyc_admin"),
  searchUserKyc
);

router.get(
  "/submission-details/:userId",
  requireRole("super_admin", "kyc_admin"),
  getSubmissionDetails
);

// Approve / Reject — KYC team only
router.patch(
  "/approve-verification/:kycId",
  requireRole("super_admin", "kyc_admin"),
  approveVerification
);

router.patch(
  "/reject-verification/:kycId",
  requireRole("super_admin", "kyc_admin"),
  rejectVerification
);

// Bulk actions — KYC team only
router.patch(
  "/bulk-approve",
  requireRole("super_admin", "kyc_admin"),
  bulkApprove
);

router.patch(
  "/bulk-reject",
  requireRole("super_admin", "kyc_admin"),
  bulkReject
);

// ── SUPER ADMIN ONLY ─────────────────────────────────────────────────────────
// Hard delete is destructive — super admin only
router.delete(
  "/delete-record/:kycId",
  requireRole("super_admin"),
  deleteKycRecord
);

router.get(
  "/debug-list-ids",
  requireRole("super_admin"),
  getAllKycIds
);

module.exports = router;*/


const express = require("express");
const router = express.Router();

// Comment these for testing
const auth = require("../../middleware/auth");
const adminAuth = require("../../middleware/adminAuth");
// const requireRole = require("../../middleware/requireRole");

const {
  getDashboardStats,
  getAllSubmissions,
  listPendingReviews,
  getSubmissionDetails,
  approveRejectKyc,
  rejectVerification,
  bulkApprove,
  bulkReject,
  searchUserKyc,
  deleteKycRecord,
  getAuditLog,
  getAllKycIds,
} = require("../../controllers/admin/adminKycController");

// Disable auth middleware for testing
router.use(adminAuth);

// Dashboard
/*router.get("/dashboard-stats", getDashboardStats);
router.get("/audit-log", getAuditLog);*/

// Testing routes (without requireRole)
router.get("/all-submissions", getAllSubmissions);

//router.get("/pending-reviews", listPendingReviews);

//router.get("/search-user", searchUserKyc);

router.get("/submission-details/:userId", getSubmissionDetails);

router.patch(
  "/approve-reject/:docId",
  adminAuth,
  approveRejectKyc
);

//router.patch("/approve-verification/:kycId", approveVerification);

/*router.patch("/reject-verification/:kycId", rejectVerification);

router.patch("/bulk-approve", bulkApprove);

router.patch("/bulk-reject", bulkReject);

router.delete("/delete-record/:kycId", deleteKycRecord);

router.get("/debug-list-ids", getAllKycIds);*/

module.exports = router;