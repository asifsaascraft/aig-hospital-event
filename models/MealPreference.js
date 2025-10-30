import mongoose from "mongoose";

const MealPreferenceSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    mealName: {
      type: String,
      required: [true, "Meal name is required"],
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

export default mongoose.models.MealPreference ||
  mongoose.model("MealPreference", MealPreferenceSchema);
