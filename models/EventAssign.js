import mongoose from "mongoose";

const EventAssignSchema = new mongoose.Schema(
  {
    eventAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    eventAdminName: {
      type: String,
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
        abstract: {
          type: Boolean,
          default: false,
        },
        faculty: {
          type: Boolean,
          default: false,
        },
        agenda: {
          type: Boolean,
          default: false,
        },
        exhibitor: {
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
        marketing: {
          type: Boolean,
          default: false,
        },
        communication: {
          type: Boolean,
          default: false,
        },
        accounting: {
          type: Boolean,
          default: false,
        },
        badging: {
          type: Boolean,
          default: false,
        },
        eventapp: {
          type: Boolean,
          default: false,
        },
        presentation: {
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


