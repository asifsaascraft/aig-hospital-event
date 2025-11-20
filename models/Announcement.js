import mongoose from "mongoose";

const AnnouncementSchema = new mongoose.Schema(
  {
    heading: {
      type: String,
      required: [true, "Announcement title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Announcement description is required"],
      trim: true,
    },
    postedBy: {
      type: String,
      required: [true, "Posted By is required"],
      trim: true,
    },
  },
  { timestamps: true } // auto adds createdAt & updatedAt
);

export default mongoose.models.Announcement ||
  mongoose.model("Announcement", AnnouncementSchema);

