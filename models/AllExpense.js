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
    amount: {
      type: Number,
      required: [true, "Amount is required"],
    },
    unit: {
      type: Number,
      required: [true, "Unit is required"],
    },
    unitType: {
      type: String,
      required: [true, "Unit Type is required"],
    },
    gstAmount: {
      type: Number,
      required: [true, "GST Amount is required"],
    },
  },
  { timestamps: true }
);

export default mongoose.models.AllExpense ||
  mongoose.model("AllExpense", AllExpenseSchema);
