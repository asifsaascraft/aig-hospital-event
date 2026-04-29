import mongoose from "mongoose";

const OtherTeamSchema = new mongoose.Schema(
  {
    contactPersonName: {
      type: String,
      required: [true, "Contact Person is required"],
      trim: true,
    },
    contactPersonEmail: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
      unique: true,
    },
    contactPersonMobile: {
      type: String,
      required: [true, "Mobile number is required"],
      match: [/^\d{10}$/, "Mobile number must be 10 digits"],
      trim: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"], //  restricts to these values
      default: "Active",
      required: [true, "Status is required"],
    },
  },
  { timestamps: true }
);

// Avoid model overwrite during hot-reload
export default mongoose.models.OtherTeam ||
  mongoose.model("OtherTeam", OtherTeamSchema);

