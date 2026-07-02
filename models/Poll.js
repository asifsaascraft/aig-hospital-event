import mongoose from "mongoose";

const PollSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    poll: {
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

      startDateTime: {
        type: Date,
        required: [true, "Start Date time is required"],
      },
      
      endDateTime: {
        type: Date,
        required: [true, "End Date Time is required"],
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
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.Poll || mongoose.model("Poll", PollSchema);
