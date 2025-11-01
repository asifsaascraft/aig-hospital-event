// controllers/paymentController.js
import Razorpay from "razorpay";
import crypto from "crypto";
import Payment from "../models/Payment.js";
import EventRegistration from "../models/EventRegistration.js";
import Event from "../models/Event.js";
import Accompany from "../models/Accompany.js";
import sendEmailWithTemplate from "../utils/sendEmail.js";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

/* ========================================================
   1. Create Razorpay Order
   Route: POST /api/payments/create-order
   Access: Private (User)
======================================================== */
export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventRegistrationId, amount } = req.body;

    const registration = await EventRegistration.findById(eventRegistrationId);
    if (!registration)
      return res.status(404).json({ message: "Event registration not found" });

    const existingPayment = await Payment.findOne({
      userId,
      eventRegistrationId,
      status: "paid",
    });
    if (existingPayment)
      return res.status(400).json({ message: "Payment already completed" });

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${registration._id}`,
    };

    const order = await razorpay.orders.create(options);

    const payment = await Payment.create({
      userId,
      eventRegistrationId,
      amount,
      paymentCategory: "eventRegistration",
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
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ========================================================
   2. Verify Payment
   Route: POST /api/payments/verify
   Access: Private (User)
======================================================== */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } =
      req.body;

    // Verify Razorpay signature
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpaySignature)
      return res.status(400).json({ message: "Invalid payment signature" });

    const payment = await Payment.findById(paymentId);
    if (!payment)
      return res.status(404).json({ message: "Payment record not found" });

    const registration = await EventRegistration.findById(
      payment.eventRegistrationId
    );
    if (!registration)
      return res.status(404).json({ message: "Event registration not found" });

    const event = await Event.findById(registration.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Generate new registration number
    const lastPaidRegistration = await EventRegistration.findOne({
      eventId: registration.eventId,
      regNumGenerated: true,
    })
      .sort({ createdAt: -1 })
      .limit(1);

    let newRegNumInt;
    if (lastPaidRegistration && lastPaidRegistration.regNum) {
      const lastNum = parseInt(lastPaidRegistration.regNum.split("-").pop());
      newRegNumInt = lastNum + 1;
    } else {
      const baseNum = parseInt(event.regNum || 0);
      newRegNumInt = baseNum + 1;
    }

    const generatedRegNum = `${event.eventCode}-${newRegNumInt}`;

    // Update registration & payment
    registration.isPaid = true;
    registration.regNumGenerated = true;
    registration.regNum = generatedRegNum;
    await registration.save();

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = "paid";
    await payment.save();

    // ==============================================
    //  Send Emails (2 templates)
    // ==============================================
    try {
      const [registrationEmail, paymentEmail] = await Promise.allSettled([
        sendEmailWithTemplate({
          to: registration.email,
          name: registration.name,
          templateKey:
            "2518b.554b0da719bc314.k1.f7c9f490-a7f1-11f0-8b9c-8e9a6c33ddc2.199dbf3d259",
          mergeInfo: {
            name: registration.name,
            eventName: event.eventName,
            registrationNumber: registration.regNum,
            registrationSlabName: registration.registrationSlabName,
            startDate: event.startDate
              ? new Date(event.startDate).toLocaleDateString("en-IN")
              : "N/A",
            endDate: event.endDate
              ? new Date(event.endDate).toLocaleDateString("en-IN")
              : "N/A",
            mealPreference: registration.mealPreference,
            designation: registration.designation,
            affiliation: registration.affiliation,
            medicalCouncilRegistration: registration.medicalCouncilRegistration,
            medicalCouncilState: registration.medicalCouncilState,
            country: registration.country,
            city: registration.city,
          },

        }),
        sendEmailWithTemplate({
          to: registration.email,
          name: registration.name,
          templateKey:
            "2518b.554b0da719bc314.k1.2f2232e0-a7f2-11f0-8b9c-8e9a6c33ddc2.199dbf53d0e",
          mergeInfo: {
            name: registration.name,
            eventName: event.eventName,
            registrationNumber: registration.regNum,
            paymentAmount: payment.amount,
            razorpayPaymentId: payment.razorpayPaymentId,
            razorpayOrderId: payment.razorpayOrderId,
            paymentStatus: payment.status,
          },
        }),
      ]);
      
    } catch (err) {
      console.error("Email sending exception:", err);
    }

    res.status(200).json({
      success: true,
      message: "Payment verified and emails sent successfully",
      data: { payment, registration },
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ========================================================
   3. Get My Payments
   Route: GET /api/payments/my
   Access: Private (User)
======================================================== */
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

    // Fetch payment mode from Razorpay for each payment
    const paymentsWithMode = await Promise.all(
      payments.map(async (payment) => {
        if (payment.razorpayPaymentId) {
          try {
            const razorpayPayment = await razorpay.payments.fetch(payment.razorpayPaymentId);
            return {
              ...payment.toObject(),
              paymentMode: razorpayPayment.method || "Unknown", // e.g., 'card', 'netbanking', 'upi'
            };
          } catch (err) {
            console.error("Razorpay fetch error:", err);
            return {
              ...payment.toObject(),
              paymentMode: "Unknown",
            };
          }
        }
        return { ...payment.toObject(), paymentMode: "Unknown" };
      })
    );

    res.status(200).json({
      success: true,
      message: "Payments fetched successfully",
      data: paymentsWithMode,
    });
  } catch (error) {
    console.error("Get payments error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ========================================================
   4. Mark Payment as Failed
   Route: POST /api/payments/failed
   Access: Private (User)
======================================================== */
export const markPaymentFailed = async (req, res) => {
  try {
    const userId = req.user._id;
    const { paymentId, reason } = req.body;

    const payment = await Payment.findOne({ _id: paymentId, userId });
    if (!payment)
      return res.status(404).json({ message: "Payment not found" });

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

/* ========================================================
   5. Create Razorpay Order for Accompany Payment
   Route: POST /api/payments/accompany/create-order
   Access: Private (User)
======================================================== */
export const createAccompanyOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventRegistrationId, accompanyId, amount } = req.body;

    const accompany = await Accompany.findById(accompanyId);
    if (!accompany)
      return res.status(404).json({ message: "Accompany record not found" });

    const registration = await EventRegistration.findById(eventRegistrationId);
    if (!registration)
      return res.status(404).json({ message: "Event registration not found" });

    const existingPayment = await Payment.findOne({
      userId,
      accompanyId,
      status: "paid",
    });
    if (existingPayment)
      return res.status(400).json({ message: "Accompany payment already completed" });

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `accompany_${accompany._id}`,
    };

    const order = await razorpay.orders.create(options);

    const payment = await Payment.create({
      userId,
      eventRegistrationId,
      accompanyId,
      amount,
      paymentCategory: "accompany",
      razorpayOrderId: order.id,
      status: "initiated",
    });

    res.status(201).json({
      success: true,
      message: "Accompany order created successfully",
      data: {
        orderId: order.id,
        amount,
        currency: order.currency,
        paymentId: payment._id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Create accompany order error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ========================================================
   6. Verify Accompany Payment
   Route: POST /api/payments/accompany/verify
   Access: Private (User)
======================================================== */
export const verifyAccompanyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } =
      req.body;

    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpaySignature)
      return res.status(400).json({ message: "Invalid payment signature" });

    const payment = await Payment.findById(paymentId);
    if (!payment)
      return res.status(404).json({ message: "Payment record not found" });

    const accompany = await Accompany.findById(payment.accompanyId);
    if (!accompany)
      return res.status(404).json({ message: "Accompany record not found" });

    const registration = await EventRegistration.findById(payment.eventRegistrationId);
    if (!registration)
      return res.status(404).json({ message: "Event registration not found" });

    // Generate regNum for each accompany
    let counter = 1;
    accompany.accompanies.forEach((a) => {
      if (!a.isPaid) {
        a.isPaid = true;
        a.regNumGenerated = true;
        a.regNum = `${registration.regNum}-A${counter}`;
        counter++;
      }
    });

    await accompany.save();

    // Update payment record
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = "paid";
    await payment.save();

    res.status(200).json({
      success: true,
      message: "Accompany payment verified successfully",
      data: { payment, accompany },
    });
  } catch (error) {
    console.error("Verify accompany payment error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
