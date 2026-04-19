import mongoose from "mongoose";

const ExpenseHeadSchema = new mongoose.Schema(
  {
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
      default: 1,
      immutable: true, 
    },
    unitType: {
      type: String,
      required: [true, "Unit Type is required"],
    },
    gstAmount: {
      type: Number,
      required: [true, "GST Amount is required"],
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

export default mongoose.models.ExpenseHead ||
  mongoose.model("ExpenseHead", ExpenseHeadSchema);
