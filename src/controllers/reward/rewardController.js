const sql = require("mssql");
const connectDB = require("../../config/db");

exports.getPartnerRewardMilestones = async (req, res) => {
  try {
    // Establish a connection with the SQL Server database.
    const pool = await connectDB();
     // Execute the stored procedure with the session token
    // received from the authenticated user request.
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
       // Validate whether the stored procedure returned any result.
    if (!result.recordset || result.recordset.length === 0) {
      return res.status(500).json({
        Status: "500",
        Message: "No response received from database."
      });
    }
      // Retrieve the JSON response returned by the stored procedure.
    const rawJson = result.recordset[0].WalletDetails;
    // Validate the response received from the database.
    if (!rawJson) {
      return res.status(500).json({
        Status: "500",
        Message: "Invalid response from database."
      });
    }
// Parse the database response if it is returned as a JSON string.
    // If the driver already returns an object, use it directly.
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