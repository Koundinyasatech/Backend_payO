const sql = require("mssql");
const connectDB = require("../../config/db");
const fs = require("fs");
const path = require("path");

// ================= Helpers =================

const toPublicUrl = (req, filePath) => {
  if (!filePath) return null;

  const relativePath = path.relative(
    path.join(__dirname, "../../uploads"),
    filePath
  );

  return `${req.protocol}://${req.get("host")}/kyc-docs/${relativePath.replace(/\\/g, "/")}`;
};

const getExtension = (base64Data) => {

  if (!base64Data.startsWith("data:")) {
    throw new Error("Invalid Base64 format");
  }

  const mimeType = base64Data.split(";")[0].split(":")[1];

  switch (mimeType) {
    case "application/pdf":
      return ".pdf";

    case "image/jpeg":
      return ".jpg";

    case "image/png":
      return ".png";

    case "image/webp":
      return ".webp";

    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
};

// ================= GET KYC DETAILS =================

exports.getKycDetails = async (req, res) => {
  try {

    const sessionToken = req.headers.authorization?.replace("Bearer ", "");

    if (!sessionToken) {
      return res.status(401).json({
        status: "401",
        message: "Session token is required."
      });
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("session_token", sql.VarBinary(sql.MAX), Buffer.from(sessionToken))
      .execute("USP_Get_KYC_Details");

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(500).json({
        status: "500",
        message: "No response received from SQL Server."
      });
    }

    if (result.recordset[0].Result) {

      const response = JSON.parse(result.recordset[0].Result);

      return res.status(Number(response.Status)).json(response);
    }

    let kycDocuments = [];

    if (result.recordset[0].KYCDocuments) {
      kycDocuments = JSON.parse(result.recordset[0].KYCDocuments);
    }

    return res.status(200).json({
      status: "200",
      message: "KYC details fetched successfully.",
      data: kycDocuments
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      status: "500",
      message: err.message
    });

  }
};

// ================= UPLOAD KYC DOCUMENTS =================

exports.uploadKycDocument = async (req, res) => {
  try {

    const sessionToken = req.sessionToken;

    if (!sessionToken) {
      return res.status(401).json({
        status: "401",
        message: "Session token is required."
      });
    }

    const { documents } = req.body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({
        status: "400",
        message: "Documents are required."
      });
    }

    const uploadDir = path.join(__dirname, "../../uploads/kyc");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const pool = await connectDB();

    const responses = [];

    for (const doc of documents) {


      let frontImageUrl = "";
      let backImageUrl = "";

      // ---------------- FRONT IMAGE ----------------

      if (doc.frontImage) {

        const extension = getExtension(doc.frontImage);

        const fileName = `${Date.now()}_${doc.documentType}_front${extension}`;

        const filePath = path.join(uploadDir, fileName);

        const base64 = doc.frontImage.replace(/^data:.+;base64,/, "");

        fs.writeFileSync(filePath, Buffer.from(base64, "base64"));

        frontImageUrl = toPublicUrl(req, filePath);
      }

      // ---------------- BACK IMAGE ----------------

      if (doc.backImage) {

        const extension = getExtension(doc.backImage);

        const fileName = `${Date.now()}_${doc.documentType}_back${extension}`;

        const filePath = path.join(uploadDir, fileName);

        const base64 = doc.backImage.replace(/^data:.+;base64,/, "");

        fs.writeFileSync(filePath, Buffer.from(base64, "base64"));

        backImageUrl = toPublicUrl(req, filePath);
      }

      const result = await pool
        .request()
        .input("session_token", sql.VarBinary(sql.MAX), Buffer.from(sessionToken))
        .input("doc_type", sql.VarChar(500), doc.documentType)
        .input("front_img", sql.VarChar(sql.MAX), frontImageUrl)
        .input("back_img", sql.VarChar(sql.MAX), backImageUrl)
        .execute("USP_KYC_Documents_Upload");

      if (!result.recordset || result.recordset.length === 0) {

        responses.push({
          documentType: doc.documentType,
          status: "500",
          message: "No response received from SQL Server."
        });

        continue;
      }

      const jsonColumn = Object.keys(result.recordset[0])[0];
      const response = JSON.parse(result.recordset[0][jsonColumn]);

      responses.push({
        documentType: doc.documentType,
        ...response
      });

    }

    return res.status(200).json({
      status: "200",
      message: "KYC documents processed successfully.",
      data: responses
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      status: "500",
      message: err.message
    });

  }
};