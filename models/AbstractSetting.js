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
    abstractSubmissionStartDate: {
      type: Date,
    },
    abstractSubmissionEndDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return !this.abstractSubmissionStartDate || value >= this.abstractSubmissionStartDate;
        },
        message: "Abstract submission end date must be greater than or equal to start date",
      },
    },
    numberOfReviewerPerCategory: {
      type: Number,
      required: [true, "Number of reviewers per category is required"],
    },
    abstractWordCount: {
      type: Number,
      required: [true, "Abstract word count is required"],
    },
  },
  { timestamps: true }
);

export default mongoose.models.AbstractSetting ||
  mongoose.model("AbstractSetting", AbstractSettingSchema);
