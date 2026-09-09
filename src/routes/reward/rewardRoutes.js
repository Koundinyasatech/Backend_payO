const express = require("express");
const router = express.Router();
const sessionAuth = require("../../middleware/sessionAuth");
const rewardController = require("../../controllers/reward/rewardController");
router.get(
  "/partner-reward-milestones",
  sessionAuth,
  rewardController.getPartnerRewardMilestones
);
module.exports = router;