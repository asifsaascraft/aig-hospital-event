// controllers/reviewerAuthController.js
import Reviewer from "../models/Reviewer.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import sendEmailWithTemplate from "../utils/sendEmail.js";
import { generateTokens } from "../utils/generateTokens.js";

/* =======================
   Reviewer Login
======================= */
export const loginReviewer = async (req, res) => {
  try {
    const { email, password } = req.body;

    const reviewer = await Reviewer.findOne({ email });
    if (!reviewer) {
      return res.status(400).json({ message: "Email does not exist" });
    }

    if (reviewer.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact event admin.",
      });
    }

    const isMatch = await bcrypt.compare(password, reviewer.password);
    if (!isMatch) {
      return res.status(400).json({ message: "You entered wrong password" });
    }

    const { accessToken, refreshToken } = generateTokens(
      reviewer._id,
      "reviewer"
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        id: reviewer._id,
        reviewerName: reviewer.reviewerName,
        email: reviewer.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};

/* =======================
   Reviewer Logout
======================= */
export const logoutReviewer = async (req, res) => {
  try {
    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");
    res.json({ success: true, message: "Logout successful" });
  } catch (error) {
    res.status(500).json({
      message: "Logout failed",
      error: error.message,
    });
  }
};

/* =======================
   Refresh Access Token
======================= */
export const refreshAccessTokenReviewer = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const reviewer = await Reviewer.findById(decoded.id);
    if (!reviewer) {
      return res.status(401).json({ message: "Reviewer not found" });
    }

    const { accessToken } = generateTokens(reviewer._id, "reviewer");

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.json({ success: true, accessToken });
  } catch (error) {
    res.status(401).json({
      message: "Invalid refresh token",
      error: error.message,
    });
  }
};

/* =======================
   Forgot Password
======================= */
export const forgotPasswordReviewer = async (req, res) => {
  try {
    const { email } = req.body;

    const reviewer = await Reviewer.findOne({ email });
    if (!reviewer) {
      return res.status(404).json({ message: "Reviewer not found" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    reviewer.resetPasswordToken = resetPasswordToken;
    reviewer.resetPasswordExpire = Date.now() + 24 * 60 * 60 * 1000;

    await reviewer.save({ validateBeforeSave: false });

    const frontendUrl = process.env.REVIEWER_FRONTEND_URL;
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    await sendEmailWithTemplate({
      to: reviewer.email,
      name: reviewer.reviewerName,
      templateKey: "2518b.554b0da719bc314.k1.01bb6360-9c50-11f0-8ac3-ae9c7e0b6a9f.1998fb77496",
      mergeInfo: {
        name: reviewer.reviewerName,
        password_reset_link: resetUrl,
      },
    });

    res.json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to send reset email",
      error: error.message,
    });
  }
};

/* =======================
   Reset Password
======================= */
export const resetPasswordReviewer = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const reviewer = await Reviewer.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!reviewer) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    reviewer.password = await bcrypt.hash(newPassword, 10);
    reviewer.plainPassword = newPassword;
    reviewer.resetPasswordToken = undefined;
    reviewer.resetPasswordExpire = undefined;

    await reviewer.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    res.status(500).json({
      message: "Password reset failed",
      error: error.message,
    });
  }
};

/* =======================
   Get My Event & Categories
======================= */
export const getMyEventReviewer = async (req, res) => {
  try {
    const reviewerId = req.reviewer?._id;

    const reviewer = await Reviewer.findById(reviewerId)
      .populate("eventId")
      .populate("categories.categoryId");

    if (!reviewer) {
      return res.status(404).json({ message: "Reviewer not found" });
    }

    res.json({
      success: true,
      event: reviewer.eventId,
      categories: reviewer.categories,
      reviewer: {
        reviewerName: reviewer.reviewerName,
        email: reviewer.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch reviewer event",
      error: error.message,
    });
  }
};
