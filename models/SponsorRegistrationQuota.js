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
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return !this.startDate || value >= this.startDate;
        },
        message: "End date must be greater than or equal to start date",
      },
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
