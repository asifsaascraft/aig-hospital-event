// controllers/paymentController.js
import mongoose from "mongoose";
import { generateRegistrationNumber } from "../utils/eventRegistrationNumber.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import Payment from "../models/Payment.js";
import EventRegistration from "../models/EventRegistration.js";
import Event from "../models/Event.js";
import Banquet from "../models/Banquet.js";
import Accompany from "../models/Accompany.js";
import BanquetRegistration from "../models/BanquetRegistration.js";
import Workshop from "../models/Workshop.js";
import WorkshopRegistration from "../models/WorkshopRegistration.js";
import sendEmailWithTemplate from "../utils/sendEmail.js";
import moment from "moment";
import { getIndianFormattedDateTime } from "../utils/dateUtils.js";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// ========================================================
// COMPLETE EVENT REGISTRATION PAYMENT
// Used by:
// 1. Mobile verifyPayment API
// 2. Razorpay payment.captured webhook
// ========================================================
const completeEventRegistrationPayment = async ({
  payment,
  razorpayPaymentId,
  razorpaySignature = null,
  verificationSource = "api",
}) => {
  const session = await mongoose.startSession();

  let result;

  try {
    await session.withTransaction(async () => {
      // ==========================================
      // IMPORTANT:
      // Re-fetch payment INSIDE transaction
      // ==========================================
      const currentPayment = await Payment.findById(payment._id).session(
        session,
      );

      if (!currentPayment) {
        throw new Error("Payment record not found");
      }

      // ==========================================
      // Already completed
      // ==========================================
      if (currentPayment.status === "paid") {
        const existingRegistration = await EventRegistration.findById(
          currentPayment.eventRegistrationId,
        )
          .populate("registrationSlabId", "slabName")
          .session(session);

        result = {
          alreadyCompleted: true,
          payment: currentPayment,
          registration: existingRegistration,
        };

        return;
      }

      // ==========================================
      // Get registration INSIDE transaction
      // ==========================================
      const registration = await EventRegistration.findById(
        currentPayment.eventRegistrationId,
      )
        .populate("registrationSlabId", "slabName")
        .session(session);

      if (!registration) {
        throw new Error("Event registration not found");
      }

      // ==========================================
      // Already completed registration
      // ==========================================
      if (
        registration.isPaid === true &&
        registration.regNumGenerated === true &&
        registration.regNum
      ) {
        currentPayment.razorpayPaymentId =
          razorpayPaymentId || currentPayment.razorpayPaymentId;

        if (razorpaySignature) {
          currentPayment.razorpaySignature = razorpaySignature;
        }

        currentPayment.status = "paid";

        await currentPayment.save({ session });

        result = {
          alreadyCompleted: true,
          payment: currentPayment,
          registration,
        };

        return;
      }

      // ==========================================
      // Get event INSIDE transaction
      // ==========================================
      const event = await Event.findById(registration.eventId).session(session);

      if (!event) {
        throw new Error("Event not found");
      }

      if (!event.eventCode) {
        throw new Error("Event code is not configured");
      }

      // ==========================================
      // Generate registration number
      // INSIDE SAME TRANSACTION
      // ==========================================
      const generatedRegNum = await generateRegistrationNumber(
        event._id,
        session,
      );

      // ==========================================
      // Update registration
      // ==========================================
      registration.isPaid = true;
      registration.regNumGenerated = true;
      registration.regNum = generatedRegNum;

      await registration.save({ session });

      // ==========================================
      // Update payment
      // ==========================================
      currentPayment.razorpayPaymentId =
        razorpayPaymentId || currentPayment.razorpayPaymentId;

      if (razorpaySignature) {
        currentPayment.razorpaySignature = razorpaySignature;
      }

      currentPayment.status = "paid";

      await currentPayment.save({ session });

      // ==========================================
      // Transaction successful
      // ==========================================
      result = {
        alreadyCompleted: false,
        payment: currentPayment,
        registration,
      };
    });

    return result;
  } finally {
    await session.endSession();
  }
};

