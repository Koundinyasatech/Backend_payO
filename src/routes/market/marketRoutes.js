const express = require('express');
const router = express.Router();
const marketController = require('../../controllers/market/marketController');
const auth = require("../../middleware/auth");
// Market overview routes
router.get('/overview', auth,marketController.getMarketOverview);


module.exports = router;