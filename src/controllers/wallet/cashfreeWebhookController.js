const CashfreePayment = require("../../models/CashfreePayment");
const Wallet = require("../../models/Wallet");
const Transaction = require("../../models/Transaction");
const { sendNotification } = require("../../utils/notify");

// ======================================================
// CASHFREE WEBHOOK
// ======================================================

exports.cashfreeWebhook = async (req, res) => {

    try {

        console.log("Cashfree Webhook Received");

        console.log(req.body);

        const data = req.body.data;

        if (!data) {
            return res.status(200).json({
                success: true
            });
        }

        const order = data.order;

        const payment = data.payment;

        if (!order || !payment) {
            return res.status(200).json({
                success: true
            });
        }

        const orderId = order.order_id;

        const paymentStatus = payment.payment_status;

        const cfPaymentId = payment.cf_payment_id;

        const paymentMethod = payment.payment_method;

        const cashfreePayment = await CashfreePayment.findOne({
            orderId
        });

        if (!cashfreePayment) {

            return res.status(200).json({
                success: true
            });

        }

        // Already credited
        if (cashfreePayment.paymentStatus === "SUCCESS") {

            return res.status(200).json({
                success: true
            });

        }

        // Failed payment
        if (paymentStatus !== "SUCCESS") {

            cashfreePayment.paymentStatus = paymentStatus;
            cashfreePayment.webhookResponse = req.body;

            await cashfreePayment.save();

            return res.status(200).json({
                success: true
            });

        }

        cashfreePayment.paymentStatus = "SUCCESS";
        cashfreePayment.cfPaymentId = cfPaymentId;
        cashfreePayment.paymentMethod = paymentMethod;
        cashfreePayment.webhookResponse = req.body;

        await cashfreePayment.save();

        const wallet = await Wallet.findOne({
            userId: cashfreePayment.userId
        });

        if (!wallet) {

            return res.status(200).json({
                success: true
            });

        }

        wallet.balance += cashfreePayment.amount;

        await wallet.save();

        await Transaction.create({

            userId: cashfreePayment.userId,

            senderWallet: "CASHFREE",

            receiverWallet: wallet.walletAddress,

            amount: cashfreePayment.amount,

            status: "success"

        });

        await sendNotification({

            userId: cashfreePayment.userId,

            title: "Wallet Credited",

            message: `₹${cashfreePayment.amount} added successfully.`,

            type: "PAYMENT"

        });

        return res.status(200).json({
            success: true
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false
        });

    }

};