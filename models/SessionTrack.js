import mongoose from "mongoose";

const SessionTrackSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    sessionTrackName: {
      type: String,
      required: [true, "Session Track Name is required"],
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

export default mongoose.models.SessionTrack ||
  mongoose.model("SessionTrack", SessionTrackSchema);
