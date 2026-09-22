
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

    roomCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomCategory",
      required: [true, "Room category is required"],
    },

    numberOfRooms: {
      type: Number,
      required: [true, "Number of room is required"],
      min: [1, "Number of rooms must be at least 1"],
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
      required: [true, "Check-out date time is required"],

      validate: [
        {
          validator: function (value) {
            if (!this.checkinDateTime || !value) return true;
            return value > this.checkinDateTime;
          },
          message:
            "Check-out date time must be greater than check-in date time",
        },
        {
          validator: function (value) {
            if (!this.checkinDateTime || !value) return true;

            const checkin = new Date(this.checkinDateTime);
            const checkout = new Date(value);

            const nextDay = new Date(checkin);
            nextDay.setUTCDate(nextDay.getUTCDate() + 1);

            return (
              checkout.getUTCFullYear() === nextDay.getUTCFullYear() &&
              checkout.getUTCMonth() === nextDay.getUTCMonth() &&
              checkout.getUTCDate() === nextDay.getUTCDate()
            );
          },
          message:
            "Checkout date must be exactly one day after check-in date",
        },
      ],
    },
  },
  { timestamps: true }
);

// Avoid model overwrite during hot-reload
export default mongoose.models.AddRoom ||
  mongoose.model("AddRoom", AddRoomSchema);