import mongoose from "mongoose";

const SessionHallSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    sessionHallName: {
      type: String,
      required: [true, "Session Hall Name is required"],
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

export default mongoose.models.SessionHall ||
  mongoose.model("SessionHall", SessionHallSchema);
