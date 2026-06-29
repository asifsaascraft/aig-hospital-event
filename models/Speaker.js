import mongoose from "mongoose";

const SpeakerSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    name: {
      type: String,
      required: [true, "Speaker Name is required"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
    },

    designation : {
      type: String,
      required: [true, "Designation  is required"],
    },

    image: {  // optional
      type: String, // store file path or URL
    },

    speakerTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SpeakerType",
      required: true,
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

export default mongoose.models.Speaker ||
  mongoose.model("Speaker", SpeakerSchema);
