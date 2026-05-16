import mongoose from "mongoose";

const EventVisitorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
  },
  { timestamps: true }
);

// prevent duplicate user-event rows
EventVisitorSchema.index(
  { userId: 1, eventId: 1 },
  { unique: true }
);

export default mongoose.models.EventVisitor ||
  mongoose.model("EventVisitor", EventVisitorSchema);