const express = require("express");
const router = express.Router();
 
const adminUserDetailController = require("../../controllers/admin/adminUserDetailController");
const sessionAuth = require("../../middleware/sessionAuth");
 
router.get(
  "/pending-payo-deposits",
  sessionAuth,
  adminUserDetailController.getPendingPayoDeposits
);

router.get(
  "/pending-payo-deposits/:userid",
  sessionAuth,
  adminUserDetailController.getPendingPayoDeposits
);
 
router.post(
  "/deposit-approval-reject",
  sessionAuth,
  adminUserDetailController.depositApprovalReject
);

module.exports = router;
 
 