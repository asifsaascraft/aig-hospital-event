import mongoose from "mongoose";

const ExhibitorHallSchema = new mongoose.Schema(
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

export default mongoose.models.ExhibitorHall ||
  mongoose.model("ExhibitorHall", ExhibitorHallSchema);
