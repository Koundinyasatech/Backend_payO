process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);
});
const express = require("express");

const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

dotenv.config();

const connectDB = require("./config/db");

// routes
const authRoutes = require("./routes/auth/authRoutes");
const walletRoutes = require("./routes/wallet/walletRoutes");

const adminKycRoutes = require("./routes/admin/adminKycRoutes");
const adminAuthRoutes = require("./routes/admin/adminAuthRoutes");
const adminUserDetailRoutes = require("./routes/admin/adminUserDetailRoutes");
const countryRoutes = require("./routes/countryRoutes");
const kycRoutes1 = require("./routes/kyc/kycRoutes1");
const adminRoutes = require("./routes/admin/adminUserDetailRoutes");
// connect database
console.log("Connecting to DB...");
connectDB();
console.log("Creating Express app...");
const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());

// server.js - Update the static files middleware
app.use("/kyc-docs", express.static(path.join(__dirname, "uploads"), {
  maxAge: "1d",
  dotfiles: "deny",
}));


//app.use("/api/kyc",kycRoutes);
app.use("/api/admin/kyc",adminKycRoutes);
app.use("/api", countryRoutes);  
app.use("/api/kyc", kycRoutes1);

// ── Admin routes ──────────────────────────────────────────────────────────────
app.use("/api/admin/auth", adminAuthRoutes);             
app.use("/api/admin/user-details", adminUserDetailRoutes); 
app.use("/api/admin", adminRoutes);
// Root Route
app.get("/", (req, res) => {
  res.send("Server is running");
});




// Start Server
const PORT = process.env.PORT || 3003;
console.log("Starting server...");
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("WebSocket server ready");
  console.log("Binance WebSocket connecting...");
});