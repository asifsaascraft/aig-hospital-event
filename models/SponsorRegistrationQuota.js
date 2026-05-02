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
    startDateTime: {
      type: Date,
      required: [true, "Start Date time is required"],
    },
    endDateTime: {
      type: Date,
      validate: {
        validator: function (value) {
          if (!this.startDateTime || !value) return true;
          return value >= this.startDateTime;
        },
        message: "End date time must be greater than or equal to start date time",
      },
      required: [true, "End Date is required"],
    },
  },
  { timestamps: true }
);

export default mongoose.models.SponsorRegistrationQuota ||
  mongoose.model("SponsorRegistrationQuota", SponsorRegistrationQuotaSchema);
