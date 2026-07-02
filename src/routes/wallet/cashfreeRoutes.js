const express = require("express");

const router = express.Router();

const auth = require("../../middleware/auth");

const cashfreeController = require("../../controllers/wallet/cashfreeController");
const webhookController = require("../../controllers/wallet/cashfreeWebhookController");
// ===============================
// Deposit Money
// ===============================
router.post(
  "/deposit/create-order",
  auth,
  cashfreeController.createDepositOrder
);

// ===============================
// Verify Payment
// ===============================
router.post(
  "/deposit/verify",
  auth,
  cashfreeController.verifyDeposit
);

// ===============================
// Deposit History
// ===============================
router.get(
  "/deposit/history",
  auth,
  cashfreeController.depositHistory
);
router.post(
    "/webhook",
    webhookController.cashfreeWebhook
);

module.exports = router;