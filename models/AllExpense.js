import mongoose from "mongoose";

const AllExpenseSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    expenseCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExpenseCategory",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    baseAmount: {
      type: Number,
      required: [true, "Base Amount is required"],
    },
    unit: {
      type: Number,
      required: [true, "Unit is required"],
    },
    unitType: {
      type: String,
      required: [true, "Unit Type is required"],
    },
    gstTax: {
      // In percentage
      type: Number,
      required: [true, "GST tax is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    totalAmountWithoutGst: {
      type: Number,
    },
    gstAmount: {
      type: Number,
    },
    totalAmountWithGst: {
      type: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.models.AllExpense ||
  mongoose.model("AllExpense", AllExpenseSchema);
