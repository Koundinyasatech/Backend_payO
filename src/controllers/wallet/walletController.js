const sql = require("mssql");
const connectDB = require("../../config/db");
// ================= addMoneyToWallet =================
exports.addMoneyToWallet = async (req, res) => {
  try {
 
    const sessionToken = req.sessionToken;
 
    const {
      amount,
      transactionId,
      paymentMode,
      gatewayName,
      userWallet
    } = req.body;
 
    const pool = await connectDB();
 
    const result = await pool
      .request()
      .input("user_session", sql.VarChar(250), sessionToken)
      .input("amount", sql.VarChar(20), amount)
      .input("transaction_id", sql.VarChar(100), transactionId)
      .input("payment_mode", sql.VarChar(50), paymentMode)
      .input("gateway_name", sql.VarChar(50), gatewayName)
      .input("user_wallet", sql.VarChar(50), userWallet)
      .execute("USP_Add_Money_To_Wallet");
 
    if (!result.recordset || result.recordset.length === 0) {
      return res.status(500).json({
        Status: 500,
        Message: "No response received from SQL Server"
      });
    }
 
    const row = result.recordset[0];
 
    let response;
 
    if (row.Result) {
      response = JSON.parse(row.Result);
    } else {
      response = row;
    }
 
    return res
      .status(Number(response.Status))
      .json(response);
 
  } catch (err) {
 
    console.error(err);
 
    return res.status(500).json({
      Status: 500,
      Message: err.message
    });
 
  }
};
 
 
// ================= GET WALLET DETAILS =================
exports.getWalletDetails = async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool
      .request()
      .input("sessio_token", sql.VarChar(500), req.sessionToken)
      .execute("USP_Get_Wallet_Details");

    const row = result.recordset[0];

    if (!row) {
      return res.status(500).json({
        success: false,
        message: "No response returned from database",
      });
    }

    // Error Response
    if (row.Result) {
      const dbResponse = JSON.parse(row.Result);

      return res.status(parseInt(dbResponse.Status)).json({
        success: false,
        message: dbResponse.Message,
        errorNumber: dbResponse.ErrorNumber || null,
      });
    }

    // Success Response
    const walletDetails = row.WalletDetails
      ? JSON.parse(row.WalletDetails)
      : [];

    return res.status(200).json({
      success: true,
      message: "Wallet details fetched successfully.",
      data: walletDetails,
    });

  } catch (err) {
    console.error("Get Wallet Details Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};