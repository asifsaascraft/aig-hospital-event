import mongoose from "mongoose";

const WorkshopRegistrationSchema = new mongoose.Schema(
  {
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
    workshopIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workshop",
        required: true,
      },
    ],
    registrationType: {
      type: String,
      enum: ["Paid", "Free"],
      required: true,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.WorkshopRegistration ||
  mongoose.model("WorkshopRegistration", WorkshopRegistrationSchema);
