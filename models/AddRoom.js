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
    startDateTime: {
      type: Date,
      required: [true, "Start Date time is required"],
    },
    endDateTime: {
      type: Date,
      validate: {
        validator: function (value) {
          if (!this.startDateTime || !value) return true;
          return value >= this.startDateTime;
        },
        message: "End date time must be greater than or equal to start date time",
      },
      required: [true, "End Date is required"],
    },
  },
  { timestamps: true },
);

// Avoid model overwrite during hot-reload
export default mongoose.models.AddRoom ||
  mongoose.model("AddRoom", AddRoomSchema);
