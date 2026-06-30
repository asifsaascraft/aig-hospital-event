import mongoose from "mongoose";

const QuickLinkSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    title: {
      type: String,
      required: [true, "Title is required"],
    },

    quickLink: {  // (url link like https://www.google.com
      type: String, 
      required: [true, "Link is required"],
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

export default mongoose.models.QuickLink ||
  mongoose.model("QuickLink", QuickLinkSchema);
