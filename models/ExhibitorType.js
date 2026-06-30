import mongoose from "mongoose";

const ExhibitorTypeSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    exhibitorType: {
      type: String,
      required: [true, "Exhibitor Type is required"],
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"], //  restricts to these values
      default: "Active",
      required: [true, "Status is required"],
    },
  },
  { timestamps: true },
);

export default mongoose.models.ExhibitorType ||
  mongoose.model("ExhibitorType", ExhibitorTypeSchema);
