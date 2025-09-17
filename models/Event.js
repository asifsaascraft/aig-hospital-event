import mongoose from "mongoose";

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
      type: String,
      required: [true, "Start Date is required"],
    },
    endDate: {
      type: String,
      required: [true, "End Date is required"],
    },
    startTime: {
      type: String,
      required: [true, "Start Time is required"],
    },
    endTime: {
      type: String,
      required: [true, "End Time is required"],
    },
    timeZone: {
      type: String,
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
      default: "Live", // default before checking
    },
  },
  { timestamps: true }
);

/**
 * Helper function to compute event status
 */
function computeStatus(event) {
  const start = new Date(`${event.startDate} ${event.startTime}`);
  const end = new Date(`${event.endDate} ${event.endTime}`);
  const now = new Date();

  if (now < start) return "Live";
  if (now >= start && now <= end) return "Running";
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
    // If any time/date is updated, recompute status
    const doc = { ...this._update };
    doc.startDate = doc.startDate || this.startDate;
    doc.startTime = doc.startTime || this.startTime;
    doc.endDate = doc.endDate || this.endDate;
    doc.endTime = doc.endTime || this.endTime;
    update.status = computeStatus(doc);
    this.setUpdate(update);
  }
  next();
});

// Avoid model overwrite during hot-reload
const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);

export default Event;
