import mongoose from "mongoose";

const ScanTypeSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    scanType: {
      type: String,
      required: [true, "Scan Type is required"],
      trim: true,
    },

    scanMode: {
      type: String,
      enum: ["Single Scan", "Multi Scan"],
      default: "Single Scan",
      required: [true, "Scan Mode is required"],
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      required: [true, "Status is required"],
    },
  },
  { timestamps: true }
);

// Prevent duplicate scanType + scanMode per event
ScanTypeSchema.index(
  { eventId: 1, scanType: 1, scanMode: 1 },
  { unique: true }
);

export default mongoose.models.ScanType ||
  mongoose.model("ScanType", ScanTypeSchema);