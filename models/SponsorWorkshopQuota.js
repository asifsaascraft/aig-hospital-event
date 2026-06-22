// models/SponsorWorkshopQuota.js

import mongoose from "mongoose";

const SponsorWorkshopQuotaSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    workshopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workshop",
      required: true,
    },

    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sponsor",
      required: true,
    },

    quota: {
      type: Number,
      required: [true, "Workshop Quota is required"],
    },

    startDateTime: {
      type: Date,
      required: true,
    },

    endDateTime: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// prevent duplicate quota
SponsorWorkshopQuotaSchema.index(
  {
    eventId: 1,
    workshopId: 1,
    sponsorId: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.models.SponsorWorkshopQuota ||
  mongoose.model(
    "SponsorWorkshopQuota",
    SponsorWorkshopQuotaSchema
  );