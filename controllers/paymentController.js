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

    const registration = await EventRegistration.findById(payment.eventRegistrationId)
      .populate("registrationSlabId", "slabName");
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
      const slabName = registration.registrationSlabId?.slabName || "N/A";

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
            registrationSlabName: slabName,
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
    const { eventRegistrationId, accompanyId, accompanyItemIds, amount } = req.body;

    if (!accompanyId || !Array.isArray(accompanyItemIds) || accompanyItemIds.length === 0) {
      return res.status(400).json({ message: "accompanyId and accompanyItemIds are required" });
    }

    // Fetch accompany document
    const accompany = await Accompany.findById(accompanyId);
    if (!accompany) {
      return res.status(404).json({ message: "Accompany record not found" });
    }

    // Filter valid items to pay now (unpaid ones only)
    const unpaidItems = accompany.accompanies.filter((a) =>
      accompanyItemIds.includes(a._id.toString()) && a.isPaid === false
    );

    if (unpaidItems.length === 0) {
      return res.status(400).json({
        message: "No unpaid accompany items found for payment. Please check selection.",
      });
    }

    // Verify registration ownership & payment status
    const registration = await EventRegistration.findOne({
      _id: eventRegistrationId,
      userId,
      isPaid: true,
    });
    if (!registration) {
      return res.status(400).json({
        message: "You must complete event registration payment before paying for accompanies.",
      });
    }

    //  Always allow new order creation for unpaid accompany items
    const shortId = accompany._id.toString().slice(-6); // short unique suffix
    const receiptId = `acc_${shortId}_${Date.now().toString().slice(-6)}`.slice(0, 40); // ensure <40 chars

    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: receiptId,
    };

    // Create new Razorpay order every time
    const order = await razorpay.orders.create(options);

    // Create a new Payment record
    const payment = await Payment.create({
      userId,
      eventRegistrationId,
      accompanyId,
      accompanyItemIds: unpaidItems.map((a) => a._id),
      amount,
      paymentCategory: "accompany",
      razorpayOrderId: order.id,
      status: "initiated",
    });

    res.status(201).json({
      success: true,
      message: "Accompany payment order created successfully",
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
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } = req.body;

    // verify signature
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpaySignature)
      return res.status(400).json({ message: "Invalid payment signature" });

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: "Payment record not found" });

    const accompany = await Accompany.findById(payment.accompanyId);
    if (!accompany) return res.status(404).json({ message: "Accompany record not found" });

    const registration = await EventRegistration.findById(payment.eventRegistrationId);
    if (!registration) return res.status(404).json({ message: "Event registration not found" });

    // Determine starting counter: count of already generated accompany regNums for this registration
    // We compute how many accompany regNums are already assigned under this registration
    let existingCount = 0;
    // Count all accompanies across all accompany docs for this registration that have regNumGenerated = true
    const allAccompanyDocs = await Accompany.find({
      eventRegistrationId: registration._id,
    });

    allAccompanyDocs.forEach((doc) => {
      doc.accompanies.forEach((a) => {
        if (a.regNumGenerated) existingCount++;
      });
    });

    let counter = existingCount + 1;

    // If payment.accompanyItemIds provided -> mark only those items.
    if (Array.isArray(payment.accompanyItemIds) && payment.accompanyItemIds.length > 0) {
      const idsToMark = payment.accompanyItemIds.map((id) => id.toString());

      // mark only matching subdocs
      accompany.accompanies.forEach((a) => {
        if (idsToMark.includes(a._id.toString()) && !a.isPaid) {
          a.isPaid = true;
          a.regNumGenerated = true;
          a.regNum = `${registration.regNum}-A${counter}`;
          counter++;
        }
      });
    } else {
      // Backward compatibility: no accompanyItemIds -> mark all unpaid items in this accompany doc
      accompany.accompanies.forEach((a) => {
        if (!a.isPaid) {
          a.isPaid = true;
          a.regNumGenerated = true;
          a.regNum = `${registration.regNum}-A${counter}`;
          counter++;
        }
      });
    }

    await accompany.save();

    // Update payment
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = "paid";
    await payment.save();

    // ==============================================
    // Send Emails (2 templates)
    // ==============================================
    try {
      const event = await Event.findById(registration.eventId);
      const userName = registration.name;
      const userEmail = registration.email;

      // Prepare accompany list for merge
      const accompanyList = accompany.accompanies
        .filter((a) => a.isPaid && a.regNumGenerated)
        .map((a, idx) => ({
          index: idx + 1,
          fullName: a.fullName || "N/A",
          relation: a.relation || "N/A",
          gender: a.gender || "N/A",
          age: a.age || "N/A",
          mealPreference: a.mealPreference || "N/A",
          regNum: a.regNum || "N/A",
        }));

      // Send both emails parallelly
      const [accompanyEmail, accompanyPaymentEmail] = await Promise.allSettled([
        //  1. Accompany registration email
        sendEmailWithTemplate({
          to: userEmail,
          name: userName,
          templateKey: "2518b.554b0da719bc314.k1.490cc270-b7d7-11f0-87d4-ae9c7e0b6a9f.19a44208017",
          mergeInfo: {
            userName,
            userEmail,
            eventName: event.eventName,
            registrationNumber: registration.regNum,
            startDate: event.startDate
              ? new Date(event.startDate).toLocaleDateString("en-IN")
              : "N/A",
            endDate: event.endDate
              ? new Date(event.endDate).toLocaleDateString("en-IN")
              : "N/A",
            accompanies: accompanyList,
          },
        }),

        //  2. Accompany payment success email (reuse payment success template)
        sendEmailWithTemplate({
          to: userEmail,
          name: userName,
          templateKey: "2518b.554b0da719bc314.k1.2f2232e0-a7f2-11f0-8b9c-8e9a6c33ddc2.199dbf53d0e",
          mergeInfo: {
            name: userName,
            eventName: event.eventName,
            registrationNumber: registration.regNum,
            paymentAmount: payment.amount,
            razorpayPaymentId: payment.razorpayPaymentId,
            razorpayOrderId: payment.razorpayOrderId,
            paymentStatus: payment.status,
          },
        }),
      ]);

    } catch (emailErr) {
      console.error("Accompany email sending error:", emailErr);
    }
    res.status(200).json({
      success: true,
      message: "Accompany payment verified and emails sent successfully",
      data: { payment, accompany },
    });
  } catch (error) {
    console.error("Verify accompany payment error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

