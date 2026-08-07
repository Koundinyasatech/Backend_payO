const sql = require("mssql");

const connectDB = require("../../config/db");
 
exports.getAdminReferralDetails = async (req, res) => {

  try {

    const authHeader = req.headers.authorization;

    const adminSession =

      req.sessionToken ||

      req.query.admin_session ||

      (authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader);
 
    const pool = await connectDB();
 
    const result = await pool

      .request()

      .input("admin_session", sql.VarChar(400), adminSession ? String(adminSession).trim() : null)

      .execute("USP_Admin_Referral_Details");
 
    const row = result.recordset?.[0];
 
    if (!row || !row.Result) {

      return res.status(500).json({

        success: false,

        message: "Invalid response from database",

      });

    }
 
    const dbResponse = JSON.parse(row.Result);

    return res.status(Number(dbResponse.Status) || 200).json(dbResponse);
 
  } catch (err) {

    console.error("Get Admin Referral Details Error:", err);

    return res.status(500).json({

      success: false,

      message: err.message,

    });

  }

};