const newsService = require("../../services/newsService");

exports.getCryptoNews = async (req, res) => {
  try {
    const news = await newsService.fetchNews();

    res.status(200).json({
      success: true,
      count: news.length,
      data: news
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
