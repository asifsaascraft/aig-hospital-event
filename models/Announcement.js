import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
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

const Announcement = mongoose.models.Announcement || mongoose.model("Announcement", announcementSchema);

export default Announcement;
