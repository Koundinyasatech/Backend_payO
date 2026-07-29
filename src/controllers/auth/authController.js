const sql = require("mssql");
const connectDB = require("../../config/db");           

// ======================register========================
exports.register = async (req, res) => {
  try {
    const { userId, name, email, referralCode } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({
        status: "0",
        message: "UserId is required"
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        status: "0",
        message: "Name is required"
      });
    }

    const pool = await connectDB();

    const request = pool.request();

    request.input("uid", sql.VarChar(10), String(userId));
    request.input("fname", sql.VarChar(500), name.trim());
    request.input("email", sql.VarChar(500), email || "");
    request.input("referedby", sql.VarChar(500), referralCode || "");

    const result = await request.execute("USP_User_Registrations_Phase2");
   
    // Search every recordset for Result column
    let sqlResponse = null;

    for (let i = 0; i < result.recordsets.length; i++) {
      const rs = result.recordsets[i];

      if (
        Array.isArray(rs) &&
        rs.length > 0 &&
        rs[0] &&
        rs[0].Result
      ) {
        sqlResponse = JSON.parse(rs[0].Result);
        break;
      }
    }

    if (!sqlResponse) {
      return res.status(500).json({
        status: "0",
        message: "Stored Procedure returned no response"
      });
    }

    return res.status(200).json({
      status: sqlResponse.Status,
      message: sqlResponse.Message,
      userId: sqlResponse.UserId || null,
      fullName: sqlResponse.FullName || null,
      email: sqlResponse.Email || null,
      referredByUserId: sqlResponse.ReferedByUserId || null
    });

  } catch (err) {

    return res.status(500).json({
      status: "0",
      message: err.message
    });
  }
};

// ======================login========================
exports.login = async (req, res) => {
  try {
    const { mobile, mobile_cont_code } = req.body;

    if (!mobile || !mobile_cont_code) {
      return res.status(400).json({
        status: "400",
        message: "Mobile number and country code are required."
      });
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("mobile", sql.VarChar(20), mobile)
      .input("mobile_cont_code", sql.VarChar(10), mobile_cont_code)
      .execute("USP_User_Login");

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(500).json({
        status: "500",
        message: "No response received from SQL Server."
      });
    }

    const jsonColumn = Object.keys(result.recordset[0])[0];
    const response = JSON.parse(result.recordset[0][jsonColumn]);

    if (response.Status === "0") {
      return res.status(400).json(response);
    }

    return res.status(200).json(response);

  } catch (error) {

    return res.status(500).json({
      status: "500",
      message: error.message
    });

  }
};

// ================= VERIFY LOGIN OTP =================
exports.verifyLoginOtp = async (req, res) => {
  try {

    const {
      mobile,
      country_code,
      otp,
      ipAddress,
      deviceId,
      deviceName,
      userAgent,
      location
    } = req.body;

    // Validation
    if (!mobile || !country_code || !otp) {
      return res.status(400).json({
        status: "400",
        message: "Mobile number and OTP are required."
      });
    }

    if (!ipAddress || !deviceId || !deviceName || !userAgent || !location) {
      return res.status(400).json({
        status: "400",
        message: "Device information is required."
      });
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("mobile", sql.VarChar(20), mobile)
      .input("country_code", sql.VarChar(20), country_code)
      .input("otp", sql.VarChar(20), otp)
      .input("otp_type", sql.VarChar(20), "L")
      .input("identifier", sql.VarChar(20), "M")
      .input("ipadd", sql.VarChar(500), ipAddress)
      .input("deviceid", sql.VarChar(5000), deviceId)
      .input("devicename", sql.VarChar(5000), deviceName)
      .input("user_agent", sql.VarChar(5000), userAgent)
      .input("Location", sql.VarChar(5000), location)
      .execute("USP_VerifyOTP");

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(500).json({
        status: "500",
        message: "No response received from SQL Server."
      });
    }

    const jsonColumn = Object.keys(result.recordset[0])[0];
    const response = JSON.parse(result.recordset[0][jsonColumn]);

    return res
      .status(Number(response.Status))
      .json(response);

  } catch (err) {

    return res.status(500).json({
      status: "500",
      message: err.message
    });

  }
};
 
// ====================== resend otp ======================
exports.resendOtp = async (req, res) => {
  try {

    const { mobile, countryCode } = req.body;

    if (!mobile || !countryCode) {
      return res.status(400).json({
        status: "400",
        message: "Mobile number and country code are required."
      });
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("mobile", sql.VarChar(20), mobile)
      .input("mobile_country_Code", sql.VarChar(10), countryCode)
      .input("action", sql.VarChar(20), "RESEND_OTP")
      .execute("USP_User_Resigtrations_Phase1");

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(500).json({
        status: "500",
        message: "No response received from SQL Server."
      });
    }

    const jsonColumn = Object.keys(result.recordset[0])[0];
    const response = JSON.parse(result.recordset[0][jsonColumn]);

    return res.status(Number(response.Status)).json({
      status: response.Status,
      message: response.Message,
      userId: response.UserId,
      otp: response.OTP,
      errorNumber: response.ErrorNumber
    });

  } catch (err) {

    return res.status(500).json({
      status: "500",
      message: err.message
    });

  }
};

