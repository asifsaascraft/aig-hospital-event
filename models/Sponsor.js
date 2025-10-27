import mongoose from "mongoose";

const sponsorSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    sponsorName: {
      type: String,
      required: [true, "Sponsor name is required"],
      trim: true,
    },
    sponsorImage: {
      type: String, // store file path or URL
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
      unique: true,
      trim: true,
      lowercase: true,
    },
    mobile: {
      type: String,
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
      trim: true,
    },
    sponsorBooth: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SponsorBooth",
    },
    sponsorCategory: {
      type: String,
      required: [true, "Category is required"],
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Sponsor || mongoose.model("Sponsor", sponsorSchema);
