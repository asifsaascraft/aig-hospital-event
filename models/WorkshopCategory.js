import mongoose from "mongoose";

const WorkshopCategorySchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    workshopCategoryName: {
      type: String,
      required: [true, "Workshop Category Name is required"],
      trim: true,
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

export default mongoose.models.WorkshopCategory ||
  mongoose.model("WorkshopCategory", WorkshopCategorySchema);