// ====================verify otp========================
exports.verifyOtp = async (req, res) => {
  try {

    const { userId, otp, } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        status: "0",
        message: "UserId and OTP are required."
      });
    }

    const pool = await connectDB();

    const result = await pool
  .request()
  .input("uid", sql.BigInt, userId)
  .input("otp", sql.VarChar(20), otp)
  .input("otp_type", sql.VarChar(20), "R")
  .input("identifier", sql.VarChar(20), "M")
  .input("ipadd", sql.VarChar(500), "")
  .input("deviceid", sql.VarChar(5000), "")
  .input("devicename", sql.VarChar(5000), "")
  .input("user_agent", sql.VarChar(5000), "")
  .input("Location", sql.VarChar(5000), "")
  .execute("USP_VerifyOTP");

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(500).json({
        status: "0",
        message: "No response received from SQL Server."
      });
    }

    // Parse SQL JSON
    const jsonColumn = Object.keys(result.recordset[0])[0];
    const response = JSON.parse(result.recordset[0][jsonColumn]);

    if (response.Status === "0") {
      return res.status(400).json(response);
    }

    // Don't generate JWT here
    return res.status(200).json({
      status: response.Status,
      message: response.Message,
      userId: response.UserId
    });

  } catch (err) {

    return res.status(500).json({
      status: "0",
      message: err.message
    });

  }
};

// ======================send otp========================
exports.sendOtp = async (req, res) => {
  try {
    const { mobile, countryCode } = req.body;

    if (!mobile || !countryCode) {
      return res.status(400).json({
        message: "Mobile number and country code are required."
      });
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("mobile", sql.VarChar(20), mobile)
      .input("mobile_country_Code", sql.VarChar(10), countryCode)
      .execute("USP_User_Resigtrations_Phase1");

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(500).json({
        message: "No response received from SQL Server."
      });
    }
    // Since SP returns FOR JSON PATH
    const jsonColumn = Object.keys(result.recordset[0])[0];
    const response = JSON.parse(result.recordset[0][jsonColumn]);

    if (response.Status === "0") {
      return res.status(400).json({
        status: response.Status,
        message: response.Message,
        userId: response.UserId,
        otp: response.OTP,
        errorNumber: response.ErrorNumber
      });
    }

    return res.status(200).json({
      status: response.Status,
      message: response.Message,
      userId: response.UserId,
      otp: response.OTP
    });

  } catch (error) {
    console.error("Send OTP Error:", error);

    return res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};

// ================= set pin =================
exports.setPin = async (req, res) => {
  try {

    const {
      userId,
      pin,
      ipAddress,
      deviceId,
      deviceName,
      userAgent,
      location
    } = req.body;

    // ================= Validation =================

    if (!userId) {
      return res.status(400).json({
        status: "400",
        message: "UserId is required."
      });
    }

    if (!pin) {
      return res.status(400).json({
        status: "400",
        message: "Transaction PIN is required."
      });
    }

    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        status: "400",
        message: "PIN must be exactly 4 digits."
      });
    }

    if (!ipAddress) {
      return res.status(400).json({
        status: "400",
        message: "IP Address is required."
      });
    }

    if (!deviceId) {
      return res.status(400).json({
        status: "400",
        message: "Device Id is required."
      });
    }

    if (!deviceName) {
      return res.status(400).json({
        status: "400",
        message: "Device Name is required."
      });
    }

    if (!userAgent) {
      return res.status(400).json({
        status: "400",
        message: "User Agent is required."
      });
    }

    if (!location) {
      return res.status(400).json({
        status: "400",
        message: "Location is required."
      });
    }

    const pool = await connectDB();

    const request = pool.request();

    request.input("uid", sql.VarChar(10), String(userId));
    request.input("tpin", sql.VarChar(10), pin);
    request.input("ipadd", sql.VarChar(500), ipAddress);
    request.input("deviceid", sql.VarChar(500), deviceId);
    request.input("devicename", sql.VarChar(500), deviceName);
    request.input("user_agent", sql.VarChar(500), userAgent);
    request.input("Location", sql.VarChar(5000), location);

    const result = await request.execute(
      "USP_User_Tpin_Mpin_Registration"
    );

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(500).json({
        status: "500",
        message: "No response received from SQL Server."
      });
    }

    const response = JSON.parse(result.recordset[0].Result);

    return res
      .status(Number(response.Status))
      .json(response);

  } catch (err) {

    return res.status(500).json({
      status: "500",
      message: err.message
    });

  }
};

// ================= RESEND LOGIN OTP =================
exports.resendLoginOtp = async (req, res) => {
  try {

    const { mobile, mobile_cont_code } = req.body;

    // Validation
    if (!mobile || !mobile_cont_code) {
      return res.status(400).json({
        status: "400",
        message: "Mobile number and country code are required."
      });
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("mobile", sql.VarChar(20), mobile.trim())
      .input("mobile_cont_code", sql.VarChar(10), mobile_cont_code.trim())
      .input("action", sql.VarChar(20), "RESEND_OTP")
      .execute("USP_User_Login");

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(500).json({
        status: "500",
        message: "No response received from SQL Server."
      });
    }

    const jsonColumn = Object.keys(result.recordset[0])[0];
    const response = JSON.parse(result.recordset[0][jsonColumn]);

    return res
      .status(response.Status === "1" ? 200 : Number(response.Status))
      .json({
        status: response.Status,
        message: response.Message,
        userId: response.UserId,
        mobile: response.Mobile,
        mobileCountryCode: response.Mobile_Country_Code,
        otp: response.OTP,
        errorNumber: response.ErrorNumber
      });

  } catch (err) {

    return res.status(500).json({
      status: "500",
      message: err.message
    });

  }
};


//------profile---------
exports.getUserProfile = async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool
      .request()
      .input("session_token", sql.VarChar(500), req.sessionToken)
      .execute("USP_Get_User_Profile");

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(500).json({
        Status: 500,
        Message: "No response received from database."
      });
    }

    const response = JSON.parse(result.recordset[0].Result);

    return res.status(response.Status).json(response);

  } catch (err) {
    console.error("Get User Profile Error:", err);

    return res.status(500).json({
      Status: 500,
      Message: err.message
    });
  }
};
 