import mongoose from "mongoose";

const IncomeRecordSchema = new mongoose.Schema(
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
    amountReceived: {
      type: Number,
      required: [true, "Amount received is required"],
    },
    utrNumber : {
      type: String,
      required: [true, "UTR is required"],
      trim: true,
    },
    date: {
      type: String, // Format: DD/MM/YYYY
      required: [true, "Date is required"],
    },
    
  },
  { timestamps: true }
);

export default mongoose.models.IncomeRecord ||
  mongoose.model("IncomeRecord", IncomeRecordSchema);
