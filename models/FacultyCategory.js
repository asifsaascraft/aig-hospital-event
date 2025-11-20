import mongoose from "mongoose";

const FacultyCategorySchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    facultyType: {
      type: String,
      required: [true, "Faculty Type is required"],
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

export default mongoose.models.FacultyCategory ||
  mongoose.model("FacultyCategory", FacultyCategorySchema);
