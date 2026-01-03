import crypto from "crypto";
import User from "../models/User.js";
import { generateTokens } from "../utils/generateTokens.js";
import sendEmailWithTemplate from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../config/s3.js";

// =======================
// User Signup (Public)
// =======================
export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      termAndCondition,
      prefix,
      affiliation,
      mobile,
      mciRegistered,
      mciNumber,
      mciState,
      department,
      gender,
      address,
      state,
      city,
      pincode,
      country,
    } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    //  Check if mobile already exists
    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile already exists",
      });
    }

    // Create user (role = 'user')
    const user = await User.create({
      name,
      email,
      password,
      termAndCondition,
      prefix,
      affiliation,
      mobile,
      mciRegistered,
      mciNumber,
      mciState,
      department,
      gender,
      address,
      state,
      city,
      pincode,
      country,
      role: "user",
      status: "Active",
    });

    // =======================
    // Send Welcome Email
    // =======================
    try {
      await sendEmailWithTemplate({
        to: user.email,
        name: user.name,
        templateKey: "2518b.554b0da719bc314.k1.4b76afb1-a361-11f0-bc12-525400c92439.199be08ce2b",
        mergeInfo: {
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          affiliation: user.affiliation || "N/A",
        },
      });
    } catch (emailError) {
      console.error("Error sending registration email:", emailError);
    }

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register user error:", error);
    res.status(500).json({ message: error.message });
  }
};

// =======================
// User Login
// =======================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, role: "user" });
    if (!user) return res.status(400).json({ message: "Email does not exist" });

    if (user.status !== "Active") {
      return res.status(403).json({ message: "User account is inactive" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "You entered wrong password" });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    // Store refresh token in cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "User login successful",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login user error:", error);
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Refresh Access Token
// =======================
export const refreshAccessTokenUser = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

// =======================
// Logout User
// =======================
export const logoutUser = (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
};

// =======================
// Forgot Password
// =======================
export const forgotPasswordUser = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, role: "user" });
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");
    const resetToken = crypto.createHash("sha256").update(token.trim()).digest("hex");

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.USER_FRONTEND_URL;
    const resetUrl = `${frontendUrl}/reset-password/${token}`;

    await sendEmailWithTemplate({
      to: user.email,
      name: user.name,
      templateKey:
        "2518b.554b0da719bc314.k1.01bb6360-9c50-11f0-8ac3-ae9c7e0b6a9f.1998fb77496",
      mergeInfo: {
        name: user.name,
        password_reset_link: resetUrl,
      },
    });

    res.json({ message: "Password reset link sent to your email address" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to send reset email" });
  }
};

// =======================
// Reset Password
// =======================
export const resetPasswordUser = async (req, res) => {
  try {
    let { token } = req.params;
    const { password } = req.body;

    if (!token) return res.status(400).json({ message: "Token is required" });

    token = token.trim();
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
      role: "user",
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    user.password = password; // hashed in pre-save hook
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Get Profile
// =======================
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -plainPassword -passwordResetToken -passwordResetExpires"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Profile
// =======================
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const fields = [
      "name",
      "prefix",
      "designation",
      "affiliation",
      "mobile",
      "mciRegistered",
      "mciNumber",
      "mciState",
      "department",
      "gender",
      "address",
      "country",
      "city",
      "state",
      "pincode",
      "mealPreference",
      "termAndCondition"
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    // Update profile picture
    if (req.file && req.file.location) {
      // Delete old image from S3
      if (user.profilePicture) {
        const oldKey = user.profilePicture.split(`${process.env.AWS_BUCKET_NAME}/`)[1];
        if (oldKey) {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: oldKey,
            })
          );
        }
      }
      user.profilePicture = req.file.location;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};