import mongoose from "mongoose";

const BoothSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    booth: {
      type: String,
      required: [true, "Booth is required"],
      trim: true,
    },
    boothImageUpload: {
      type: String,  // store file path or URL
      required: [true, "Only PDF Image is required"],
    },
    hall: {
      type: String,
      required: [true, "Hall Name is required"],
      trim: true,
    },
    stallType: {
      type: String,
      required: [true, "Stall Type is required"],
      trim: true,
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

export default mongoose.models.Booth ||
  mongoose.model("Booth", BoothSchema);
