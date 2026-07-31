const sql = require("mssql");
const connectDB = require("../../config/db");
exports.getNews = async (req, res) => {
  try {
    const pool = await connectDB();
 
    const result = await pool
      .request()
      .input("session_token", sql.VarChar(sql.MAX), req.sessionToken)
      .execute("USP_News_Fetch");
 
    const response = JSON.parse(result.recordset[0].Result);
 
    return res.status(response.Status).json(response);
 
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      Status: 500,
      Message: err.message
    });
  }
};
 