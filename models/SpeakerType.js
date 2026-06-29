import mongoose from "mongoose";

const SpeakerTypeSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    speakerType: {
      type: String,
      required: [true, "Speaker Type is required"],
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"], //  restricts to these values
      default: "Active",
      required: [true, "Status is required"],
    },
  },
  { timestamps: true },
);

export default mongoose.models.SpeakerType ||
  mongoose.model("SpeakerType", SpeakerTypeSchema);
