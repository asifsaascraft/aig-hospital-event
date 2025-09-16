// models/Venue.js
import mongoose from "mongoose";

const VenueSchema = new mongoose.Schema(
  {
    venueName: {
      type: String,
      required: [true, "Venue Name is required"],
      trim: true,
    },
    venueAddress: {
      type: String,
      required: [true, "Venue Address is required"],
    },
    venueImage: {
      type: String,
      required: [true, "Venue image is required"], // store file path or URL
    },
    country: {
      type: String,
      required: [true, "Country is required"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      required: [true, "Status is required"],
    },
    website: {
      type: String,
      required: false,
      match: [/^https?:\/\/.+\..+/, "Invalid website URL"],
    },
    googleMapLink: {
      type: String,
      required: false,
      match: [/^https?:\/\/.+\..+/, "Invalid Google Maps link"],
    },
    distanceFromAirport: {
      type: String,
      required: [true, "Distance from Airport is required"],
    },
    distanceFromRailwayStation: {
      type: String,
      required: [true, "Distance from Railway Station is required"],
    },
    nearestMetroStation: {
      type: String,
      required: [true, "Nearest Metro Station is required"],
    },
  },
  { timestamps: true } // automatically adds createdAt & updatedAt
);

// Avoid model overwrite during hot reload
const Venue = mongoose.models.Venue || mongoose.model("Venue", VenueSchema);

export default Venue;
