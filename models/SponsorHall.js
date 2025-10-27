import mongoose from "mongoose";

const SponsorHallSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    hallName: {
      type: String,
      required: [true, "Hall Name is required"],
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

export default mongoose.models.SponsorHall ||
  mongoose.model("SponsorHall", SponsorHallSchema);
