import mongoose from "mongoose";

const CardProfileSchema = new mongoose.Schema(
  {
    CardProfileName: {
      type: String,
      required: [true, "Card profile name is required"],
      trim: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      required: [true, "Status is required"],
    },
  },
  { timestamps: true }
);

// Prevent duplicate globally
CardProfileSchema.index(
  { CardProfileName: 1 },
  { unique: true }
);

export default mongoose.models.CardProfile ||
  mongoose.model("CardProfile", CardProfileSchema);