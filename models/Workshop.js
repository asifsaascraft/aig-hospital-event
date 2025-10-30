import mongoose from "mongoose";

const WorkshopSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    workshopName: {
      type: String,
      required: [true, "Workshop name is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be a positive number"],
    },
    inventory: {
      type: Number,
      required: [true, "Inventory is required"],
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
    isEventRegistrationRequired: {
      type: Boolean,
      required: true,
      default: false,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Workshop ||
  mongoose.model("Workshop", WorkshopSchema);
