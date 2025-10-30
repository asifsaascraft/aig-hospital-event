import mongoose from "mongoose";

const SponsorRegistrationQuotaSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sponsor",
      required: true,
    },
    quota: {
      type: Number,
      required: [true, "Quota is required"],
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"], //  restricts to these values
      default: "Active",
      required: [true, "Status is required"],
    },
  },
  { timestamps: true }
);

export default mongoose.models.SponsorRegistrationQuota ||
  mongoose.model("SponsorRegistrationQuota", SponsorRegistrationQuotaSchema);
