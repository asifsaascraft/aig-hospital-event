import mongoose from "mongoose";

const CommitteeMemberSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    name: {
      type: String,
      required: [true, "Name is required"],
    },

    designation: {
      type: String,
      required: [true, "Designation is required"],
    },

    committeeTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommitteeType",
      required: true,
    },

    images: {  // optional
      type: String, // store file path or URL
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

export default mongoose.models.CommitteeMember ||
  mongoose.model("CommitteeMember", CommitteeMemberSchema);
