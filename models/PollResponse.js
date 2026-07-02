import mongoose from "mongoose";

const PollResponseSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Poll",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    selectedOptions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
    ],

    isSubmitted: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// One user can submit only once for one poll
PollResponseSchema.index(
  {
    pollId: 1,
    userId: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.models.PollResponse ||
  mongoose.model(
    "PollResponse",
    PollResponseSchema
  );