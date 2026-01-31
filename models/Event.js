// models/Event.js
import mongoose from "mongoose";
import moment from "moment-timezone";

// Schema
const EventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: [true, "Event Name is required"],
      trim: true,
    },
    shortName: {
      type: String,
      required: [true, "Short Name is required"],
      unique: true,
      trim: true,
    },
    eventImage: {
      type: String, // store file path or URL
    },
    eventCode: {
      type: String,
      trim: true,
    },
    regNum: {
      type: String,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organizer",
      required: [true, "Organizer is required"],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },
    startDate: {
      type: String, // Format: DD/MM/YYYY
      required: [true, "Start Date is required"],
    },
    endDate: {
      type: String, // Format: DD/MM/YYYY
      required: [true, "End Date is required"],
    },
    startTime: {
      type: String, // Format: hh:mm A (e.g., 09:00 AM)
      required: [true, "Start Time is required"],
    },
    endTime: {
      type: String, // Format: hh:mm A (e.g., 05:00 PM)
      required: [true, "End Time is required"],
    },
    timeZone: {
      type: String, // e.g., "Asia/Kolkata"
      required: [true, "Time Zone is required"],
    },
    venueName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: [true, "Venue Name is required"],
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
    eventType: {
      type: String,
      enum: ["In-Person", "Virtual", "Hybrid"],
      required: [true, "Event Type is required"],
    },
    registrationType: {
      type: String,
      enum: ["paid", "free"],
      required: [true, "Registration Type is required"],
    },
    currencyType: {
      type: String,
      enum: ["Indian-Rupee", "USD"],
    },
    eventCategory: {
      type: String,
      required: [true, "Event Category is required"],
    },
    isEventApp: {
      type: Boolean,
      default: false,
    },
    // status removed from schema because we calculate it dynamically
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

/**
 * Virtual: Dynamic event status
 */
EventSchema.virtual("dynamicStatus").get(function () {
  const tz = this.timeZone || "UTC";

  const start = moment.tz(
    `${this.startDate} ${this.startTime}`,
    "DD/MM/YYYY hh:mm A",
    tz
  );

  const end = moment.tz(
    `${this.endDate} ${this.endTime}`,
    "DD/MM/YYYY hh:mm A",
    tz
  );

  const now = moment.tz(tz);

  if (now.isBefore(start)) return "Live";
  if (now.isBetween(start, end, null, "[]")) return "Running";
  return "Past";
});

// Avoid model overwrite during hot-reload
export default mongoose.models.Event ||
  mongoose.model("Event", EventSchema);

