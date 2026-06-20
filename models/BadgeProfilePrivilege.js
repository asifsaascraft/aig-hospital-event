import mongoose from "mongoose";

const BadgeProfilePrivilegeSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    badgeProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CardProfile",
      required: true,
    },
    scanTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScanType",
      required: true,
    },
    isAllowed: {
      type: Boolean,
      default: false,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

BadgeProfilePrivilegeSchema.index(
  {
    eventId: 1,
    badgeProfileId: 1,
    scanTypeId: 1,
  },
  { unique: true },
);

export default mongoose.models.BadgeProfilePrivilege ||
  mongoose.model("BadgeProfilePrivilege", BadgeProfilePrivilegeSchema);
