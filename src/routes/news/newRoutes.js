const express = require("express");
const router = express.Router();

const newsController = require("../../controllers/news/newsController");
const auth = require("../../middleware/auth");

 router.get("/crypto-news",auth,newsController.getCryptoNews);

module.exports = router;
