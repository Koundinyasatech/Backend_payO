const Parser = require("rss-parser");
const websocketManager = require("../utils/websocketManager");

const parser = new Parser();

class NewsService {
  constructor() {
    this.previousNews = [];
  }

  async fetchNews() {
    try {
      // Fetch both RSS feeds
      const [coinDeskFeed, coinTelegraphFeed] = await Promise.all([
        parser.parseURL("https://www.coindesk.com/arc/outboundfeeds/rss/"),
        parser.parseURL("https://cointelegraph.com/rss")
      ]);

      const news = [];

      // CoinDesk
      coinDeskFeed.items.forEach(item => {
        news.push({
          source: "CoinDesk",
          title: item.title,
          description: item.contentSnippet || item.content || "",
          url: item.link,
          image: item.enclosure?.url || null,
          publishedAt: item.pubDate
        });
      });

      // CoinTelegraph
      coinTelegraphFeed.items.forEach(item => {
        news.push({
          source: "CoinTelegraph",
          title: item.title,
          description: item.contentSnippet || item.content || "",
          url: item.link,
          image: item.enclosure?.url || null,
          publishedAt: item.pubDate
        });
      });

      // Sort latest first
      news.sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() -
          new Date(a.publishedAt).getTime()
      );

      return news.slice(0, 30);
    } catch (error) {
      console.error("RSS Error:", error.message);
      return [];
    }
  }

  startLiveNews() {
    setInterval(async () => {
      const latestNews = await this.fetchNews();

      if (!latestNews.length) return;

      const latestUrls = latestNews.map(article => article.url);

      if (
        JSON.stringify(latestUrls) !==
        JSON.stringify(this.previousNews)
      ) {
        this.previousNews = latestUrls;

        websocketManager.broadcastNews(latestNews);

        console.log("Live News Broadcasted");
      }
    }, 60000); // Check every 1 minute
  }
}

module.exports = new NewsService();