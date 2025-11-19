import mongoose from "mongoose";

const ExhibitorSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    exhibitorName: {
      type: String,
      required: [true, "Exhibitor name is required"],
      trim: true,
    },
    contactPersonName: {
      type: String,
      required: [true, "Contact person name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
    },
    additionalEmail: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    plainPassword: {         
      type: String,
    },
    gstNumber: {
      type: String,
      trim: true,
    },
    companyAddress: {
      type: String,
      required: [true, "Company Address is required"],
      trim: true,
    },
    exhibitorBooth: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExhibitorBooth",
      required: [true, "Exhibitor booth is required"],
    },
    exhibitorCategory: {
      type: String,
      required: [true, "Category is required"],
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

export default mongoose.models.Exhibitor || mongoose.model("Exhibitor", ExhibitorSchema);
