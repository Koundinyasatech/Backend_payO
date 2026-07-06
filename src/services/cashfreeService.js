const axios = require("axios");

const BASE_URL =
  process.env.CASHFREE_ENV === "PROD"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

const headers = () => ({
  "x-client-id": process.env.CASHFREE_APP_ID,
  "x-client-secret": process.env.CASHFREE_SECRET_KEY,
  "x-api-version": "2023-08-01",
  "Content-Type": "application/json"
});

// ==============================
// Create Order
// ==============================
exports.createOrder = async ({
  orderId,
  amount,
  customerId,
  customerName,
  customerEmail,
  customerPhone
}) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/orders`,
      {
        order_id: orderId,

        order_amount: amount,

        order_currency: "INR",

        customer_details: {
          customer_id: customerId,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone
        },

       order_meta: {
  return_url:
    `${process.env.FRONTEND_URL}/wallet/success?order_id={order_id}`,

  notify_url:
    `${process.env.NGROK_URL}/api/cashfree/webhook`
}
      },
      {
        headers: headers()
      }
    );

    return response.data;
  } catch (err) {
    console.log(
      "Cashfree Create Order Error",
      err.response?.data || err.message
    );

    throw err;
  }
};

// ==============================
// Fetch Order
// ==============================
exports.fetchOrder = async (orderId) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/orders/${orderId}`,
      {
        headers: headers()
      }
    );

    return response.data;
  } catch (err) {
    console.log(
      "Cashfree Fetch Order Error",
      err.response?.data || err.message
    );

    throw err;
  }
};

// ==============================
// Fetch Payment
// ==============================
exports.fetchPayment = async (
  orderId,
  paymentId
) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/orders/${orderId}/payments/${paymentId}`,
      {
        headers: headers()
      }
    );

    return response.data;
  } catch (err) {
    console.log(
      "Cashfree Payment Error",
      err.response?.data || err.message
    );

    throw err;
  }
};

// ==============================
// Get Payments of Order
// ==============================
exports.getOrderPayments = async (
  orderId
) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/orders/${orderId}/payments`,
      {
        headers: headers()
      }
    );

    return response.data;
  } catch (err) {
    console.log(
      "Cashfree Payments Error",
      err.response?.data || err.message
    );

    throw err;
  }
};