const bcrypt = require("bcrypt");
const jwt    = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const sql = require("mssql");
const connectDB = require("../../config/db");

const User        = require("../../models/User");
const Otp         = require("../../models/Otp");
const Wallet      = require("../../models/Wallet");
const Transaction = require("../../models/Transaction");
const Kyc         = require("../../models/Kyc");           // ← NEW
const { sendNotification } = require("../../utils/notify");
const { generateWalletAddress, generateQR } = require("../../utils/helpers");

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
// ── KEY CHANGE: checks KYC status and tells app where to send user ──────────
// exports.login = async (req, res) => {
//   try {
//     const { email, mobile, password } = req.body;

//     // find user
//     const user = email
//       ? await User.findOne({ email })
//       : await User.findOne({ mobile });

//     if (!user) return res.status(400).json({ message: "User not found" });

//     // check password
//     const match = await bcrypt.compare(password, user.password);
//     if (!match) return res.status(400).json({ message: "Wrong password" });

//     // ── KYC STATUS CHECK ──────────────────────────────────────────────────
//     // Check KYC record to know the exact status
//     const kyc = await Kyc.findOne({ userId: user._id });

//     const kycStatus = kyc ? kyc.status : "not_started";

//     // Block login ONLY if KYC was rejected (they must retry)
//     // Allow login for not_started, documents_uploaded, under_review, approved
//     if (kycStatus === "rejected") {
//       return res.status(403).json({
//         message:   "Your KYC verification failed. Please retry.",
//         kycStatus: "rejected",
//         action:    "retry_kyc",  // tells app to show retry screen
//       });
//     }

//     // generate token
//     const token = jwt.sign(
//       { id: user._id, mobile: user.mobile },
//       "mysecretkey",
//       { expiresIn: "24h" } 
//     );

//     await sendNotification({
//       userId:  user._id,
//       title:   "Login Alert",
//       message: "You logged into your account",
//       type:    "SECURITY",
//     });

//     // ── Tell the app exactly where to navigate ────────────────────────────
//     let redirectTo = "home"; // default — KYC approved, full access

//     if (kycStatus === "not_started") {
//       redirectTo = "kyc_upload";      // → go to Screen 1 (upload docs)
//     } else if (kycStatus === "documents_uploaded" || kycStatus === "under_review") {
//       redirectTo = "kyc_under_review"; // → go to Screen 4 (waiting)
//     } else if (kycStatus === "approved") {
//       redirectTo = "home";             // → full app access
//     }

//     res.json({
//       message:   "Login success",
//       token,
//       kycStatus,
//       redirectTo,  // ← front-end uses this to navigate to correct screen
//       user: {
//         id:              user._id,
//         name:            user.name,
//         email:           user.email,
//         mobile:          user.mobile,
//         kycVerified:     user.kycVerified,
//         walletActivated: user.walletActivated,
//       },
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };
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

// ================= change transaction pin =================
exports.changePin = async (req, res) => {
  try {
    const { old_pin, new_pin } = req.body;

    if (!old_pin || !new_pin) return res.status(400).json({ message: "Old PIN and New PIN are required" });
    if (!/^\d{4}$/.test(new_pin)) return res.status(400).json({ message: "New PIN must be 4 digits" });
    if (!req.userId) return res.status(401).json({ message: "Invalid token" });

    const user = await User.findById(req.userId);
    if (!user || !user.transactionPin) return res.status(404).json({ message: "User or PIN not found" });

    const isMatch = await bcrypt.compare(old_pin, user.transactionPin);
    if (!isMatch) return res.status(400).json({ message: "Old PIN is incorrect" });

    const isSame = await bcrypt.compare(new_pin, user.transactionPin);
    if (isSame) return res.status(400).json({ message: "New PIN cannot be same as old PIN" });

    user.transactionPin = await bcrypt.hash(new_pin, 10);
    await user.save();

    res.json({ message: "PIN changed successfully" });

  } catch (err) {
    res.status(500).json({ message: "Error changing PIN" });
  }
};

// ================= Resend Login OTP =================
// exports.sendLoginOtp = async (req, res) => {
//   try {
// console.log("Headers:", req.headers);
//     console.log("Body:", req.body);

//     const { mobile, mobile_cont_code } = req.body;

//     // Validation
//     if (!mobile || !mobile_cont_code) {
//       return res.status(400).json({
//         status: "400",
//         message: "Mobile number and country code are required."
//       });
//     }

//     const pool = await connectDB();

//     const result = await pool
//       .request()
//       .input("mobile", sql.VarChar(20), mobile)
//       .input("mobile_cont_code", sql.VarChar(10), mobile_cont_code)
//       .execute("USP_User_Login");

//     console.log("Send Login OTP SQL Result:", result.recordset);

//     if (!result.recordset || result.recordset.length === 0) {
//       return res.status(500).json({
//         status: "500",
//         message: "No response received from SQL Server."
//       });
//     }

//     const jsonColumn = Object.keys(result.recordset[0])[0];
//     const response = JSON.parse(result.recordset[0][jsonColumn]);

//     console.log("Send Login OTP Response:", response);

//     if (response.Status !== "1") {
//       return res.status(Number(response.Status)).json(response);
//     }

//     return res.status(200).json(response);

//   } catch (err) {

//     console.error("Send Login OTP Error:", err);

//     return res.status(500).json({
//       status: "500",
//       message: err.message
//     });

//   }
// };

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
// ================= reset password =================
exports.resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) return res.status(400).json({ message: "All fields required" });
    if (password !== confirmPassword) return res.status(400).json({ message: "Passwords mismatch" });

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: "Use 8+ chars with uppercase, lowercase, number & special character" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isSame = await bcrypt.compare(password, user.password);
    if (isSame) return res.status(400).json({ message: "New password cannot be same as old password" });

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    if (req.mobile) await Otp.deleteOne({ mobile: req.mobile });

    res.json({ message: "Password changed successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= reset verify otp =================
exports.resetVerifyOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    const record = await Otp.findOne({ mobile });

    if (!record || !record.otp) return res.status(400).json({ message: "OTP not found" });
    if (record.expiresAt < Date.now()) return res.status(400).json({ message: "Expired OTP" });

    const isMatch = await bcrypt.compare(String(otp).trim(), record.otp);
    if (!isMatch) return res.status(400).json({ message: "Invalid OTP" });

    record.isVerified = true;
    await record.save();

    const token = jwt.sign({ mobile }, "mysecretkey", { expiresIn: "24h" });
    return res.json({ message: "OTP verified", token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= reset send otp =================
exports.resetSendOtp = async (req, res) => {
  const { mobile } = req.body;

  if (!/^[0-9]{10}$/.test(mobile)) return res.status(400).json({ message: "Invalid mobile" });

  const existingUser = await User.findOne({ mobile });
  if (!existingUser) return res.status(400).json({ message: "Mobile number not registered" });

  const otp       = Math.floor(1000 + Math.random() * 9000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);

  await Otp.findOneAndUpdate(
    { mobile },
    { $set: { otp: hashedOtp, isVerified: false, expiresAt: Date.now() + 2 * 60 * 1000 } },
    { upsert: true, returnDocument: "after" }
  );

  console.log("OTP:", otp);
  res.json({ message: "OTP sent", otp });
};