// ========================================================
// RAZORPAY WEBHOOK
// Handles payment.captured
// ========================================================
export const razorpayWebhook = async (req, res) => {
  try {
    // ==========================================
    // Razorpay webhook signature
    // ==========================================

    const webhookSignature = req.headers["x-razorpay-signature"];

    if (!webhookSignature) {
      return res.status(400).json({
        success: false,
        message: "Webhook signature missing",
      });
    }

    // req.rawBody MUST be available
    const rawBody = req.rawBody;

    if (!rawBody) {
      console.error("Razorpay webhook raw body is missing");

      return res.status(400).json({
        success: false,
        message: "Raw webhook body is required",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== webhookSignature) {
      console.error("Invalid Razorpay webhook signature");

      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    // ==========================================
    // Parse webhook body
    // ==========================================

    const payload =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const event = payload.event;

    console.log("Razorpay webhook received:", event);

    // ==========================================
    // We only need payment.captured
    // ==========================================

    if (event !== "payment.captured") {
      return res.status(200).json({
        success: true,
        message: "Webhook ignored",
      });
    }

    // ==========================================
    // Extract Razorpay payment
    // ==========================================

    const razorpayPayment = payload.payload?.payment?.entity;

    if (!razorpayPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment data missing",
      });
    }

    const razorpayPaymentId = razorpayPayment.id;

    const razorpayOrderId = razorpayPayment.order_id;

    // ==========================================
    // Payment must be captured
    // ==========================================

    if (razorpayPayment.status !== "captured") {
      return res.status(200).json({
        success: true,
        message: "Payment is not captured",
      });
    }

    if (!razorpayOrderId) {
      console.error("Razorpay order ID missing in webhook");

      return res.status(400).json({
        success: false,
        message: "Order ID missing",
      });
    }

    // ==========================================
    // Find our Payment using Razorpay order ID
    // ==========================================

    const payment = await Payment.findOne({
      razorpayOrderId,
    });

    if (!payment) {
      console.error(
        "Payment record not found for Razorpay order:",
        razorpayOrderId,
      );

      // Return 200 so Razorpay doesn't continuously retry
      // for an order that doesn't exist in our DB.
      return res.status(200).json({
        success: true,
        message: "Payment record not found",
      });
    }

    // ==========================================
    // Verify that this is Event Registration
    // ==========================================

    if (payment.paymentCategory !== "Event Registration") {
      return res.status(200).json({
        success: true,
        message: "Webhook is not for Event Registration",
      });
    }

    // ==========================================
    // Already processed
    // ==========================================

    if (payment.status === "paid") {
      console.log("Payment already processed:", payment._id.toString());

      return res.status(200).json({
        success: true,
        message: "Payment already processed",
      });
    }

    // ==========================================
    // Complete registration
    // ==========================================

    const result = await completeEventRegistrationPayment({
      payment,
      razorpayPaymentId,
      verificationSource: "webhook",
    });

    // ==========================================
    // Send registration/payment emails
    // ==========================================

    if (!result.alreadyCompleted) {
      try {
        const registration = result.registration;

        const eventData = await Event.findById(registration.eventId);

        const slabName = registration.registrationSlabId?.slabName || "N/A";

        await Promise.allSettled([
          sendEmailWithTemplate({
            to: registration.email,
            name: registration.name,
            templateKey:
              "2518b.554b0da719bc314.k1.f7c9f490-a7f1-11f0-8b9c-8e9a6c33ddc2.199dbf3d259",
            mergeInfo: {
              name: registration.name,
              eventName: eventData.eventName,
              registrationNumber: registration.regNum,
              registrationSlabName: slabName,
              startDate: getIndianFormattedDateTime(eventData.startDateTime),
              endDate: getIndianFormattedDateTime(eventData.endDateTime),
              designation: registration.designation || "N/A",
              affiliation: registration.affiliation || "N/A",
              country: registration.country || "N/A",
              city: registration.city || "N/A",
            },
          }),

          sendEmailWithTemplate({
            to: registration.email,
            name: registration.name,
            templateKey:
              "2518b.554b0da719bc314.k1.2f2232e0-a7f2-11f0-8b9c-8e9a6c33ddc2.199dbf53d0e",
            mergeInfo: {
              name: registration.name,
              eventName: eventData.eventName,
              registrationNumber: registration.regNum,
              paymentAmount: result.payment.amount,
              razorpayPaymentId: result.payment.razorpayPaymentId,
              razorpayOrderId: result.payment.razorpayOrderId,
              paymentStatus: result.payment.status,
            },
          }),
        ]);
      } catch (emailError) {
        console.error("Webhook email error:", emailError);
      }
    }

    // ==========================================
    // IMPORTANT:
    // Always return 200 after successful processing
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Razorpay payment webhook processed successfully",
    });
  } catch (error) {
    console.error("Razorpay webhook error:", error);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};

