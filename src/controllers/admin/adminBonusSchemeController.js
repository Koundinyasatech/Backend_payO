const sql = require("mssql");
const connectDB = require("../../config/db");
//admin bonus scheme controller USP_Get_Admin_Bonus_Schemes_Details, Passing Parameters, @admin_session,@scheme_name - Optional filter: exact scheme name, @scheme_code - Optional filter
exports.getAdminBonusSchemes = async (req, res) => {
  try {
    const pool = await connectDB();
 
    const result = await pool
      .request()
      .input("admin_session", sql.VarChar(sql.MAX), req.sessionToken)
      .input("scheme_name", sql.VarChar(200), req.query.scheme_name || null)
      .input("scheme_code", sql.VarChar(100), req.query.scheme_code || null)
      .execute("USP_Get_Admin_Bonus_Schemes_Details");
 
    if (!result.recordset || result.recordset.length === 0) {
      return res.status(500).json({
        Status: 500,
        Message: "No response received from database."
      });
    }
 
    const firstRow = result.recordset[0];
    const jsonColumn = Object.keys(firstRow)[0];
    const rawJson = firstRow[jsonColumn];
 
    const response =
      typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;
 
    return res.status(Number(response.Status) || 200).json(response);
 
  } catch (err) {
    console.error("Get Admin Bonus Schemes Error:", err);
 
    return res.status(500).json({
      Status: 500,
      Message: err.message
    });
  }
};


exports.addBonusScheme = async (req, res) => {
  try {
    const {
      scheme_code,
      scheme_name,
      description,
      scheme_type,
      bonus_type,
      bonus_value,
      trigger_event,
      max_redemptions_per_user,
      max_total_redemptions,
      valid_from,
      valid_to
    } = req.body;

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("admin_session", sql.VarChar(sql.MAX), req.sessionToken)
      .input("action", sql.VarChar(50), "INSERT")
      .input("scheme_code", sql.VarChar(50), scheme_code)
      .input("scheme_name", sql.VarChar(500), scheme_name)
      .input("description", sql.VarChar(1000), description)
      .input("scheme_type", sql.VarChar(100), scheme_type)
      .input("bonus_type", sql.VarChar(100), bonus_type)
      .input("bonus_value", sql.Decimal(18, 2), bonus_value)
      .input("trigger_event", sql.VarChar(1000), trigger_event)
      .input("max_redemptions_per_user", sql.VarChar(20), max_redemptions_per_user)
      .input("max_total_redemptions", sql.VarChar(20), max_total_redemptions)
      .input("valid_from", sql.DateTime, valid_from)
      .input("valid_to", sql.DateTime, valid_to)
      .execute("USP_Admin_Scheme_Bonus_Update_Add");

    const response = JSON.parse(result.recordset[0].Result);

    return res.status(Number(response.Status)).json(response);

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      Status: 500,
      Message: err.message
    });
  }
};


exports.updateBonusScheme = async (req, res) => {
  try {
    const {
      scheme_code,
      scheme_name,
      description,
      scheme_type,
      bonus_type,
      bonus_value,
      trigger_event,
      max_redemptions_per_user,
      max_total_redemptions,
      valid_from,
      valid_to
    } = req.body;

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("admin_session", sql.VarChar(sql.MAX), req.sessionToken)
      .input("action", sql.VarChar(50), "UPDATE")
      .input("scheme_code", sql.VarChar(50), scheme_code)
      .input("scheme_name", sql.VarChar(500), scheme_name)
      .input("description", sql.VarChar(1000), description)
      .input("scheme_type", sql.VarChar(100), scheme_type)
      .input("bonus_type", sql.VarChar(100), bonus_type)
      .input("bonus_value", sql.Decimal(18, 2), bonus_value)
      .input("trigger_event", sql.VarChar(1000), trigger_event)
      .input("max_redemptions_per_user", sql.VarChar(20), max_redemptions_per_user)
      .input("max_total_redemptions", sql.VarChar(20), max_total_redemptions)
      .input("valid_from", sql.DateTime, valid_from)
      .input("valid_to", sql.DateTime, valid_to)
      .execute("USP_Admin_Scheme_Bonus_Update_Add");

    const response = JSON.parse(result.recordset[0].Result);

    return res.status(Number(response.Status)).json(response);

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      Status: 500,
      Message: err.message
    });
  }
};

exports.deleteBonusScheme = async (req, res) => {
  try {
    const { scheme_code } = req.body;

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("admin_session", sql.VarChar(sql.MAX), req.sessionToken)
      .input("action", sql.VarChar(50), "DELETE")
      .input("scheme_code", sql.VarChar(50), scheme_code)
      .execute("USP_Admin_Scheme_Bonus_Update_Add");

    const response = JSON.parse(result.recordset[0].Result);

    return res.status(Number(response.Status)).json(response);

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      Status: 500,
      Message: err.message
    });
  }
};


exports.activateBonusScheme = async (req, res) => {
  try {
    const { scheme_code } = req.body;

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("admin_session", sql.VarChar(sql.MAX), req.sessionToken)
      .input("action", sql.VarChar(50), "ACTIVATE")
      .input("scheme_code", sql.VarChar(50), scheme_code)
      .execute("USP_Admin_Scheme_Bonus_Update_Add");

    const response = JSON.parse(result.recordset[0].Result);

    return res.status(Number(response.Status)).json(response);

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      Status: 500,
      Message: err.message
    });
  }
};