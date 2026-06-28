import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    message: {
      type: String,
      required: [true, "Message is required"],
    },

    images: [
      {
        type: String, // store file path or URL
        required: [true, "Images is required"],
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.models.Message ||
  mongoose.model("Message", MessageSchema);
