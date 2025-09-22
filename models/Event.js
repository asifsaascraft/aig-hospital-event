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
      trim: true,
    },
    eventImage: {
      type: String, // Cloudinary URL or file path
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
    status: {
      type: String,
      enum: ["Live", "Running", "Past"],
      default: "Live",
    },
  },
  { timestamps: true }
);

/**
 * Helper function to compute event status
 */
function computeStatus(event) {
  const tz = event.timeZone || "UTC";

  const start = moment.tz(
    `${event.startDate} ${event.startTime}`,
    "DD/MM/YYYY hh:mm A",
    tz
  );

  const end = moment.tz(
    `${event.endDate} ${event.endTime}`,
    "DD/MM/YYYY hh:mm A",
    tz
  );

  const now = moment.tz(tz);

  if (now.isBefore(start)) return "Live";
  if (now.isBetween(start, end, null, "[]")) return "Running";
  return "Past";
}

/**
 * Middleware: Before saving, update status
 */
EventSchema.pre("save", function (next) {
  this.status = computeStatus(this);
  next();
});

/**
 * Middleware: Before updating with findOneAndUpdate
 */
EventSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  if (update.startDate || update.startTime || update.endDate || update.endTime) {
    const doc = { ...this._update };
    doc.startDate = doc.startDate || this.startDate;
    doc.startTime = doc.startTime || this.startTime;
    doc.endDate = doc.endDate || this.endDate;
    doc.endTime = doc.endTime || this.endTime;
    doc.timeZone = doc.timeZone || this.timeZone;

    update.status = computeStatus(doc);
    this.setUpdate(update);
  }
  next();
});

// Avoid model overwrite during hot-reload
const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);

export default Event;
