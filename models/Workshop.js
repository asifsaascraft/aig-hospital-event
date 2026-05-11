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
    workshopCategory: {
      type: String,
      required: [true, "Workshop Category is required"],
      trim: true,
    },
    hallName: {
      type: String,
      required: [true, "Hall name is required"],
      trim: true,
    },
    workshopRegistrationType: {
      type: String,
      required: [true, "Workshop Registration Type is required"], //either Paid or Free
      trim: true,
    },
    amount: {
      type: Number,
      default: 0,
      min: [0, "Amount must be a positive number"],
    },
    maxRegAllowed: {
      type: Number,
      required: [true, "Max Registration Allowed is required"],
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
    isEventRegistrationRequired: {
      type: Boolean,
      required: true,
      default: false,
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

export default mongoose.models.Workshop ||
  mongoose.model("Workshop", WorkshopSchema);
