import mongoose from "mongoose";

const DownloadSchema = new mongoose.Schema(
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

    uploadFile: {  // All file (max 10 MB)
      type: String, // store file path or URL
      required: [true, "File is required"],
    },

  },
  { timestamps: true },
);

export default mongoose.models.Download ||
  mongoose.model("Download", DownloadSchema);
