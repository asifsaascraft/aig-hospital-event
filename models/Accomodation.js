import mongoose from "mongoose";

const AccomodationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sponsor",
      required: true,
    },

    eventRegistrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventRegistration",
      required: true,
    },

    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },

    roomType: {
      type: String,
      enum: ["Single Occupancy", "Double Occupancy", "Twin Sharing"], //  restricts to these values
      default: "Single Occupancy",
      required: [true, "Room type is required"],
    },

    guestName: {
      type: String,
      trim: true,
    },

    otherEventRegistrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventRegistration",
    },

    checkinDateTime: {
      type: Date,
      required: true,
    },

    checkoutDateTime: {
      type: Date,
      required: true,
    },

    //  IMPORTANT: store per-day booking
    accomodationDays: [
      {
        date: {
          type: String, // YYYY-MM-DD
          required: true,
        },
        quotaId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "AddRoom",
          required: true,
        },
        hotelId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Hotel",
          required: true,
        }
      }
    ],
  },
  { timestamps: true }
);

AccomodationSchema.pre("validate", function (next) {
  // Required validations
  if (this.roomType === "Double Occupancy" && !this.guestName) {
    return next(new Error("Guest name is required for Double Occupancy"));
  }

  if (this.roomType === "Twin Sharing" && !this.otherEventRegistrationId) {
    return next(new Error("Other delegate is required for Twin Sharing"));
  }

  //  CLEANUP LOGIC (IMPORTANT)
  if (this.roomType !== "Double Occupancy") {
    this.guestName = null;
  }

  if (this.roomType !== "Twin Sharing") {
    this.otherEventRegistrationId = null;
  }

  next();
});

export default mongoose.models.Accomodation ||
  mongoose.model("Accomodation", AccomodationSchema);


