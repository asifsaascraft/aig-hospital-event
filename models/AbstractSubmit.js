import mongoose from "mongoose";

const AbstractSubmitSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    presenterName: {
      type: String,
      required: [true, "Presenter Name is required"],
      trim: true,
    },

    coAuthor: {
      type: [String],
      default: [],
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },

    abstract: {
      type: String,
      required: [true, "Abstract is required"],
    },

    categories: {
      type: [
        {
          categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AbstractCategory",
            required: true,
          },
          selectedOption: {
            type: String,
            required: true,
            trim: true,
          },
        },
      ],
      default: [],
    },

    abstractNumber: {
      type: String,
      unique: true,
      index: true,
    },

    uploadFile: {
      type: String, // file path or URL
    },

    uploadVideoUrl: {
      type: String, // URL
    },

    status: {
      type: String,
      enum: ["Pending", "Reviewed", "Accept", "Reject"],
      default: "Pending",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.AbstractSubmit ||
  mongoose.model("AbstractSubmit", AbstractSubmitSchema);
