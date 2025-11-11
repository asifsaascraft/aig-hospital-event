import mongoose from "mongoose";

const RegistrationSettingSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    attendeeRegistration: {
      type: Boolean,
      default: false,
    },
    accompanyRegistration: {
      type: Boolean,
      default: false,
    },
    workshopRegistration: {
      type: Boolean,
      default: false,
    },
    banquetRegistration: {
      type: Boolean,
      default: false,
    },
    eventRegistrationStartDate: {
      type: Date,
    },
    eventRegistrationEndDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return !this.eventRegistrationStartDate || value >= this.eventRegistrationStartDate;
        },
        message: "Event Registration End date must be greater than or equal to start date",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.models.RegistrationSetting ||
  mongoose.model("RegistrationSetting", RegistrationSettingSchema);
