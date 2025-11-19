// controllers/exhibitorAuthController.js
import Exhibitor from "../models/Exhibitor.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import sendEmailWithTemplate from "../utils/sendEmail.js";
import { generateTokens } from "../utils/generateTokens.js";

// =======================
// Exhibitor Login
// =======================
export const loginExhibitor = async (req, res) => {
  try {
    const { email, password } = req.body;

    const exhibitor = await Exhibitor.findOne({ email });
    if (!exhibitor) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, exhibitor.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const { accessToken, refreshToken } = generateTokens(
      exhibitor._id,
      "exhibitor"
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    res.json({
      success: true,
      message: "Login successful",
      accessToken,
      data: {
        id: exhibitor._id,
        exhibitorName: exhibitor.exhibitorName,
        email: exhibitor.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

// =======================
// Exhibitor Logout
// =======================
export const logoutExhibitor = async (req, res) => {
  try {
    res.clearCookie("refreshToken");
    res.json({ success: true, message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: "Logout failed", error: error.message });
  }
};

// =======================
// Refresh Access Token
// =======================
export const refreshAccessTokenExhibitor = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const exhibitor = await Exhibitor.findById(decoded.id);
    if (!exhibitor) {
      return res.status(401).json({ message: "Exhibitor not found" });
    }

    const { accessToken } = generateTokens(exhibitor._id, "exhibitor");

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    res.json({ success: true, accessToken });
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token", error: error.message });
  }
};

// =======================
// Forgot Password
// =======================
export const forgotPasswordExhibitor = async (req, res) => {
  try {
    const { email } = req.body;
    const exhibitor = await Exhibitor.findOne({ email });

    if (!exhibitor) {
      return res.status(404).json({ message: "Exhibitor not found" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const resetPasswordExpire = Date.now() + 24 * 60 * 60 * 1000; // 1 day

    exhibitor.resetPasswordToken = resetPasswordToken;
    exhibitor.resetPasswordExpire = resetPasswordExpire;
    await exhibitor.save({ validateBeforeSave: false });

    const frontendUrl = process.env.EXHIBITOR_FRONTEND_URL;
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    await sendEmailWithTemplate({
      to: exhibitor.email,
      name: exhibitor.exhibitorName,
      templateKey: "2518b.554b0da719bc314.k1.01bb6360-9c50-11f0-8ac3-ae9c7e0b6a9f.1998fb77496",
      mergeInfo: {
        name: exhibitor.exhibitorName,
        password_reset_link: resetUrl,
      },
    });

    res.json({ success: true, message: "Password reset email sent" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to send password reset email",
      error: error.message,
    });
  }
};

// =======================
// Reset Password
// =======================
export const resetPasswordExhibitor = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const exhibitor = await Exhibitor.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!exhibitor) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    exhibitor.password = await bcrypt.hash(newPassword, 10);
    exhibitor.plainPassword = newPassword;
    exhibitor.resetPasswordToken = undefined;
    exhibitor.resetPasswordExpire = undefined;

    await exhibitor.save();

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({
      message: "Password reset failed",
      error: error.message,
    });
  }
};

// =======================
// Get Exhibitor's Event (Deeply Populated)
// =======================
export const getMyEventExhibitor = async (req, res) => {
  try {
    const exhibitorId = req.exhibitor?._id || req.exhibitor?.id;

    if (!exhibitorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const exhibitor = await Exhibitor.findById(exhibitorId).populate({
      path: "eventId",
      populate: [
        { path: "organizer" },
        { path: "department" },
        { path: "venueName" },
      ],
      options: { sort: { createdAt: -1 } },
    });

    if (!exhibitor) {
      return res.status(404).json({
        success: false,
        message: "Exhibitor not found",
      });
    }

    if (!exhibitor.eventId) {
      return res.status(404).json({
        success: false,
        message: "No event associated with this exhibitor",
      });
    }

    res.json({
      success: true,
      message: "Event fetched successfully",
      event: exhibitor.eventId.toObject({ virtuals: true }),
      exhibitor: {
        exhibitorName: exhibitor.exhibitorName,
      },
    });
  } catch (error) {
    console.log("Get Exhibitor event error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch event",
      error: error.message,
    });
  }
};
