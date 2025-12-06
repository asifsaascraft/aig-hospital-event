
import mongoose from "mongoose";

const OptionSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    label: { type: String, required: true },
  },
  { _id: false }
);

const AdditionalFieldSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    type: {
      type: String,
      enum: ["textbox", "upload", "radio", "checkbox", "date"],
      required: true,
    },
    label: { type: String },

    // Only for upload fields
    extension: { type: String },

    // Only for radio/checkbox fields
    options: { type: [OptionSchema], default: [] },
  },
  { _id: false }
);

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
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return !this.startDate || value >= this.startDate;
        },
        message: "End date must be greater than or equal to start date",
      },
    },

    needAdditionalInfo: {
      type: Boolean,
      default: false,
    },

    additionalFields: {
      type: [AdditionalFieldSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.models.RegistrationSlab ||
  mongoose.model("RegistrationSlab", RegistrationSlabSchema);