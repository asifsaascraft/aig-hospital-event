
import mongoose from "mongoose";

// =========================
// Options schema
// (Used for radio + checkbox)
// =========================
const OptionSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    label: { type: String, required: true },
  },
  { _id: false }
);

// =========================
// Additional Field Schema
// =========================
const AdditionalFieldSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },

    type: {
      type: String,
      enum: ["textbox", "upload", "radio", "checkbox", "date"],
      required: true,
    },

    // Textbox / Upload / Radio / Checkbox / Date
    label: { type: String },

    // Upload only
    extension: { type: String },

    // Radio or Checkbox only
    options: {
      type: [OptionSchema],
      default: [],
    },
  },
  { _id: false }
);

// =========================
// Main Registration Slab Schema
// =========================
const RegistrationSlabSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    slabName: {
      type: String,
      required: [true, "Slab name is required"],
      trim: true,
    },

    amount: {
      type: Number,
      min: [0, "Amount must be a positive number"],
    },

    AccompanyAmount: {
      type: Number,
      min: [0, "Accompany amount must be a positive number"],
    },

    startDate: {
      type: String, // Format: DD/MM/YYYY
      required: [true, "Start Date is required"],
    },
    
    endDate: {
      type: String, // Format: DD/MM/YYYY
      required: [true, "End Date is required"],
    },

    // Additional Information Switch
    needAdditionalInfo: {
      type: Boolean,
      default: false,
    },

    // Dynamic Form Fields
    additionalFields: {
      type: [AdditionalFieldSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.models.RegistrationSlab ||
  mongoose.model("RegistrationSlab", RegistrationSlabSchema);