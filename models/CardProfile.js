import mongoose from "mongoose";

const CardProfileSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    CardProfileName: {
      type: String,
      required: [true, "Card profile name is required"],
      trim: true,
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

//  Prevent duplicate name per event
CardProfileSchema.index(
  { eventId: 1, CardProfileName: 1 },
  { unique: true }
);

export default mongoose.models.CardProfile ||
  mongoose.model("CardProfile", CardProfileSchema);