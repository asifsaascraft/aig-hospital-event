import mongoose from "mongoose";

const AbstractCategorySchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    categoryLabel: {
      type: String,
      required: [true, "Category Label is required"],
      trim: true,
    },
    categoryOptions: {
      type: [String],
      required: [true, "Option is required"]
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

export default mongoose.models.AbstractCategory ||
  mongoose.model("AbstractCategory", AbstractCategorySchema);
