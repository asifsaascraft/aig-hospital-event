// controllers/paymentController.js
import Razorpay from "razorpay";
import crypto from "crypto";
import Payment from "../models/Payment.js";
import EventRegistration from "../models/EventRegistration.js";
import Event from "../models/Event.js";
import sendEmailWithTemplate from "../utils/sendEmail.js";

//  Initialize Razorpay
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
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } =
      req.body;

    //  Verify Razorpay signature
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    //  Find Payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    //  Find related registration
    const registration = await EventRegistration.findById(
      payment.eventRegistrationId
    );
    if (!registration) {
      return res.status(404).json({ message: "Event registration not found" });
    }

    //  Find related event
    const event = await Event.findById(registration.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Find the latest paid registration for this event
    const lastPaidRegistration = await EventRegistration.findOne({
      eventId: registration.eventId,
      regNumGenerated: true,
    })
      .sort({ createdAt: -1 }) // latest registration
      .limit(1);

    let newRegNumInt;
    if (lastPaidRegistration && lastPaidRegistration.regNum) {
      // Extract numeric part from regNum (e.g. AIG25-1001 → 1001)
      const lastNum = parseInt(lastPaidRegistration.regNum.split("-").pop());
      newRegNumInt = lastNum + 1;
    } else {
      // No previous registration → start from event.regNum + 1
      const baseNum = parseInt(event.regNum || 0);
      newRegNumInt = baseNum + 1;
    }

    // Final Reg Number format
    const generatedRegNum = `${event.eventCode}-${newRegNumInt}`;

    //  Update Registration
    registration.isPaid = true;
    registration.regNumGenerated = true;
    registration.regNum = generatedRegNum;
    await registration.save();

    //  Update Payment
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = "paid";
    await payment.save();

    // Send Confirmation Email
    try {
      await sendEmailWithTemplate({
        to: registration.email,
        name: registration.name,
        templateKey:
          "2518b.554b0da719bc314.k1.69b32810-a4ff-11f0-8b9c-8e9a6c33ddc2.199c8a2c511",
        mergeInfo: {
          // Basic Info
          name: registration.name,
          eventName: event.eventName,
          eventCode: event.eventCode,
          registrationNumber: registration.regNum,
          registrationSlabName: registration.registrationSlabName,

          // Event Dates
          startDate: event.startDate?.toLocaleDateString("en-IN"),
          endDate: event.endDate?.toLocaleDateString("en-IN"),

          // Registration Info
          designation: registration.designation,
          affiliation: registration.affiliation,
          medicalCouncilState: registration.medicalCouncilState,
          medicalCouncilRegistration: registration.medicalCouncilRegistration,
          mealPreference: registration.mealPreference,
          country: registration.country,
          city: registration.city,

          // Payment Info
          paymentAmount: payment.amount,
          razorpayOrderId: payment.razorpayOrderId,
          razorpayPaymentId: payment.razorpayPaymentId,
          paymentStatus: payment.status,
        },
      });
    } catch (err) {
      console.error(" Email sending failed:", err);
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        payment,
        registration,
      },
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
        populate: {
          path: "eventId",
          select: "eventName shortName startDate endDate",
        },
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

/* 
========================================================
  4. Mark Payment as Failed
  Route: POST /api/payments/failed
  Access: Private (User)
========================================================
*/
export const markPaymentFailed = async (req, res) => {
  try {
    const userId = req.user._id;
    const { paymentId, reason } = req.body;

    const payment = await Payment.findOne({ _id: paymentId, userId });
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    payment.status = "failed";
    payment.failedReason = reason || "User payment failed";
    await payment.save();

    res.status(200).json({
      success: true,
      message: "Payment marked as failed",
      data: payment,
    });
  } catch (error) {
    console.error("Mark payment failed error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
