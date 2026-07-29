const express = require("express");
const router = express.Router();

const walletController = require("../../controllers/wallet/walletController");
const sessionAuth = require("../../middleware/sessionAuth");
router.post("/add-money", sessionAuth, walletController.addMoneyToWallet);
router.get("/wallet-details", sessionAuth, walletController.getWalletDetails);

router.get(
  "/deposit-history",
  sessionAuth,
  walletController.getUserDepositHistory
);

module.exports = router;


 