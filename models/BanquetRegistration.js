import mongoose from "mongoose";


const BanquetRegistrationSchema = new mongoose.Schema(
  {
    banquetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Banquet",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    eventRegistrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventRegistration",
      required: true,
    },
    banquets: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        accompanyParentId: {
          // ID of the Accompany document
          type: mongoose.Schema.Types.ObjectId,
          ref: "Accompany",
        },
        accompanySubId: {
          // ID of the individual accompany inside the array
          type: mongoose.Schema.Types.ObjectId,
        },
        otherName: {
          type: String,
        },
        isPaid: {
          type: Boolean,
          default: false,
        },
        isSuspended: {
          type: Boolean,
          required: true,
          default: false,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.BanquetRegistration ||
  mongoose.model("BanquetRegistration", BanquetRegistrationSchema);
