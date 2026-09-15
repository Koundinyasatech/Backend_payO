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
exports.addRewardMilestone = async (req, res) => {
  try {
    // Get input values from request body
    const {
      partner_level_name,
      milestone_achieved_amount,
      business_slab_min_amount,
      business_slab_max_amount,
      slab_rate_percent,
      completion_bonus_percent,
      completion_bonus_after_milestone_id,
      eligibility_conditions,
      reward_type,
      reward_value,
      settlement_days,
      max_payout_amount
    } = req.body;

    // --------------------------------------------------
    // API-SIDE VALIDATION
    // --------------------------------------------------

    // Partner level name
    if (
      !partner_level_name ||
      !/^[A-Za-z ]+$/.test(String(partner_level_name).trim())
    ) {
      return res.status(400).json({
        status_code: 400,
        status: "error",
        message:
          "Partner level name is mandatory and should contain only alphabets and spaces."
      });
    }

    // Milestone achieved amount
    if (
      milestone_achieved_amount === undefined ||
      milestone_achieved_amount === null ||
      milestone_achieved_amount === "" ||
      !/^\d+(\.\d{1,2})?$/.test(
        String(milestone_achieved_amount).trim()
      )
    ) {
      return res.status(400).json({
        status_code: 400,
        status: "error",
        message:
          "Milestone achieved amount is mandatory and should be numeric."
      });
    }

    // Business slab minimum amount
    if (
      business_slab_min_amount === undefined ||
      business_slab_min_amount === null ||
      business_slab_min_amount === "" ||
      !/^\d+(\.\d{1,2})?$/.test(
        String(business_slab_min_amount).trim()
      )
    ) {
      return res.status(400).json({
        status_code: 400,
        status: "error",
        message:
          "Business slab minimum amount is mandatory and should be numeric with maximum 2 decimal places."
      });
    }

    // Business slab maximum amount
    if (
      business_slab_max_amount === undefined ||
      business_slab_max_amount === null ||
      business_slab_max_amount === "" ||
      !/^\d+(\.\d{1,2})?$/.test(
        String(business_slab_max_amount).trim()
      )
    ) {
      return res.status(400).json({
        status_code: 400,
        status: "error",
        message:
          "Business slab maximum amount is mandatory and should be numeric with maximum 2 decimal places."
      });
    }

    // Maximum amount should be greater than minimum amount
    if (
      Number(business_slab_max_amount) <=
      Number(business_slab_min_amount)
    ) {
      return res.status(400).json({
        status_code: 400,
        status: "error",
        message:
          "Business slab maximum amount must be greater than minimum amount."
      });
    }

    // Slab rate
    if (
      slab_rate_percent === undefined ||
      slab_rate_percent === null ||
      slab_rate_percent === "" ||
      !/^\d+(\.\d{1,2})?$/.test(
        String(slab_rate_percent).trim()
      )
    ) {
      return res.status(400).json({
        status_code: 400,
        status: "error",
        message:
          "Slab rate is mandatory and should be numeric with maximum 2 decimal places."
      });
    }

    // Completion bonus
    if (
      completion_bonus_percent === undefined ||
      completion_bonus_percent === null ||
      completion_bonus_percent === "" ||
      !/^\d+(\.\d{1,2})?$/.test(
        String(completion_bonus_percent).trim()
      )
    ) {
      return res.status(400).json({
        status_code: 400,
        status: "error",
        message:
          "Completion bonus is mandatory and should be numeric with maximum 2 decimal places."
      });
    }

    // Completion bonus after milestone ID
    if (
      completion_bonus_after_milestone_id === undefined ||
      completion_bonus_after_milestone_id === null ||
      completion_bonus_after_milestone_id === ""
    ) {
      return res.status(400).json({
        status_code: 400,
        status: "error",
        message:
          "Completion bonus after milestone ID is mandatory."
      });
    }

    // Reward type
    if (
      !reward_type ||
      !String(reward_type).trim()
    ) {
      return res.status(400).json({
        status_code: 400,
        status: "error",
        message: "Reward type is mandatory."
      });
    }

    // Reward value
    if (
      reward_value === undefined ||
      reward_value === null ||
      reward_value === "" ||
      !/^\d+(\.\d{1,2})?$/.test(
        String(reward_value).trim()
      )
    ) {
      return res.status(400).json({
        status_code: 400,
        status: "error",
        message:
          "Reward value is mandatory and should be numeric with maximum 2 decimal places."
      });
    }

    // Settlement days
    if (
      settlement_days === undefined ||
      settlement_days === null ||
      settlement_days === "" ||
      !Number.isInteger(Number(settlement_days)) ||
      Number(settlement_days) <= 0
    ) {
      return res.status(400).json({
        status_code: 400,
        status: "error",
        message:
          "Settlement days is mandatory and should be greater than 0."
      });
    }

    // Maximum payout amount
    if (
      max_payout_amount === undefined ||
      max_payout_amount === null ||
      max_payout_amount === "" ||
      !/^\d+(\.\d{1,2})?$/.test(
        String(max_payout_amount).trim()
      )
    ) {
      return res.status(400).json({
        status_code: 400,
        status: "error",
        message:
          "Max payout amount is mandatory and should be numeric with maximum 2 decimal places."
      });
    }

    // --------------------------------------------------
    // DATABASE CONNECTION
    // --------------------------------------------------

    const pool = await connectDB();

    // --------------------------------------------------
    // EXECUTE STORED PROCEDURE
    // --------------------------------------------------

    const result = await pool
      .request()

      // Admin token comes from adminAuth middleware
      .input(
        "admin_token",
        sql.VarChar(sql.MAX),
        req.adminSession
          ? String(req.adminSession).trim()
          : null
      )

      .input(
        "partner_level_name",
        sql.VarChar(250),
        String(partner_level_name).trim()
      )

      .input(
        "milestone_achieved_amount",
        sql.VarChar(250),
        String(milestone_achieved_amount).trim()
      )

      .input(
        "business_slab_min_amount",
        sql.VarChar(250),
        String(business_slab_min_amount).trim()
      )

      .input(
        "business_slab_max_amount",
        sql.VarChar(250),
        String(business_slab_max_amount).trim()
      )

      .input(
        "slab_rate_percent",
        sql.VarChar(50),
        String(slab_rate_percent).trim()
      )

      .input(
        "completion_bonus_percent",
        sql.VarChar(500),
        String(completion_bonus_percent).trim()
      )

      .input(
        "completion_bonus_after_milestone_id",
        sql.BigInt,
        Number(completion_bonus_after_milestone_id)
      )

      .input(
        "eligibility_conditions",
        sql.NVarChar(sql.MAX),
        eligibility_conditions
          ? String(eligibility_conditions)
          : null
      )

      .input(
        "reward_type",
        sql.VarChar(500),
        String(reward_type).trim()
      )

      .input(
        "reward_value",
        sql.VarChar(100),
        String(reward_value).trim()
      )

      .input(
        "settlement_days",
        sql.Int,
        Number(settlement_days)
      )

      .input(
        "max_payout_amount",
        sql.VarChar(100),
        String(max_payout_amount).trim()
      )

      .execute("USP_ADD_Reward_milestone");

    // --------------------------------------------------
    // VALIDATE DATABASE RESPONSE
    // --------------------------------------------------

    if (
      !result.recordset ||
      result.recordset.length === 0
    ) {
      return res.status(500).json({
        status_code: 500,
        status: "error",
        message:
          "An unexpected error occurred while creating the reward milestone."
      });
    }

    const rawResponse = result.recordset[0].response;

    if (!rawResponse) {
      return res.status(500).json({
        status_code: 500,
        status: "error",
        message:
          "An unexpected error occurred while creating the reward milestone."
      });
    }

    // Parse JSON response returned by SQL Server
const dbResponse =
  typeof rawResponse === "string"
    ? JSON.parse(rawResponse)
    : rawResponse;

// Convert data from JSON string to object
if (
  dbResponse.data &&
  typeof dbResponse.data === "string"
) {
  try {
    dbResponse.data = JSON.parse(dbResponse.data);
  } catch (err) {
    console.error("Error parsing milestone data:", err);
  }
}

// Convert milestone_id and sequence_order to numbers
if (dbResponse.data) {
  if (dbResponse.data.milestone_id !== undefined) {
    dbResponse.data.milestone_id =
      Number(dbResponse.data.milestone_id);
  }

  if (dbResponse.data.sequence_order !== undefined) {
    dbResponse.data.sequence_order =
      Number(dbResponse.data.sequence_order);
  }
}

// Return the response received from DB
return res
  .status(Number(dbResponse.status_code) || 500)
  .json(dbResponse);

} catch (err) {

  // Log actual error for debugging
  console.error(
    "Add Reward Milestone Error:",
    err
  );

  // Do not expose internal database/server error to client
  return res.status(500).json({
    status_code: 500,
    status: "error",
    message:
      "An unexpected error occurred while creating the reward milestone."
  });
}
};