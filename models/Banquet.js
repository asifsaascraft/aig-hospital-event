import mongoose from "mongoose";

const BanquetSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    banquetslabName: {
      type: String,
      required: [true, "Banquet Slab name is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be a positive number"],
    },
    startDate: {
      type: String, // Format: DD/MM/YYYY
      required: [true, "Start Date is required"],
    },
    endDate: {
      type: String, // Format: DD/MM/YYYY
      required: [true, "End Date is required"],
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"], //  restricts to these values
      default: "Active",
      required: [true, "Status is required"],
    },
  },
  { timestamps: true }
);

export default mongoose.models.Banquet ||
  mongoose.model("Banquet", BanquetSchema);
