const Parser = require('rss-parser');
const parser = new Parser();

class WebSocketManager {
  constructor() {
    this.clients = new Set();
    this.wss = null;

    // 📰 store last news to avoid duplicates
    this.lastNewsTitles = new Set();

    // 🔥 RSS feeds (FREE LIVE NEWS SOURCES)
    this.newsFeeds = [
      'https://cointelegraph.com/rss',
      'https://www.coindesk.com/arc/outboundfeeds/rss/',
      'https://decrypt.co/feed'
    ];
  }

  initialize(wss) {
    this.wss = wss;

    this.wss.on('connection', (ws) => {
      console.log('New WebSocket client connected');
      this.clients.add(ws);

      ws.subscribedSymbols = [];

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);

          if (data.type === 'subscribe') {
            ws.subscribedSymbols = data.symbols || [];
            console.log(`Client subscribed to: ${ws.subscribedSymbols.join(', ')}`);
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
        this.clients.delete(ws);
      });

      // 🔵 connection event
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to PAYO Crypto WebSocket',
        timestamp: new Date()
      }));
    });

    // 🚀 START LIVE NEWS STREAM
    this.startNewsStream();
  }

  // ===============================
  // 🔥 LIVE NEWS STREAM ENGINE
  // ===============================
  startNewsStream() {
    setInterval(async () => {
      try {
        const news = await this.fetchLatestNews();

        if (news.length > 0) {
          this.broadcastNews(news);
        }
      } catch (error) {
        console.error('News stream error:', error.message);
      }
    }, 60000); // every 60 seconds
  }

  async fetchLatestNews() {
    let allNews = [];

    for (let feedUrl of this.newsFeeds) {
      const feed = await parser.parseURL(feedUrl);

      const items = feed.items.slice(0, 10).map(item => ({
        title: item.title,
        url: item.link,
        source: feed.title,
        publishedAt: item.pubDate,
        id: item.guid || item.link
      }));

      allNews.push(...items);
    }

    // 🔥 remove duplicates (important)
    const newOnly = allNews.filter(news => {
      if (this.lastNewsTitles.has(news.title)) {
        return false;
      }
      this.lastNewsTitles.add(news.title);
      return true;
    });

    // keep memory small
    if (this.lastNewsTitles.size > 200) {
      this.lastNewsTitles.clear();
    }

    return newOnly;
  }

  // ===============================
  // 📡 BROADCAST NEWS TO CLIENTS
  // ===============================
  broadcastNews(newsList) {
    const message = JSON.stringify({
      type: 'crypto_news',
      data: newsList,
      timestamp: new Date()
    });

    this.clients.forEach(client => {
      if (client.readyState === 1) {

        // 🔥 optional symbol filtering
        const symbols = client.subscribedSymbols || [];

        if (symbols.length > 0) {
          const filtered = newsList.filter(news =>
            symbols.some(sym =>
              news.title.toLowerCase().includes(sym.toLowerCase())
            )
          );

          if (filtered.length > 0) {
            client.send(JSON.stringify({
              type: 'crypto_news',
              data: filtered,
              timestamp: new Date()
            }));
          }

        } else {
          // send all news
          client.send(message);
        }
      }
    });
  }

  // ===============================
  // 📊 EXISTING MARKET DATA PUSH
  // ===============================
  broadcastMarketData(data) {
    const message = JSON.stringify({
      type: 'market_update',
      data: data,
      timestamp: new Date()
    });

    this.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(message);
      }
    });
  }

  sendToClient(ws, data) {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(data));
    }
  }
}

module.exports = new WebSocketManager();