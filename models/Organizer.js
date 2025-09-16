// models/Organizer.js
import mongoose from "mongoose";

const OrganizerSchema = new mongoose.Schema(
  {
    organizerName: {
      type: String,
      required: [true, "Organizer Name is required"],
      trim: true,
    },
    contactPersonName: {
      type: String,
      required: [true, "Contact Person is required"],
      trim: true,
    },
    contactPersonMobile: {
      type: String,
      required: [true, "Mobile number is required"],
      match: [/^\d{10}$/, "Mobile number must be 10 digits"],
    },
    contactPersonEmail: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"], // restricts to these values
      default: "Active",
      required: [true, "Status is required"],
    },
  },
  { timestamps: true } // adds createdAt & updatedAt automatically
);

// Avoid model overwrite during hot-reload
const Organizer =
  mongoose.models.Organizer || mongoose.model("Organizer", OrganizerSchema);

export default Organizer;
