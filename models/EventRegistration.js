import mongoose from "mongoose";


const EventRegistrationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    registrationSlabId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RegistrationSlab",
      required: true,
    },
    prefix: {
      type: String,
      required: [true, "Prefix is required"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    mobile: {
      type: String,
      match: [/^\d{10}$/, "Mobile number must be 10 digits"],
      trim: true,
    },
    designation: {
      type: String,
      required: [true, "Designation is required"],
      trim: true,
    },
    affiliation: {
      type: String,
      required: [true, "Affiliation is required"],
      trim: true,
    },
    medicalCouncilState: {
      type: String,
      required: [true, "Council State is required"],
      trim: true,
    },
    medicalCouncilRegistration: {
      type: String,
      required: [true, "Council Reg is required"],
      trim: true,
    },
    mealPreference: {
      type: String,
      required: [true, "Meal is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, "Pin Code is required"],
      trim: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    regNum: {
      type: String,
      trim: true,
    },
    regNumGenerated: {
      type: Boolean,
      default: false,
    },
    isSuspended: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);



// Avoid model overwrite during hot-reload
export default mongoose.models.EventRegistration || 
    mongoose.model("EventRegistration", EventRegistrationSchema);
