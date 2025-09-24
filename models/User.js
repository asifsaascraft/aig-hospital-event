import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
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
      enum: ["admin", "user", "eventAdmin", "sponsor", "exhibitor", "onsite"],
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
  },
  { timestamps: true }
);

//  Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

//  Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 🛡 Generate JWT token
userSchema.methods.getJwtToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

export default mongoose.model("User", userSchema);
