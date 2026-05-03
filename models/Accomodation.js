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
          type: Date,
          required: true,
        },
        quotaId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "AddRoom",
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Accomodation ||
  mongoose.model("Accomodation", AccomodationSchema);