/* ========================================================
   1. Create Razorpay Order
======================================================== */
export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;
    const { eventRegistrationId, amount } = req.body;

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const registration = await EventRegistration.findOne({
      _id: eventRegistrationId,
      userId,
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Event registration not found",
      });
    }

    if (registration.isPaid === true && registration.regNumGenerated === true) {
      return res.status(400).json({
        success: false,
        message: "Event registration payment already completed",
        regNum: registration.regNum,
      });
    }

    const existingPayment = await Payment.findOne({
      userId,
      eventRegistrationId,
      status: "paid",
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment already completed",
      });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${registration._id}`,

      notes: {
        eventName: event.eventName,
        paymentType: "Event Registration",
      },
    };

    const order = await razorpay.orders.create(options);

    const payment = await Payment.create({
      userId,
      eventId,
      eventRegistrationId,
      amount,
      paymentCategory: "Event Registration",

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

// ========================================================
// 2. Verify Event Registration Payment
// ========================================================

export const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } =
      req.body;

    // ==========================================
    // Validate required fields
    // ==========================================

    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature ||
      !paymentId
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification data is incomplete",
      });
    }

    // ==========================================
    // Find our Payment record
    // ==========================================

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    // ==========================================
    // IMPORTANT:
    // Never trust order ID from mobile app.
    // Compare it with our DB record.
    // ==========================================

    if (payment.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order ID mismatch",
      });
    }

    // ==========================================
    // Verify Razorpay signature
    // ==========================================

    const body = payment.razorpayOrderId + "|" + razorpayPaymentId;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // ==========================================
    // VERIFY PAYMENT DIRECTLY WITH RAZORPAY
    // ==========================================

    const razorpayPayment = await razorpay.payments.fetch(razorpayPaymentId);

    if (!razorpayPayment) {
      return res.status(400).json({
        success: false,
        message: "Unable to fetch Razorpay payment",
      });
    }

    // Payment must actually be captured
    if (razorpayPayment.status !== "captured") {
      return res.status(400).json({
        success: false,
        message: `Payment is not captured. Current status: ${razorpayPayment.status}`,
      });
    }

    // ==========================================
    // COMPLETE PAYMENT
    // ==========================================

    const result = await completeEventRegistrationPayment({
      payment,
      razorpayPaymentId,
      razorpaySignature,
      verificationSource: "api",
    });

    // ==========================================
    // SEND EMAIL ONLY WHEN FIRST COMPLETED
    // ==========================================

    if (!result.alreadyCompleted) {
      try {
        const registration = result.registration;
        const event = await Event.findById(registration.eventId);

        const slabName = registration.registrationSlabId?.slabName || "N/A";

        await Promise.allSettled([
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
              startDate: getIndianFormattedDateTime(event.startDateTime),
              endDate: getIndianFormattedDateTime(event.endDateTime),
              designation: registration.designation || "N/A",
              affiliation: registration.affiliation || "N/A",
              country: registration.country || "N/A",
              city: registration.city || "N/A",
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
              paymentAmount: result.payment.amount,
              razorpayPaymentId: result.payment.razorpayPaymentId,
              razorpayOrderId: result.payment.razorpayOrderId,
              paymentStatus: result.payment.status,
            },
          }),
        ]);
      } catch (emailError) {
        console.error("Registration payment email error:", emailError);
      }
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: result.alreadyCompleted
        ? "Payment already verified"
        : "Payment verified successfully",
      data: {
        payment: result.payment,
        registration: result.registration,
      },
    });
  } catch (error) {
    console.error("Verify payment error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

/* ========================================================
   3. Get My Payments
======================================================== */
export const getMyPayments = async (req, res) => {
  try {
    const userId = req.user._id;

    //  Fetch payments and populate eventId directly
    const payments = await Payment.find({ userId })
      .populate({
        path: "eventId",
        select: "eventName shortName eventCode startDateTime endDateTime",
      })
      .sort({ createdAt: -1 });
    const paymentsWithMode = await Promise.all(
      payments.map(async (payment) => {
        let paymentMode = "Unknown";
        if (payment.razorpayPaymentId) {
          try {
            const razorpayPayment = await razorpay.payments.fetch(
              payment.razorpayPaymentId,
            );
            paymentMode = razorpayPayment.method || "Unknown";
          } catch (err) {
            console.error("Razorpay fetch error:", err);
          }
        }

        return {
          ...payment.toObject(),
          paymentMode,
        };
      }),
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
======================================================== */
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

/* ========================================================
   5. Create Razorpay Order for Accompany Payment
======================================================== */

export const createAccompanyOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;
    const { eventRegistrationId, accompanyId, accompanyItemIds, amount } =
      req.body;

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (
      !accompanyId ||
      !Array.isArray(accompanyItemIds) ||
      accompanyItemIds.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "accompanyId and accompanyItemIds are required" });
    }

    // Fetch accompany document
    const accompany = await Accompany.findById(accompanyId);
    if (!accompany) {
      return res.status(404).json({ message: "Accompany record not found" });
    }

    // Filter valid items to pay now (unpaid ones only)
    const unpaidItems = accompany.accompanies.filter(
      (a) => accompanyItemIds.includes(a._id.toString()) && a.isPaid === false,
    );

    if (unpaidItems.length === 0) {
      return res.status(400).json({
        message:
          "No unpaid accompany items found for payment. Please check selection.",
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
        message:
          "You must complete event registration payment before paying for accompanies.",
      });
    }

    //  Always allow new order creation for unpaid accompany items
    const shortId = accompany._id.toString().slice(-6); // short unique suffix
    const receiptId = `acc_${shortId}_${Date.now().toString().slice(-6)}`.slice(
      0,
      40,
    ); // ensure <40 chars

    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: receiptId,

      notes: {
        eventName: event.eventName,
        paymentType: "Accompany",
      },
    };

    // Create new Razorpay order every time
    const order = await razorpay.orders.create(options);

    // Create a new Payment record
    const payment = await Payment.create({
      userId,
      eventId,
      eventRegistrationId,
      accompanyId,
      accompanyItemIds: unpaidItems.map((a) => a._id),
      amount,
      paymentCategory: "Accompany",
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
======================================================== */

export const verifyAccompanyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } =
      req.body;

    // verify signature
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

    const registration = await EventRegistration.findById(
      payment.eventRegistrationId,
    );
    if (!registration)
      return res.status(404).json({ message: "Event registration not found" });

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
    if (
      Array.isArray(payment.accompanyItemIds) &&
      payment.accompanyItemIds.length > 0
    ) {
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

    // ===============================
    // Send Single ZeptoMail Template
    // ===============================
    try {
      const event = await Event.findById(registration.eventId);
      const userName = registration.name;
      const userEmail = registration.email;

      // Prepare accompany list
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

      // Send new merged email
      await sendEmailWithTemplate({
        to: userEmail,
        name: userName,
        templateKey:
          "2518b.554b0da719bc314.k1.490cc270-b7d7-11f0-87d4-ae9c7e0b6a9f.19a44208017",
        mergeInfo: {
          userName,
          userEmail,
          eventName: event.eventName,
          registrationNumber: registration.regNum,
          paymentAmount: payment.amount,
          razorpayPaymentId: payment.razorpayPaymentId,
          razorpayOrderId: payment.razorpayOrderId,
          paymentStatus: payment.status,

          startDate: getIndianFormattedDateTime(event.startDateTime),

          endDate: getIndianFormattedDateTime(event.endDateTime),

          accompanies: accompanyList,
        },
      });
    } catch (emailErr) {
      console.error("Error sending merged accompany email:", emailErr);
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

/* ========================================================
   7. Create Workshop Payment Order
======================================================== */
export const createWorkshopOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;
    const { workshopRegistrationId, workshopIds, amount } = req.body;

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (
      !workshopRegistrationId ||
      !Array.isArray(workshopIds) ||
      workshopIds.length === 0
    )
      return res.status(400).json({
        message: "workshopRegistrationId and workshopIds are required",
      });

    const registration = await WorkshopRegistration.findById(
      workshopRegistrationId,
    ).populate("eventId");
    if (!registration)
      return res
        .status(404)
        .json({ message: "Workshop registration not found" });

    if (registration.paymentStatus === "Completed")
      return res
        .status(400)
        .json({ message: "Payment already completed for these workshops" });

    // Create Razorpay Order
    const receiptId =
      `wrk_${workshopRegistrationId}_${Date.now().toString().slice(-6)}`.slice(
        0,
        40,
      );
    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: receiptId,

      notes: {
        eventName: event.eventName,
        paymentType: "Workshop",
      },
    };

    const order = await razorpay.orders.create(options);

    // Create Payment Record
    const payment = await Payment.create({
      userId,
      eventId,
      workshopRegistrationId,
      workshopIds,
      amount,
      paymentCategory: "Workshop",
      razorpayOrderId: order.id,
      status: "initiated",
    });

    res.status(201).json({
      success: true,
      message: "Workshop payment order created successfully",
      data: {
        orderId: order.id,
        amount,
        currency: order.currency,
        paymentId: payment._id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Create workshop order error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ========================================================
   8. Verify Workshop Payment
======================================================== */
export const verifyWorkshopPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } =
      req.body;

    // 1️ Verify Razorpay Signature
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpaySignature)
      return res.status(400).json({ message: "Invalid payment signature" });

    // 2️ Fetch Payment record
    const payment = await Payment.findById(paymentId);
    if (!payment)
      return res.status(404).json({ message: "Payment record not found" });

    // 3️ Fetch Workshop Registration
    const registration = await WorkshopRegistration.findById(
      payment.workshopRegistrationId,
    ).populate([
      { path: "eventId", select: "eventName startDateTime endDateTime" },
      {
        path: "workshops.workshopIds",
        select:
          "workshopName hallName startDateTime endDateTime workshopRegistrationType workshopCategory",
      },
    ]);

    if (!registration)
      return res
        .status(404)
        .json({ message: "Workshop registration not found" });

    // 4️ Update registration payment status
    registration.paymentStatus = "Completed";
    await registration.save();

    // 5️ Update Payment details
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = "paid";
    await payment.save();

    // 6 Send ZeptoMail Email (Paid Workshop Confirmation)
    try {
      const event = registration.eventId;
      const workshops = registration.workshops.map((item) => item.workshopIds);
      const workshopList = workshops.map((ws) => ({
        workshopName: ws.workshopName || "",
        hallName: ws.hallName || "",

        startDateTime: getIndianFormattedDateTime(ws.startDateTime),

        endDateTime: getIndianFormattedDateTime(ws.endDateTime),
      }));

      const ifMultiple = workshopList.length > 1 ? "s" : "";
      const displayName = req.user.name || "Participant";
      const paymentDate = getIndianFormattedDateTime(new Date());

      await sendEmailWithTemplate({
        to: req.user.email,
        name: displayName,
        templateKey:
          "2518b.554b0da719bc314.k1.efde7181-ba2e-11f0-87d4-ae9c7e0b6a9f.19a537a6095",
        mergeInfo: {
          name: displayName,
          eventName: event.eventName || "",
          workshopList,
          ifMultiple,
          paymentAmount: payment.amount || 0,
          razorpayPaymentId: payment.razorpayPaymentId || "",
          razorpayOrderId: payment.razorpayOrderId || "",
          paymentStatus: payment.status || "paid",
          paymentDate,
        },
      });
    } catch (emailErr) {
      console.error("Error sending Paid Workshop email:", emailErr);
    }

    // 7 Response
    res.status(200).json({
      success: true,
      message: "Workshop payment verified successfully",
      data: { payment, registration },
    });
  } catch (error) {
    console.error("Verify workshop payment error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ========================================================
   9. Create Banquet Payment Order
======================================================== */
export const createBanquetOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;
    const { banquetRegistrationId, banquetItemIds, amount } = req.body;

    // Validate Event
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (
      !banquetRegistrationId ||
      !Array.isArray(banquetItemIds) ||
      banquetItemIds.length === 0
    ) {
      return res.status(400).json({
        message: "banquetRegistrationId and banquetItemIds are required",
      });
    }

    const banquetReg = await BanquetRegistration.findById(
      banquetRegistrationId,
    );
    if (!banquetReg)
      return res
        .status(404)
        .json({ message: "Banquet registration not found" });

    // Check unpaid banquet items
    const unpaidItems = banquetReg.banquets.filter(
      (b) => banquetItemIds.includes(b._id.toString()) && !b.isPaid,
    );

    if (unpaidItems.length === 0) {
      return res.status(400).json({
        message: "No unpaid banquet items found. Please check selection.",
      });
    }

    // Create Razorpay Order
    const receiptId =
      `bnq_${banquetRegistrationId}_${Date.now().toString().slice(-6)}`.slice(
        0,
        40,
      );
    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: receiptId,

      notes: {
        eventName: event.eventName,
        paymentType: "Banquet",
      },
    };

    const order = await razorpay.orders.create(options);

    // Create Payment Record
    const payment = await Payment.create({
      userId,
      eventId,
      banquetRegistrationId,
      banquetItemIds: unpaidItems.map((b) => b._id),
      amount,
      paymentCategory: "Banquet",
      razorpayOrderId: order.id,
      status: "initiated",
    });

    res.status(201).json({
      success: true,
      message: "Banquet payment order created successfully",
      data: {
        orderId: order.id,
        amount,
        currency: order.currency,
        paymentId: payment._id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Create banquet order error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ========================================================
   10. Verify Banquet Payment
======================================================== */
export const verifyBanquetPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } =
      req.body;

    // Verify Signature
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

    const banquetReg = await BanquetRegistration.findById(
      payment.banquetRegistrationId,
    )
      .populate("eventId", "eventName startDateTime endDateTime")
      .populate("banquetId") // full banquet details
      .populate("eventRegistrationId", "regNum email name")
      .lean();

    if (!banquetReg)
      return res
        .status(404)
        .json({ message: "Banquet registration not found" });

    // Mark banquet items as paid
    const idsToMark = payment.banquetItemIds.map((id) => id.toString());
    banquetReg.banquets.forEach((b) => {
      if (idsToMark.includes(b._id.toString())) {
        b.isPaid = true;
      }
    });

    await BanquetRegistration.findByIdAndUpdate(banquetReg._id, {
      banquets: banquetReg.banquets,
    });

    // Update payment record
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = "paid";
    await payment.save();

    /* =====================================================
       Send ZeptoMail Email — Banquet Payment Successful
    ===================================================== */
    try {
      const event = banquetReg.eventId;
      const registration = banquetReg.eventRegistrationId;
      const userName = registration.name;
      const userEmail = registration.email;

      //  Fetch banquet details
      const banquetDetails = await Banquet.findById(banquetReg.banquetId);
      const banquetName =
        banquetDetails?.banquetslabName || banquetDetails?.banquetName || "N/A";
      const banquetStart = banquetDetails?.startDateTime
        ? getIndianFormattedDateTime(banquetDetails.startDateTime)
        : "N/A";

      const banquetEnd = banquetDetails?.endDateTime
        ? getIndianFormattedDateTime(banquetDetails.endDateTime)
        : "N/A";
      const banquetVenue = banquetDetails?.venue || "N/A";

      //  Prepare banquet list
      const banquetList = [];

      for (const [index, b] of banquetReg.banquets.entries()) {
        if (b.isPaid) {
          let registeredFor = "Other";

          //  Check if userId exists → Self
          if (b.userId) {
            registeredFor = "Self";
          }

          //  Else if accompanySubId exists → Fetch accompany details
          else if (b.accompanySubId) {
            const parent = await Accompany.findOne({
              "accompanies._id": b.accompanySubId,
            }).lean();

            if (parent) {
              const sub = parent.accompanies.find(
                (a) => a._id.toString() === b.accompanySubId.toString(),
              );
              if (sub) {
                registeredFor = `${sub.fullName} (${sub.relation})`;
              }
            }
          }

          banquetList.push({
            index: index + 1,
            banquetName,
            date: `${banquetStart} - ${banquetEnd}`,
            venue: banquetVenue,
            otherName: b.otherName,
            registeredFor,
          });
        }
      }

      //  Send ZeptoMail
      await sendEmailWithTemplate({
        to: userEmail,
        name: userName,
        templateKey:
          "2518b.554b0da719bc314.k1.d3e59360-be29-11f0-ad57-ae9c7e0b6a9f.19a6d8fc796",
        mergeInfo: {
          userName,
          userEmail,
          eventName: event.eventName,
          registrationNumber: registration.regNum,
          paymentAmount: payment.amount,
          razorpayPaymentId: payment.razorpayPaymentId,
          razorpayOrderId: payment.razorpayOrderId,
          paymentStatus: payment.status,

          startDate: getIndianFormattedDateTime(event.startDateTime),

          endDate: getIndianFormattedDateTime(event.endDateTime),

          banquets: banquetList,
        },
      });
    } catch (emailErr) {
      console.error("Error sending Banquet Payment Email:", emailErr);
    }

    res.status(200).json({
      success: true,
      message: "Banquet payment verified and email sent successfully",
      data: { payment, banquetReg },
    });
  } catch (error) {
    console.error("Verify banquet payment error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
