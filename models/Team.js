import mongoose from "mongoose";

const TeamSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, "Company Name is required"],
      trim: true,
    },
    contactPersonName: {
      type: String,
      required: [true, "Contact Person is required"],
      trim: true,
    },
    contactPersonMobile: {
      type: String,
      required: [true, "Mobile number is required"],
      match: [/^\d{10}$/, "Mobile number must be 10 digits"],
    },
    contactPersonEmail: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"], // restricts to these values
      default: "Active",
      required: [true, "Status is required"],
    },
  },
  { timestamps: true }
);

// Avoid model overwrite during hot-reload
const Team = mongoose.models.Team || mongoose.model("Team", TeamSchema);

export default Team;
