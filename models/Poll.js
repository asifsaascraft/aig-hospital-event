import mongoose from "mongoose";

const PollSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    pollQuestions: [
      {
        pollTitle: {
          type: String,
          required: [true, "Poll Title is required"],
          trim: true,
        },

        pollType: {
          type: String,
          enum: ["Single", "Multi"],
          default: "Single",
          required: [true, "Poll Type is required"],
        },

        options: [
          {
            optionText: {
              type: String,
              required: true,
              trim: true,
            },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Poll ||
  mongoose.model("Poll", PollSchema);