import mongoose from "mongoose";

// =====================================
// Field Schema for Dynamic Form Builder
// =====================================
const FormFieldSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // Unique ID generated from UI

    type: {
      type: String,
      enum: [
        "input",
        "textarea",
        "select",
        "checkbox",
        "radio",
        "date"
      ],
      required: true,
    },

    label: { type: String, required: true },

    placeholder: { type: String },

    // For input fields
    inputTypes: {
      type: String,
      enum: [
        "text",
        "number",
        "email",
        "password",
        "tel",
        "date",
        "time",
        "datetime-local",
        "file",
      ],
    },

    required: {
      type: Boolean,
      default: false,
    },

    description: {
      type: String,
      default: "",
    },

    defaultValue: {
      type: mongoose.Schema.Types.Mixed,
      default: "",
    },

    // For input, textarea text length validation
    minLength: { type: Number },
    maxLength: { type: Number },

    // For file validation: max size in MB
    maxFileSize: { type: Number }, // Example: 2 means 2MB

    fileUploadTypes: {
      type: String,
    },

    // For select, radio, checkbox
    options: {
      type: [String],
      default: [],
    },

    // Checkbox min/max selections
    minSelected: { type: Number },
    maxSelected: { type: Number },

    // Default Input Value / Checkbox Array / Text
    value: {
      type: mongoose.Schema.Types.Mixed,
      default: "",
    },
  },
  { _id: false }
);

// =====================================
// MAIN Dynamic Registration Form Schema
// =====================================
const DynamicRegFormSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    title: {
      type: String,
      default: "Dynamic Registration Form",
    },

    fields: {
      type: [FormFieldSchema],
      required: true,
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.models.DynamicRegForm ||
  mongoose.model("DynamicRegForm", DynamicRegFormSchema);
