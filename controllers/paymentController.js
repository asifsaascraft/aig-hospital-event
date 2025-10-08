// controllers/paymentController.js
import Razorpay from "razorpay";
import crypto from "crypto";
import Payment from "../models/Payment.js";
import EventRegistration from "../models/EventRegistration.js";

// 🪙 Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

/* 
========================================================
  1. Create Razorpay Order
  Route: POST /api/payments/create-order
  Access: Private (User)
========================================================
*/
export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventRegistrationId, amount } = req.body;

    // Validate event registration
    const registration = await EventRegistration.findById(eventRegistrationId);
    if (!registration) {
      return res.status(404).json({ message: "Event registration not found" });
    }

    // Check if already paid
    const existingPayment = await Payment.findOne({
      userId,
      eventRegistrationId,
      status: "paid",
    });
    if (existingPayment) {
      return res.status(400).json({ message: "Payment already completed" });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency: "INR",
      receipt: `receipt_${registration._id}`,
    };

    const order = await razorpay.orders.create(options);

    // Save payment record
    const payment = await Payment.create({
      userId,
      eventRegistrationId,
      amount,
      razorpayOrderId: order.id,
      status: "initiated",
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        orderId: order.id,
        amount,
        currency: order.currency,
        paymentId: payment._id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID, // For frontend checkout
      },
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* 
========================================================
  2. Verify Payment after Success
  Route: POST /api/payments/verify
  Access: Private (User)
========================================================
*/
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentId,
    } = req.body;

    // Verify the signature
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Update payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = "paid";
    await payment.save();

    // Update registration as paid
    await EventRegistration.findByIdAndUpdate(payment.eventRegistrationId, {
      isPaid: true,
    });

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* 
========================================================
  3. Get My Payments
  Route: GET /api/payments/my
  Access: Private (User)
========================================================
*/
export const getMyPayments = async (req, res) => {
  try {
    const userId = req.user._id;

    const payments = await Payment.find({ userId })
      .populate({
        path: "eventRegistrationId",
        populate: { path: "eventId", select: "title startDate endDate" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Payments fetched successfully",
      data: payments,
    });
  } catch (error) {
    console.error("Get payments error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
