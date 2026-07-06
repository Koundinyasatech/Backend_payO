const { v4: uuidv4 } = require("uuid");

const User = require("../../models/User");
const Wallet = require("../../models/Wallet");
const Transaction = require("../../models/Transaction");
const CashfreePayment = require("../../models/CashfreePayment");

const cashfreeService = require("../../services/cashfreeService");

const { sendNotification } = require("../../utils/notify");

// ======================================================
// CREATE PAYMENT ORDER
// ======================================================

exports.createDepositOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount"
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const orderId = "PAYO_" + Date.now();

    const order = await cashfreeService.createOrder({
      orderId,
      amount: Number(amount),
      customerId: user._id.toString(),
      customerName: user.name,
      customerEmail: user.email || "demo@payo.com",
      customerPhone: user.mobile
    });

    await CashfreePayment.create({
      orderId,
      userId: user._id,
      amount: Number(amount),
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.mobile,
      cashfreeOrderResponse: order
    });

  res.json({
    success: true,
    orderId,
    paymentSessionId: order.payment_session_id
});

  } catch (err) {

    console.log(err.response?.data || err);

    res.status(500).json({
      success: false,
      message: "Unable to create order"
    });

  }
};

// ======================================================
// VERIFY PAYMENT
// ======================================================

exports.verifyDeposit = async (req, res) => {

  try {

    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order Id required"
      });
    }

    const payment = await CashfreePayment.findOne({
      orderId
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    const payments =
      await cashfreeService.getOrderPayments(orderId);

    if (!payments || payments.length === 0) {

      return res.status(400).json({
        success: false,
        message: "Payment not completed"
      });

    }

    const successPayment = payments.find(
      p => p.payment_status === "SUCCESS"
    );

    if (!successPayment) {

      return res.status(400).json({
        success: false,
        message: "Payment pending"
      });

    }

    if (payment.paymentStatus === "SUCCESS") {

      return res.json({
        success: true,
        message: "Already credited"
      });

    }

    payment.paymentStatus = "SUCCESS";
    payment.cfPaymentId = successPayment.cf_payment_id;
    payment.paymentMethod = successPayment.payment_method;
    payment.webhookResponse = successPayment;

    await payment.save();


return res.json({
  success: true,
  message: "Payment verified successfully"
});

  }

  catch (err) {

    console.log(err.response?.data || err);

    res.status(500).json({

      success: false,

      message: "Verification failed"

    });

  }

};

// ======================================================
// PAYMENT HISTORY
// ======================================================

exports.depositHistory = async (req, res) => {

  try {

    const history = await CashfreePayment.find({

      userId: req.userId

    }).sort({

      createdAt: -1

    });

    res.json({

      success: true,

      data: history

    });

  }

  catch (err) {

    res.status(500).json({

      success: false,

      message: "Server error"

    });

  }

};