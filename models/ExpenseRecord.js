import mongoose from "mongoose";

const ExpenseRecordSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    companyName: {
      type: String,
      required: [true, "Company Name is required"],
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
      trim: true,
      unique: true,
    },
    contactPersonEmail: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
      unique: true,
    },
    invoiceNumber : {
      type: String,
      required: [true, "Invoice is required"],
      trim: true,
    },
    date: {
      type: String, // Format: DD/MM/YYYY
      required: [true, "Date is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
    },
  },
  { timestamps: true }
);

export default mongoose.models.ExpenseRecord ||
  mongoose.model("ExpenseRecord", ExpenseRecordSchema);
