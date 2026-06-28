import mongoose from "mongoose";

const CommitteeMemberSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    committeeType: {
      type: String,
      required: [true, "Committee Type is required"],
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
