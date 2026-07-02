const mongoose = require("mongoose");

const cashfreePaymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      required: true
    },

    cfPaymentId: {
      type: String,
      default: null
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: "INR"
    },

    paymentStatus: {
      type: String,
      enum: [
        "PENDING",
        "SUCCESS",
        "FAILED",
        "CANCELLED"
      ],
      default: "PENDING"
    },

  paymentMethod: {
  type: mongoose.Schema.Types.Mixed,
  default: {}
},

    customerName: String,

    customerEmail: String,

    customerPhone: String,

    cashfreeOrderResponse: {
      type: Object,
      default: {}
    },

    webhookResponse: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "CashfreePayment",
  cashfreePaymentSchema
);