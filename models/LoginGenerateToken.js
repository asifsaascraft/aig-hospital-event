import mongoose from "mongoose";

const LoginGenerateTokenSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    loginToken: {
      type: String,
      required: [true, "Login Token is required"],
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

export default mongoose.models.LoginGenerateToken ||
  mongoose.model("LoginGenerateToken", LoginGenerateTokenSchema);