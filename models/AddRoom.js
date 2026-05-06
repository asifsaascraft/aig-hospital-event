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
    checkinDateTime: {
      type: Date,
      required: [true, "Check-in date time is required"],
    },
    checkoutDateTime: {
      type: Date,
      validate: {
        validator: function (value) {
          if (!this.checkinDateTime || !value) return true;
          return value > this.checkinDateTime;
        },
        message: "check-out date time must be greater than to check-in date time",
      },
      required: [true, "Check-out date time is required"],
    },
  },
  { timestamps: true },
);

//  Prevent duplicate (eventId + hotel + checkinDate)
AddRoomSchema.index(
  { eventId: 1, hotelId: 1, checkinDateTime: 1 },
  { unique: true }
);

// Avoid model overwrite during hot-reload
export default mongoose.models.AddRoom ||
  mongoose.model("AddRoom", AddRoomSchema);
