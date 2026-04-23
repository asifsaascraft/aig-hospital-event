// models/Event.js
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
      unique: true,
      trim: true,
    },
    eventImage: {
      type: String, // store file path or URL
      required: [true, "Event Image is required"],
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
    groupName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventGroup",
      required: [true, "Event group is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Start Date is required"],
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (value) {
          if (!this.startDate || !value) return true;
          return value >= this.startDate;
        },
        message: "End date must be greater than or equal to start date",
      },
      required: [true, "End Date is required"],
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
    brochureUpload: {
      type: String, // store file path or URL
      required: [true, "Brochure is required"],
    }
    // status removed from schema because we calculate it dynamically
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

/**
 * Virtual: Dynamic event status
 */
EventSchema.virtual("dynamicStatus").get(function () {
  if (!this.startDate || !this.endDate) return "Unknown";

  const now = new Date();

  if (now < this.startDate) return "Upcoming";
  if (now >= this.startDate && now <= this.endDate) return "Live";
  return "Past";
});

// Avoid model overwrite during hot-reload
export default mongoose.models.Event ||
  mongoose.model("Event", EventSchema);

