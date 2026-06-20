import mongoose from "mongoose";

const BadgeScanLogSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    badgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OnsiteBadge",
      required: true,
    },

    scanTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScanType",
      required: true,
    },

    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LoginGenerateToken",
      required: true,
    },

    regNum: {
      type: String,
      required: true,
    },

    scanCount: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

BadgeScanLogSchema.index({
  eventId: 1,
  badgeId: 1,
  scanTypeId: 1,
});

export default mongoose.models.BadgeScanLog ||
  mongoose.model("BadgeScanLog", BadgeScanLogSchema);