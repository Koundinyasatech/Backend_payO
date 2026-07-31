const express = require("express");
const router = express.Router();
 
const newsController = require("../../controllers/news/newsController");
const sessionAuth = require("../../middleware/sessionAuth");
 
router.get("/news", sessionAuth, newsController.getNews);
 
module.exports = router;
 