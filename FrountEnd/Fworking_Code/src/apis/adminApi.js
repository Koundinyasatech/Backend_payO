import api from "./Axios";

// ─── Auth ────────────────────────────────────────────────────────────────────
export const loginAdmin = (email, password) =>
  api.post("/api/admin/auth/login", { email, password });

export const changePassword = (currentPassword, newPassword) =>
  api.patch("/api/admin/auth/change-password", { currentPassword, newPassword });

export const getAllAdmins = () =>
  api.get("/api/admin/auth/all-admins");

export const createSubAdmin = (data) =>
  api.post("/api/admin/auth/create-admin", data);

export const revokeAdminAccess = (adminId) =>
  api.patch(`/api/admin/auth/revoke-admin/${adminId}`);

export const updateAdminRole = (adminId, adminRole) =>
  api.patch(`/api/admin/auth/update-admin-role/${adminId}`, { adminRole });

// ─── Users ───────────────────────────────────────────────────────────────────
// GET /api/admin/auth/users
// Response: { success, total, verified, pending,
//             users: [{ _id, name, email, mobile, kycVerified, walletBalance,
//                       walletAddress, createdAt, role, bankDetails }] }
export const getAllUsers = () =>
  api.get("/api/admin/auth/users");

// ─── KYC ─────────────────────────────────────────────────────────────────────
export const getDashboardStats = () =>
  api.get("/api/admin/kyc/dashboard-stats");

export const getAllSubmissions = () =>
  api.get("/api/admin/kyc/all-submissions");

export const getPendingReviews = () =>
  api.get("/api/admin/kyc/pending-reviews");

export const searchUserKYC = (query) =>
  api.get("/api/admin/kyc/search-user", { params: { query } });

export const getSubmissionDetails = (kycId) =>
  api.get(`/api/admin/kyc/submission-details/${kycId}`);

export const approveKYC = (kycId) =>
  api.patch(`/api/admin/kyc/approve-verification/${kycId}`);

export const rejectKYC = (kycId, reason) =>
  api.patch(`/api/admin/kyc/reject-verification/${kycId}`, { reason });

export const bulkApproveKYC = (kycIds) =>
  api.patch("/api/admin/kyc/bulk-approve", { kycIds });

export const bulkRejectKYC = (kycIds, reason) =>
  api.patch("/api/admin/kyc/bulk-reject", { kycIds, reason });

export const deleteKYCRecord = (kycId) =>
  api.delete(`/api/admin/kyc/delete-record/${kycId}`);

export const getAuditLog = () =>
  api.get("/api/admin/kyc/audit-log");

// ─── Dashboard Widget Stats ───────────────────────────────────────────────────
// GET /api/admin/stats/widgets
// Response: { success, totalTransactions, payoInCirculation, referralRewardsDistributed }
export const getDashboardWidgetStats = () =>
  api.get("/api/admin/stats/widgets");

// ─── Transactions ─────────────────────────────────────────────────────────────
// GET /api/admin/stats/transactions
// Query params: page, limit, status (success|pending|failed), search, dateFilter (today|week|month)
// Response: {
//   success, summary: { totalTransactions, successCount, pendingCount, failedCount, totalVolume, successRate },
//   total, page, totalPages,
//   transactions: [{ transactionId, senderWallet, receiverWallet, senderName, receiverName,
//                    amount, status, failureReason, createdAt }]
// }
export const getTransactions = (params = {}) =>
  api.get("/api/admin/stats/transactions", { params });

// GET /api/admin/stats/transactions/:transactionId
// Response: {
//   success,
//   transaction: { transactionId, blockchainHash, amount, status, failureReason,
//                  createdAt, senderWallet, receiverWallet,
//                  sender: { name, email, mobile }, receiver: { name, email, mobile } }
// }
export const getTransactionDetails = (transactionId) =>
  api.get(`/api/admin/stats/transactions/${transactionId}`);

// ─── Referrals ────────────────────────────────────────────────────────────────
// GET /api/admin/stats/referrals
// Query params: page, limit, search
// Response: {
//   success,
//   summary: { totalReferrals, totalRewardsDistributed, topReferrers: [{ name, email, referralCode, totalReferrals, totalEarnings }] },
//   total, page, totalPages,
//   referrals: [{
//     referrer: { name, email, mobile, referralCode },
//     referredUser: { name, email, mobile, joinedAt },
//     rewardAmount,
//     rewardStatus  // "paid" | "pending"
//   }]
// }
export const getReferrals = (params = {}) =>
  api.get("/api/admin/stats/referrals", { params });

// ─── User Detail Tabs (used inside Users page modal) ─────────────────────────
// GET /api/admin/user-details/:userId/kyc
export const getUserKycDocs = (userId) =>
  api.get(`/api/admin/user-details/${userId}/kyc`);

// GET /api/admin/user-details/:userId/transactions?page=1&limit=20&status=
export const getUserTransactions = (userId, params = {}) =>
  api.get(`/api/admin/user-details/${userId}/transactions`, { params });

// GET /api/admin/user-details/:userId/referral
export const getUserReferralDetails = (userId) =>
  api.get(`/api/admin/user-details/${userId}/referral`);