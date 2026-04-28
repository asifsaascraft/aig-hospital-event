import mongoose from "mongoose";

const IncomeSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sponsor",
      required: [true, "Sponsor is required"],
    },
    purposedAmount: {
      type: Number,
      required: [true, "Purposed amount is required"],
    },
    receivedAmount: {
      type: Number,
    },
    note: {
      type: String,
      trim: true,
    },
    dateTime: {
      type: Date,
      required: [true, "Date time is required"],
    },
  },
  { timestamps: true }
);

//  Prevent duplicate sponsor per event
IncomeSchema.index({ eventId: 1, sponsorId: 1 }, { unique: true });

export default mongoose.models.Income ||
  mongoose.model("Income", IncomeSchema);