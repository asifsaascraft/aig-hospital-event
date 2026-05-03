import mongoose from "mongoose";

const SponsorAccomodationQuotaSchema = new mongoose.Schema(
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
    quotas: [
      {
        quotaId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "AddRoom",
          required: true,
        },
        numberOfQuota: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.SponsorAccomodationQuota ||
  mongoose.model("SponsorAccomodationQuota", SponsorAccomodationQuotaSchema);
