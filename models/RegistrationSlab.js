import mongoose from "mongoose";

const RegistrationSlabSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    slabName: {
      type: String,
      required: [true, "Slab name is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be a positive number"],
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return !this.startDate || value >= this.startDate;
        },
        message: "End date must be greater than or equal to start date",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.models.RegistrationSlab ||
  mongoose.model("RegistrationSlab", RegistrationSlabSchema);
