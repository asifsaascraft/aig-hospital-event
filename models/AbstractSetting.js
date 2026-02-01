import mongoose from "mongoose";

const AbstractSettingSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    regRequiredForAbstractSubmission: {
      type: Boolean,
      default: false,
    },
    uploadFileRequired: {
      type: Boolean,
      default: false,
    },
    uploadVideoUrlRequired: {
      type: Boolean,
      default: false,
    },
    abstractSubmissionStartDate: {
      type: Date,
    },
    abstractSubmissionEndDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return (
            !this.abstractSubmissionStartDate ||
            value >= this.abstractSubmissionStartDate
          );
        },
        message:
          "Abstract submission end date must be greater than or equal to start date",
      },
    },
    numberOfAbstractSubmission: {
      type: Number,
      min: 1,
      default: 1,
      required: [true, "Number of reviewers per category is required"],
    },
    abstractWordCount: {
      type: Number,
      min: 1,
      default: 1,
      required: [true, "Abstract word count is required"],
    },
    reviewingType: {
      type: String,
      enum: ["ACCEPT_REJECT", "SCORE_BASED"],
      default: "ACCEPT_REJECT",
      required: [true, "Review Type is required"],
    },
    minimumScore: {
      type: Number,
      min: 0,
      default: null,
    },
    maximumScore: {
      type: Number,
      min: 0,
      default: null,
    },
    message: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true },
);

export default mongoose.models.AbstractSetting ||
  mongoose.model("AbstractSetting", AbstractSettingSchema);
