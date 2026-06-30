import mongoose from "mongoose";

const ContactSchema = new mongoose.Schema(
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

    role: {
      type: String,
      required: [true, "Role is required"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
    },

    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
    },
  },
  { timestamps: true },
);

export default mongoose.models.Contact ||
  mongoose.model("Contact", ContactSchema);
