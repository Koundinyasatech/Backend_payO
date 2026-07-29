const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const adminAuth = require("../../middleware/adminAuth");
const {adminLogin} = require("../../controllers/admin/adminAuthController");

router.post("/login", adminLogin);
module.exports = router;