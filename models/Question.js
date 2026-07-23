import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema(
  {
    questionName: {
      type: String,
      required: [true, "Question is required"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
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

export default mongoose.models.Question ||
  mongoose.model("Question", QuestionSchema);
