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
  { timestamps: true }
);

export default mongoose.models.DiscountCode ||
  mongoose.model("DiscountCode", DiscountCodeSchema);
