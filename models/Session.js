import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    sessionName: {
      type: String,
      required: [true, "Session Name is required"],
    },

    sessionDescription: {
      type: String,
      required: [true, "Description is required"],
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

    sessionHallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SessionHall",
      required: true,
    },

    sessionTrackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SessionTrack",
      required: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"], //  restricts to these values
      default: "Active",
      required: [true, "Status is required"],
    },
  },
  { timestamps: true },
);

export default mongoose.models.Session ||
  mongoose.model("Session", SessionSchema);
