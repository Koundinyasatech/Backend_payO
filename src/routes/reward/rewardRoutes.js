const express = require("express");
const router = express.Router();
const sessionAuth = require("../../middleware/sessionAuth");
const rewardController = require("../../controllers/reward/rewardController");
// Get partner reward milestone details for the authenticated user.
router.get(
  "/partner-reward-milestones",
  sessionAuth,
  rewardController.getPartnerRewardMilestones
);
module.exports = router;