import mongoose from "mongoose";

const RoomCategorySchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    roomCategoryName: {
      type: String,
      required: [true, "Room category is required"],
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

export default mongoose.models.RoomCategory ||
  mongoose.model("RoomCategory", RoomCategorySchema);
