import mongoose from "mongoose";

const ReviewerSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    reviewerName: {
      type: String,
      required: [true, "Reviewer name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    plainPassword: {
      type: String,
    },
    abstractCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AbstractCategory",
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    // Add these fields for forgot/reset password functionality
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Reviewer ||
  mongoose.model("Reviewer", ReviewerSchema);
