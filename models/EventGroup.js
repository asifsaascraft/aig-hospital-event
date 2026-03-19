import mongoose from "mongoose";

const EventGroupSchema = new mongoose.Schema(
  {
    groupName: {
      type: String,
      required: [true, "Group Name is required"],
      trim: true,
      unique: true,
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

// Avoid model overwrite during hot-reload
export default mongoose.models.EventGroup ||
  mongoose.model("EventGroup", EventGroupSchema);

