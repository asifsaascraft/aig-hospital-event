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
    arrivalPickupDateTime: {
      type: Date, 
      required: [true, "Arrival pickup date and time is required"],
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
    departurePickupDateTime: {
      type: Date,
      required: [true, "Departure pickup date and time is required"],
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
