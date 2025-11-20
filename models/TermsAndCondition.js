import mongoose from "mongoose";

const TermsAndConditionSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },

  },
  { timestamps: true }
);

export default mongoose.models.TermsAndCondition ||
  mongoose.model("TermsAndCondition", TermsAndConditionSchema);
