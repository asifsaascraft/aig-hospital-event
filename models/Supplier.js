// models/Supplier.js
import mongoose from "mongoose";

const SupplierSchema = new mongoose.Schema(
  {
    supplierName: {
      type: String,
      required: [true, "Supplier name is required"],
      trim: true,
    },
    services: {
      type: String,
      required: [true, "Services are required"],
      trim: true,
    },
    contactPersonName: {
      type: String,
      required: [true, "Contact person name is required"],
      trim: true,
    },
    contactPersonEmail: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
    },
    contactPersonMobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
      match: [/^\d{10}$/, "Mobile number must be 10 digits only"],
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      required: [true, "Status is required"],
    },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// Avoid model overwrite during hot-reload
const Supplier =
  mongoose.models.Supplier || mongoose.model("Supplier", SupplierSchema);

export default Supplier;
