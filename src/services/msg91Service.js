const axios = require("axios");
const https = require("https");

// MSG91 Flow API Endpoint
const MSG91_FLOW_URL = "https://control.msg91.com/api/v5/flow/";

// HTTPS Agent with Keep-Alive for persistent TLS socket reuse (reduces latency)
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 50 });
const msg91Axios = axios.create({ httpsAgent, timeout: 10000 });

/**
 * Helper: Normalize mobile number and country code
 * Strips non-digits and ensures no duplicate country code prefix
 *
 * @param {string} mobile 
 * @param {string} countryCode 
 * @returns {string} E.164-compatible mobile without '+' (e.g. 917841049343)
 */
const formatRecipientMobile = (mobile, countryCode = "91") => {
  const country = String(countryCode || "91").replace(/\D/g, "").trim();
  let mob = String(mobile || "").replace(/\D/g, "").trim();

  // Strip country prefix if already included (e.g. 919876543210 -> 9876543210)
  if (mob.startsWith(country) && mob.length > 10) {
    mob = mob.slice(country.length);
  }

  return `${country}${mob}`;
};

/**
 * Core dispatcher function for MSG91 Flow API
 *
 * @param {string} fullMobile - Normalized mobile number with country code
 * @param {object} variables  - Flow template variables
 * @returns {Promise<{success: boolean, message: string, data?: any}>}
 */
const sendMsg91Flow = async (fullMobile, variables = {}) => {
  const authKey    = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  const senderId   = process.env.MSG91_SENDER_ID || "BEHAVX";
  const dltTeId    = process.env.MSG91_DLT_TE_ID;

  // Guard: credentials must be configured
  if (!authKey || !templateId) {
    console.warn(`[MSG91] Missing credentials for recipient: ${fullMobile}`);
    return { success: false, message: "MSG91 credentials not configured." };
  }

  const payload = {
    template_id: templateId,
    short_url:   "0",
    sender:      senderId,
    ...(dltTeId ? { dlt_te_id: dltTeId } : {}),
    recipients: [{
      mobiles: fullMobile,
      ...variables
    }]
  };

  try {
    const response = await msg91Axios.post(MSG91_FLOW_URL, payload, {
      headers: {
        authkey: authKey,
        "Content-Type": "application/json"
      }
    });

    return {
      success: true,
      message: "SMS sent successfully via MSG91",
      data: response.data
    };
  } catch (error) {
    const errData = error.response ? error.response.data : error.message;
    console.error(`[MSG91 ❌] Failed to send SMS to ${fullMobile}:`, errData);

    return {
      success: false,
      message: typeof errData === "object" ? JSON.stringify(errData) : errData
    };
  }
};

/**
 * Send 4-Digit OTP via MSG91 Flow API
 *
 * @param {string} mobile       - Recipient mobile number (10 digits)
 * @param {string} countryCode  - Country code (e.g. "91" or "+91")
 * @param {string|number} otp   - 4-digit OTP to send
 * @returns {Promise<{success: boolean, message: string, otp?: string, data?: any}>}
 */
const sendOtpViaMsg91 = async (mobile, countryCode = "91", otp) => {
  const fullMobile = formatRecipientMobile(mobile, countryCode);

  // Enforce strictly 4-digit OTP
  let otpStr = String(otp || "").trim();
  if (!/^\d{4}$/.test(otpStr)) {
    otpStr = Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Template variable fallbacks to ensure compatibility with various MSG91 template placeholder keys
  const variables = {
    otp:  otpStr,
    OTP:  otpStr,
    var:  otpStr,
    var1: otpStr,
    code: otpStr
  };

  const result = await sendMsg91Flow(fullMobile, variables);

  return {
    ...result,
    otp: otpStr,
    message: result.success ? "4-Digit OTP sent via MSG91" : result.message
  };
};

/**
 * Send custom SMS via MSG91 Flow API
 *
 * @param {string}        mobile      - Recipient mobile number
 * @param {string}        countryCode - Country code (e.g. "91")
 * @param {object|string} variables   - Template variables object or message string
 * @returns {Promise<{success: boolean, message: string, data?: any}>}
 */
const sendCustomSmsViaMsg91 = async (mobile, countryCode = "91", variables = {}) => {
  const fullMobile = formatRecipientMobile(mobile, countryCode);
  const varObj = typeof variables === "object" ? variables : { var: String(variables), var1: String(variables) };

  return sendMsg91Flow(fullMobile, varObj);
};

module.exports = {
  sendOtpViaMsg91,
  sendCustomSmsViaMsg91
};
