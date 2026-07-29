const sql = require("mssql");
const connectDB = require("../../config/db");

// Valid adminRole values for sub-admins (super_admin is env-var only, never stored via API)
const VALID_ADMIN_ROLES = [
  "kyc_admin",
  "operations_admin",
  "support_admin",
];

// ════════════════════════════════════════════════════════════════════════════
// ADMIN LOGIN
// POST /api/admin/auth/login
// ════════════════════════════════════════════════════════════════════════════

const adminLogin = async (req, res) => {
  try {
    const {
      mobile,
      username,
      password,
      ipAddress,
      userAgent
    } = req.body;

    const uname = username || mobile;

    if (!uname || !password || !ipAddress || !userAgent) {
      return res.status(400).json({
        success: false,
        message: "Username/Mobile, Password, IP Address and User Agent are required",
      });
    }

    const pool = await connectDB();
    const request = pool.request();

    request.input("uname", sql.VarChar(100), uname);
    request.input("ipadd", sql.VarChar(500), ipAddress);
    request.input("pwd", sql.VarChar(500), password);
    request.input("useragent", sql.VarChar(500), userAgent);

    const result = await request.execute("USP_Admin_Login");

    let sqlResponse = null;

    if (result.recordsets && result.recordsets.length > 0) {
      for (const rs of result.recordsets) {
        if (rs.length > 0 && rs[0].Result) {
          try {
            sqlResponse = JSON.parse(rs[0].Result);
            break;
          } catch (err) {
            console.error("Error parsing SQL response:", err);
          }
        }
      }
    }

    if (!sqlResponse) {
      return res.status(500).json({
        success: false,
        message: "Invalid response from database",
      });
    }

    if (sqlResponse.Status === 200) {
      return res.status(200).json({
        success: true,
        Status: sqlResponse.Status,
        refreshToken: sqlResponse.refreshToken,
        Success: sqlResponse.Success
      });
    }

    return res.status(sqlResponse.Status || 400).json({
      success: false,
      Status: sqlResponse.Status,
      Message: sqlResponse.Message
    });

  } catch (err) {
    console.error("adminLogin error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  adminLogin,
};