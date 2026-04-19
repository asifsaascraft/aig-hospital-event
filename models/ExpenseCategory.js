import mongoose from "mongoose";

const ExpenseCategorySchema = new mongoose.Schema(
  {
    expenseCategoryName: {
      type: String,
      required: [true, "Expense category Name is required"],
      trim: true,
      unique: true,
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

export default mongoose.models.ExpenseCategory ||
  mongoose.model("ExpenseCategory", ExpenseCategorySchema);
