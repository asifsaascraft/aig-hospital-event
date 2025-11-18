import mongoose from "mongoose";

const AgendaSessionTypeSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    sessionTypeName: {
      type: String,
      required: [true, "Session Type Name is required"],
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

export default mongoose.models.AgendaSessionType ||
  mongoose.model("AgendaSessionType", AgendaSessionTypeSchema);
