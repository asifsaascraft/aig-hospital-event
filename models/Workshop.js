import mongoose from "mongoose";

const WorkshopSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    workshopName: {
      type: String,
      required: [true, "Workshop name is required"],
      trim: true,
    },
    workshopCategory: {
      type: String,
      required: [true, "Workshop Category is required"],
      trim: true,
    },
    hallName: {
      type: String,
      required: [true, "Hall name is required"],
      trim: true,
    },
    workshopRegistrationType: {
      type: String,
      required: [true, "Workshop Registration Type is required"], //either Paid or Free
      trim: true,
    },
    amount: {
      type: Number,
      default: 0,
      min: [0, "Amount must be a positive number"],
    },
    maxRegAllowed: {
      type: Number,
      required: [true, "Max Registration Allowed is required"],
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
    isEventRegistrationRequired: {
      type: Boolean,
      required: true,
      default: false,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"], //  restricts to these values
      default: "Active",
      required: [true, "Status is required"],
    },
  },
  { timestamps: true }
);

export default mongoose.models.Workshop ||
  mongoose.model("Workshop", WorkshopSchema);
