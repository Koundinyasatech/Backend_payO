const express = require("express");
const router = express.Router();

const sessionAuth = require("../../middleware/sessionAuth");
const kycController = require("../../controllers/kyc/kycController1");

router.get("/details", sessionAuth, kycController.getKycDetails);

router.post("/upload-document", sessionAuth, kycController.uploadKycDocument);

module.exports = router;