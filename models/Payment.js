import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    eventRegistrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventRegistration",
    },
    accompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Accompany",
    },
    paymentCategory: {
      type: String,
      enum: ["eventRegistration", "accompany"],
      required: [true, "Payment type is required"],
    },
    razorpayOrderId: {
      type: String,
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
    },
    razorpaySignature: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0, "Amount must be a positive number"],
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ["initiated", "paid", "failed"],
        message: "Status must be either 'created', 'paid', or 'failed'",
      },
      default: "initiated",
    },
    failedReason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
