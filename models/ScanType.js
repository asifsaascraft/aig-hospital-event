import mongoose from "mongoose";

const ScanTypeSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    // Example: Lunch Access, Dinner Entry, Kit Bag
    scanType: {
      type: String,
      required: [true, "Scan Type is required"],
      trim: true,
    },

    scanCode: {
      type: String,
      required: [true, "Scan Code is required"],
      uppercase: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    scanMode: {
      type: String,
      enum: ["single", "multiple"],
      default: "single",
      required: true,
    },

    allowReEntry: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      required: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

ScanTypeSchema.index({ eventId: 1, scanCode: 1 }, { unique: true });

export default mongoose.models.ScanType ||
  mongoose.model("ScanType", ScanTypeSchema);
