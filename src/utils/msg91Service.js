const axios = require('axios');

class Msg91Service {
  constructor() {
    this.authKey = process.env.MSG91_AUTHKEY;
    this.baseURL = 'https://control.msg91.com/api/v5';
    this.senderId = process.env.MSG91_SENDER_ID || 'PAYO';
  }

  // Send OTP
  async sendOtp(mobile, templateId = null) {
    try {
      const response = await axios.post(
        `${this.baseURL}/otp`,
        {
          mobile: `91${mobile}`,
          template_id: templateId || process.env.MSG91_TEMPLATE_ID,
          sender_id: this.senderId,
          authkey: this.authKey
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('MSG91 Send OTP Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Verify OTP
  async verifyOtp(mobile, otp) {
    try {
      const response = await axios.post(
        `${this.baseURL}/otp/verify`,
        {
          mobile: `91${mobile}`,
          otp: otp,
          authkey: this.authKey
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('MSG91 Verify OTP Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Resend OTP
  async resendOtp(mobile) {
    try {
      const response = await axios.post(
        `${this.baseURL}/otp/resend`,
        {
          mobile: `91${mobile}`,
          authkey: this.authKey
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('MSG91 Resend OTP Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send SMS (for other notifications)
  async sendSms(mobile, message, templateId = null) {
    try {
      const response = await axios.post(
        `${this.baseURL}/sms`,
        {
          mobile: `91${mobile}`,
          message: message,
          template_id: templateId,
          sender_id: this.senderId,
          authkey: this.authKey
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('MSG91 Send SMS Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new Msg91Service();