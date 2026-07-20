//adminKycController
const Kyc = require("../../models/Kyc");
const User = require("../../models/User");

const sql = require("mssql");
const connectDB = require("../../config/db");

const path = require("path");
const fs = require("fs");
//----get all kyc sublissions for admin-----
const getAllSubmissions = async (req, res) => {
  try {
    const adminSession = req.adminSession;

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("admin_session", sql.VarChar(sql.MAX), adminSession)
      .input("userid", sql.BigInt, 0)
      .execute("USP_Get_KYC_Details_Admin");

    const row = result.recordset[0];

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "No data returned from database",
      });
    }

    if (row.Result) {
      const error = JSON.parse(row.Result);

      return res.status(error.Status || 400).json({
        success: false,
        message: error.Message,
      });
    }

    const response = JSON.parse(
      row.KYCDocuments || '{"Total_Count":0,"Records":[]}'
    );

    return res.status(200).json({
      success: true,
      message: "KYC submissions fetched successfully",
      data: response,
    });

  } catch (err) {
    console.error("getAllSubmissions:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//-----get submission details by userId---
const getSubmissionDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminSession = req.adminSession;

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("admin_session", sql.VarChar(sql.MAX), adminSession)
      .input("userid", sql.BigInt, userId)
      .execute("USP_Get_KYC_Details_Admin");

    const row = result.recordset[0];

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "No data returned from database",
      });
    }

    if (row.Result) {
      const error = JSON.parse(row.Result);

      return res.status(error.Status || 400).json({
        success: false,
        message: error.Message,
      });
    }

    const response = JSON.parse(
      row.KYCDocuments || '{"Total_Count":0,"Records":[]}'
    );

    if (response.Total_Count === 0) {
      return res.status(404).json({
        success: false,
        message: "KYC record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "KYC submission details fetched successfully",
      data: response,
    });

  } catch (err) {
    console.error("getSubmissionDetails:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//----aprove or regect kyc submission by admin----
const approveRejectKyc = async (req, res) => {
  try {
    const adminSession = req.adminSession;
    const { docId } = req.params;
    const { response, rejectReason } = req.body;

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("admin_session", sql.VarChar(sql.MAX), adminSession)
      .input("doc_id", sql.BigInt, docId)
      .input("reponse", sql.VarChar(50), response)
      .input(
        "reject_reaseon",
        sql.VarChar(sql.MAX),
        rejectReason || ""
      )
      .execute("USP_Admin_KYC_Approval_Reject");

    const row = result.recordset[0];

    if (!row) {
      return res.status(500).json({
        success: false,
        message: "No response returned from database",
      });
    }

    const dbResponse = JSON.parse(row.Result);

    if (dbResponse.Status !== 200) {
      return res.status(dbResponse.Status).json({
        success: false,
        message: dbResponse.Message,
      });
    }

    return res.status(200).json({
      success: true,
      message: dbResponse.Message,
      data: {
        token: dbResponse.Token,
        documentId: dbResponse.DocumentId,
      },
    });

  } catch (err) {
    console.error("approveRejectKyc:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
module.exports = {
  getAllSubmissions,
  getSubmissionDetails,
  approveRejectKyc
};
