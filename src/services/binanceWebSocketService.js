const WebSocket = require("ws");
const EventEmitter = require("events");

class BinanceWebSocketService extends EventEmitter {
  constructor() {
    super();
    this.ws = null;
    this.subscriptions = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  // =========================
  // 🚀 MAIN CONNECT (FIXED)
  // =========================
  connect() {
    const streamUrl =
      "wss://stream.binance.com:9443/ws/!ticker@arr";

    this.ws = new WebSocket(streamUrl);

    this.ws.on("open", () => {
      console.log("✅ Connected to Binance WebSocket");
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.ws.on("message", (data) => {
      try {
        const tickers = JSON.parse(data);

        const marketData = {};

        tickers.forEach((ticker) => {
          if (!ticker.s.endsWith("USDT")) return;

          const symbol = ticker.s.replace("USDT", "");

          const formatted = {
            symbol,
            fullSymbol: ticker.s,
            price: parseFloat(ticker.c),
            priceChange: parseFloat(ticker.p),
            priceChangePercent: parseFloat(ticker.P),
            volume: parseFloat(ticker.v),
            quoteVolume: parseFloat(ticker.q),
            high: parseFloat(ticker.h),
            low: parseFloat(ticker.l),
            open: parseFloat(ticker.o),
            bidPrice: parseFloat(ticker.b),
            askPrice: parseFloat(ticker.a),
            weightedAvgPrice: parseFloat(ticker.w),
            count: ticker.n,
            lastUpdate: Date.now(),
          };

          marketData[symbol] = formatted;
          this.subscriptions.set(symbol, formatted);
        });

        // 🔥 EMIT LIVE DATA TO SERVER
        this.emit("marketUpdate", marketData);
      } catch (err) {
        console.error("❌ Binance message parse error:", err.message);
      }
    });

    this.ws.on("error", (err) => {
      console.error("❌ Binance WebSocket error:", err.message);
      this.isConnected = false;
    });

    this.ws.on("close", () => {
      console.log("⚠️ Binance WebSocket closed");
      this.isConnected = false;
      this.reconnect();
    });
  }

  // =========================
  // 🔁 RECONNECT LOGIC
  // =========================
  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("❌ Max reconnect attempts reached");
      return;
    }

    this.reconnectAttempts++;

    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      30000
    );

    console.log(
      `🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    setTimeout(() => this.connect(), delay);
  }

  // =========================
  // 📊 GET PRICE (CACHE)
  // =========================
  getPrice(symbol) {
    return this.subscriptions.get(symbol);
  }

  getAllPrices() {
    return Array.from(this.subscriptions.values());
  }

  // =========================
  // 🔌 MANUAL SUBSCRIBE (FIXED)
  // =========================
  subscribeToSymbol(symbol) {
    if (!this.ws || !this.isConnected) return;

    const msg = {
      method: "SUBSCRIBE",
      params: [`${symbol.toLowerCase()}usdt@ticker`],
      id: Date.now(),
    };

    this.ws.send(JSON.stringify(msg));
  }

  subscribeToDepth(symbol, level = 20) {
    if (!this.ws || !this.isConnected) return;

    const msg = {
      method: "SUBSCRIBE",
      params: [`${symbol.toLowerCase()}usdt@depth${level}`],
      id: Date.now(),
    };

    this.ws.send(JSON.stringify(msg));
  }

  subscribeToKline(symbol, interval = "1h") {
    if (!this.ws || !this.isConnected) return;

    const msg = {
      method: "SUBSCRIBE",
      params: [`${symbol.toLowerCase()}usdt@kline_${interval}`],
      id: Date.now(),
    };

    this.ws.send(JSON.stringify(msg));
  }

  subscribeToSymbolTicker(symbol) {
    if (!this.ws || !this.isConnected) return;

    const msg = {
      method: "SUBSCRIBE",
      params: [`${symbol.toLowerCase()}usdt@ticker`],
      id: Date.now(),
    };

    this.ws.send(JSON.stringify(msg));
  }

  // =========================
  // ❌ DISCONNECT
  // =========================
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

module.exports = new BinanceWebSocketService();