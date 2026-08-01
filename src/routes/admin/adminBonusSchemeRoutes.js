
const express = require("express");

const router = express.Router();

const sessionAuth = require("../../middleware/sessionAuth");

const adminBonusSchemeController = require("../../controllers/admin/adminBonusSchemeController");

router.post("/bonus-scheme/add", sessionAuth, adminBonusSchemeController.addBonusScheme);

router.put("/bonus-scheme/update", sessionAuth, adminBonusSchemeController.updateBonusScheme);

router.patch("/bonus-scheme/activate", sessionAuth, adminBonusSchemeController.activateBonusScheme);

router.patch("/bonus-scheme/delete", sessionAuth, adminBonusSchemeController.deleteBonusScheme);

router.get("/bonus-schemes", sessionAuth, adminBonusSchemeController.getAdminBonusSchemes);

module.exports = router;
 