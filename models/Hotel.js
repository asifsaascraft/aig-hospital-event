// models/Hotel.js
import mongoose from "mongoose";

// Schema
const HotelSchema = new mongoose.Schema(
  {
    hotelName: {
      type: String,
      required: [true, "Hotel Name is required"],
      trim: true,
    },
    hotelAddress: {
      type: String,
      required: [true, "Address is required"],
    },
    hotelImage: {
      type: String,
      required: [true, "Hotel image is required"], // store file path or URL
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
    hotelCategory: {
      type: String,
      required: false,
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
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// Avoid model overwrite during hot-reload
export default mongoose.models.Hotel ||
  mongoose.model("Hotel", HotelSchema);


