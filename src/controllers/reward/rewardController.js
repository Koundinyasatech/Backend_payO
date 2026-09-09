const sql = require("mssql");
const connectDB = require("../../config/db");

exports.getPartnerRewardMilestones = async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool
      .request()
      .input(
        "SessionToken",
        sql.VarChar(500),
        req.sessionToken
          ? String(req.sessionToken).trim()
          : null
      )
      .execute("USP_Get_Partner_Reward_MilestonesJson");

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(500).json({
        Status: "500",
        Message: "No response received from database."
      });
    }

    const rawJson = result.recordset[0].WalletDetails;

    if (!rawJson) {
      return res.status(500).json({
        Status: "500",
        Message: "Invalid response from database."
      });
    }

    const dbResponse =
      typeof rawJson === "string"
        ? JSON.parse(rawJson)
        : rawJson;

    // Return exactly the response received from DB
    return res
      .status(Number(dbResponse.Status) || 200)
      .json(dbResponse);

  } catch (err) {
    console.error("Get Partner Reward Milestones Error:", err);

    return res.status(500).json({
      Status: "500",
      Message: err.message
    });
  }
};