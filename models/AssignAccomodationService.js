import mongoose from "mongoose";

const AssignAccomodationServiceSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sponsor",
      required: [true, "Sponsor is required"],
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

//  Prevent duplicate (event + sponsor)
AssignAccomodationServiceSchema.index(
  { eventId: 1, sponsorId: 1 },
  { unique: true }
);

export default mongoose.models.AssignAccomodationService ||
  mongoose.model("AssignAccomodationService", AssignAccomodationServiceSchema);