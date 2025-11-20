import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    plainPassword: {          //  Added field for storing original password
      type: String,
    },
    role: {
      type: String,
      enum: ["admin", "user", "eventAdmin"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active", // only relevant for admin
    },
    //  Added for Team (eventAdmin)
    companyName: {
      type: String,
      trim: true,
    },
    mobile: {
      type: String,
      match: [/^\d{10}$/, "Mobile number must be 10 digits"],
      trim: true,
      unique: true,
    },
    //  Assigned events for eventAdmin (array of Event ObjectIds)
    assignedEvents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: [],
    }],
    //  For forgot-password/reset-password
    passwordResetToken: {
      type: String,
      trim: true,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },

    // -------------------------
    // Additional fields for general "user" role (added; optional — no defaults)
    // -------------------------
    // prefix, designation, affiliation, medical council, address details, preferences, profile pic, term acceptance
    prefix: {
      type: String,
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    affiliation: {
      type: String,
      trim: true,
    },
    medicalCouncilState: {
      type: String,
      trim: true,
    },
    medicalCouncilRegistration: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    profilePicture: {
      type: String,
      trim: true,
    },
    termAndCondition: {
      type: Boolean,
    },
    // -------------------------
  },
  { timestamps: true }
);

//  Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

//  Compare entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 🛡 Generate JWT token
UserSchema.methods.getJwtToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

export default mongoose.models.User ||
  mongoose.model("User", UserSchema);
