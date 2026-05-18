import mongoose from "mongoose";

const EventAssignSchema = new mongoose.Schema(
  {
    eventAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    assignedEvents: [
      {
        eventId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Event",
          required: true
        },
        dashboard: {
          type: Boolean,
          default: false,
        },
        registration: {
          type: Boolean,
          default: false,
        },
        bulk: {
          type: Boolean,
          default: false,
        },
        sponsor: {
          type: Boolean,
          default: false,
        },
        travel: {
          type: Boolean,
          default: false,
        },
        accomodation: {
          type: Boolean,
          default: false,
        },
        accounting: {
          type: Boolean,
          default: false,
        },
        onsite: {
          type: Boolean,
          default: false,
        },
      }
    ],
  },
  { timestamps: true }
);

export default mongoose.models.EventAssign ||
  mongoose.model("EventAssign", EventAssignSchema);


