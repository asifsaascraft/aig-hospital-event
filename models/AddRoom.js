import mongoose from "mongoose";

const AddRoomSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: [true, "Hotel is required"],
    },
    numberOfRooms: {
      type: Number,
      required: [true, "Number of room is required"],
    },
    availableRooms: {
      type: Number,
      default: 0,
    },
    checkinDate: {
      type: Date,
      required: [true, "Checkin Date is required"],
    },
  },
  { timestamps: true },
);

//  Prevent duplicate (eventId + hotel + checkinDate)
AddRoomSchema.index(
  { eventId: 1, hotelId: 1, checkinDate: 1 },
  { unique: true }
);

// Avoid model overwrite during hot-reload
export default mongoose.models.AddRoom ||
  mongoose.model("AddRoom", AddRoomSchema);
