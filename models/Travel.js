import mongoose from "mongoose";

const TravelSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    eventRegistrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventRegistration",
      required: true,
    },
    travelAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TravelAgent",
      required: true,
    },
    pickupPoint: {
      type: String,
      required: [true, "Pickup point is required"],
    },
    pickupPointType: {
      type: String,
      required: [true, "Pickup point type is required"],
    },
    date: {
      type: String, // Format: DD/MM/YYYY
      required: [true, "Date is required"],
    },
    time: {
      type: String, // Format: hh:mm A (e.g., 09:00 AM)
      required: [true, "Time is required"],
    },
    dropPoint: {
      type: String,
      required: [true, "Drop off point is required"],
      trim: true,
    },
    createdBy: {
      type: String,
      enum: ["eventAdmin", "sponsor"],
      default: "eventAdmin", 
    },
  },
  { timestamps: true }
);

export default mongoose.models.Travel ||
  mongoose.model("Travel", TravelSchema);
