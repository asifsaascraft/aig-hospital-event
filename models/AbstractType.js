import mongoose from "mongoose";

const AbstractTypeSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    typeName: {
      type: String,
      required: [true, "Abstract Type Name is required"],
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

export default mongoose.models.AbstractType ||
  mongoose.model("AbstractType", AbstractTypeSchema);
