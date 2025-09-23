import mongoose from "mongoose";

const RoomCategorySchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: [true, "Hotel Name is required"],
    },
    roomCategory: {
      type: String,
      required: [true, "Room Category is required"],
    },
    roomType: {
      type: String,
      required: [true, "Room Type is required"],
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
const RoomCategory =
  mongoose.models.RoomCategory || mongoose.model("RoomCategory", RoomCategorySchema);

export default RoomCategory;
