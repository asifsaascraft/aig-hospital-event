import mongoose from "mongoose";

// FOR EVENT DYNAMIC FORM ANSWERS
const DynamicFormAnswerSchema = new mongoose.Schema(
  {
    id: { type: String },      // DynamicRegForm id is STRING
    label: String,
    type: String,
    required: Boolean,
    value: mongoose.Schema.Types.Mixed,
    fileUrl: String,
    minLength: Number,
    maxLength: Number,
    minSelected: Number,
    maxSelected: Number,
  },
  { _id: false }
);

const AdditionalAnswerSchema = new mongoose.Schema(
  {
    id: Number,
    label: String,
    type: String,
    value: mongoose.Schema.Types.Mixed,
    fileUrl: String,
  },
  { _id: false }
);

const EventRegistrationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sponsor",
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    registrationSlabId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RegistrationSlab",
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
    // (FOR EVENT DYNAMIC FORM)
    dynamicFormAnswers: {
      type: [DynamicFormAnswerSchema],
      default: [],
    },
    additionalAnswers: {
      type: [AdditionalAnswerSchema],
      default: [],
    },
    // this field store only, when event admin add accompany
    amount: {
      type: Number,
      min: [0, "Amount must be a positive number"],
    },
    spotRegistration: {
      type: Boolean,
      default: false,
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
