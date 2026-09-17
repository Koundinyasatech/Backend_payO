const express = require("express");
const router = express.Router();
const sessionAuth = require("../../middleware/sessionAuth");
const adminAuth = require("../../middleware/adminAuth");
const rewardController = require("../../controllers/reward/rewardController");
// GET PARTNER REWARD MILESTONES
// Get partner reward milestone details for the authenticated user.
router.get(
  "/partner-reward-milestones",
  sessionAuth,
  rewardController.getPartnerRewardMilestones
);
// ADD REWARD MILESTONE
// The stored procedure performs session validation and verifies that the
// authenticated admin has Super Admin privileges.
router.post(
  "/partner-reward-milestone",
  adminAuth,
  rewardController.addRewardMilestone
);
// GET REWARD MILESTONE CONFIGURATION
router.get(
  "/reward-milestone-config",
  adminAuth,
  rewardController.getRewardMilestoneConfig
);
// GET REWARD DETAILS
router.get(
  "/reward-details",
  adminAuth,
  rewardController.getRewardDetails
);
module.exports = router;