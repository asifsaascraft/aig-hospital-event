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
    arrivalPickupPoint: {
      type: String,
      required: [true, "Arrival Pickup point is required"],
    },
    arrivalPickupPointType: {
      type: String,
      required: [true, "Arrival Pickup point type is required"],
    },
    arrivalPickupDate: {
      type: String, // Format: DD/MM/YYYY
      required: [true, "Arrival Pickup Date is required"],
    },
    arrivalPickupTime: {
      type: String, // Format: hh:mm A (e.g., 09:00 AM)
      required: [true, "Arrival Pickup Time is required"],
    },
    arrivalDropOffPoint: {
      type: String,
      required: [true, "Arrival Drop off point is required"],
      trim: true,
    },

    departurePickupPoint: {
      type: String,
      required: [true, "Departure Pickup point is required"],
    },
    departurePickupPointType: {
      type: String,
      required: [true, "Departure Pickup point type is required"],
    },
    departurePickupDate: {
      type: String, // Format: DD/MM/YYYY
      required: [true, "Departure Pickup Date is required"],
    },
    departurePickupTime: {
      type: String, // Format: hh:mm A (e.g., 09:00 AM)
      required: [true, "Departure Pickup Time is required"],
    },
    departureDropOffPoint: {
      type: String,
      required: [true, "Departure Drop off point is required"],
      trim: true,
    },

    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sponsor",
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
