import mongoose from "mongoose";

const AssignProfileSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    cardProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CardProfile",
      required: [true, "Card Profile is required"],
    },

    eventRegistrationId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EventRegistration",
        required: true,
      }
    ],
  },
  { timestamps: true }
);

//  Prevent duplicate (event + profile card)
AssignProfileSchema.index(
  { eventId: 1, cardProfileId: 1 },
  { unique: true }
);

export default mongoose.models.AssignProfile ||
  mongoose.model("AssignProfile", AssignProfileSchema);