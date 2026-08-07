const express = require("express");

const router = express.Router();

const adminReferralController = require("../../controllers/admin/adminReferralController");
 
router.get("/referral-details", adminReferralController.getAdminReferralDetails);
 
module.exports = router;

 