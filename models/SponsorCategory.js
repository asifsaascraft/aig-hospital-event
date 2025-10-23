import mongoose from "mongoose";

const SponsorCategorySchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    categoryName: {
      type: String,
      required: [true, "Sponsor Category Name is required"],
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

export default mongoose.models.SponsorCategory ||
  mongoose.model("SponsorCategory", SponsorCategorySchema);
