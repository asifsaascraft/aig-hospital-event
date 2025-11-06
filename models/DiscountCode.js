import mongoose from "mongoose";

const DiscountCodeSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    codeName: {
      type: String,
      required: [true, "Code name is required"],
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["Percentage", "Fixed"],
      required: [true, "Discount Type is required"],
      trim: true,
    },
    discount: {
      type: Number,
      required: [true, "Discount is required"],
    },
    redemptionLimit: {
      type: Number,
      required: [true, "Max Redeem Allowed is required"],
    },
    startDate: {
      type: String, // Format: DD/MM/YYYY
      required: [true, "Start Date is required"],
    },
    endDate: {
      type: String, // Format: DD/MM/YYYY
      required: [true, "End Date is required"],
    },
    startTime: {
      type: String, // Format: hh:mm A (e.g., 09:00 AM)
      required: [true, "Start Time is required"],
    },
    endTime: {
      type: String, // Format: hh:mm A (e.g., 05:00 PM)
      required: [true, "End Time is required"],
    },
  },
  { timestamps: true }
);

export default mongoose.models.DiscountCode ||
  mongoose.model("DiscountCode", DiscountCodeSchema);
