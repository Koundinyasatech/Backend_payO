const sql = require("mssql");
const connectDB = require("../../config/db");
 
exports.getPendingPayoDeposits = async (req, res) => {
  try {
    const pool = await connectDB();
 
    // Get userid from URL parameter (optional)
    const { userid } = req.params;
 
    const result = await pool
      .request()
      .input("admin_session", sql.VarChar(250), req.sessionToken)
      .input("userid", sql.BigInt, userid ? Number(userid) : null)
      .execute("USP_Admin_Get_Pending_Payo_Deposits");
 
    const row = result.recordset[0];
 
    if (!row) {
      return res.status(500).json({
        success: false,
        message: "No response returned from database",
      });
    }
 
    if (!row.Result) {
      return res.status(500).json({
        success: false,
        message: "Invalid response returned from database",
      });
    }
 
    const dbResponse = JSON.parse(row.Result);
 
    if (parseInt(dbResponse.Status) !== 200) {
      return res.status(parseInt(dbResponse.Status)).json({
        success: false,
        message: dbResponse.Message,
        errorNumber: dbResponse.ErrorNumber || null,
      });
    }
 
    return res.status(200).json({
      success: true,
      message: "Pending Payo deposits fetched successfully.",
      totalRecords: dbResponse.TotalRecords || 0,
      data: dbResponse.Data || [],
    });
 
  } catch (err) {
    console.error("Get Pending Payo Deposits Error:", err);
 
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
 
exports.depositApprovalReject = async (req, res) => {
  try {
    const pool = await connectDB();

    const {
      walletAddress,
      gatewayOrderId,
      transactionUid,
      depositUid,
      depositResponse,
      rejectReason
    } = req.body;

    const result = await pool
      .request()
      .input("admin_Token", sql.VarChar(250), req.sessionToken)
      .input("wallet_address", sql.VarChar(200), walletAddress)
      .input("gateway_order_id", sql.VarChar(250), gatewayOrderId)
      .input("transactionuid", sql.VarChar(100), transactionUid)
      .input("depostuid", sql.VarChar(100), depositUid)
      .input("depost_response", sql.VarChar(20), depositResponse)
      .input("reject_reaseon", sql.VarChar(sql.MAX), rejectReason || "")
      .execute("USP_Admin_Deposit_Approval");

    const row = result.recordset?.[0];

    if (!row) {
      return res.status(500).json({
        success: false,
        message: "No response returned from database."
      });
    }

    if (!row.Result) {
      return res.status(500).json({
        success: false,
        message: "Invalid response from database."
      });
    }

    const dbResponse = JSON.parse(row.Result);

    return res.status(Number(dbResponse.Status)).json(dbResponse);

  } catch (err) {
    console.error("Deposit Approval Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};