import crypto from "crypto";
import User from "../models/User.js";
import { generateTokens } from "../utils/generateTokens.js";
import sendEmail from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";

// =======================
// EventAdmin Login
// =======================
export const loginEventAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const eventAdmin = await User.findOne({ email, role: "eventAdmin" });
    if (!eventAdmin) return res.status(400).json({ message: "Email does not exist" });

    if (eventAdmin.status !== "Active") {
      return res.status(403).json({ message: "EventAdmin account is inactive" });
    }

    const isMatch = await eventAdmin.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "You Entered Wrong password" });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(eventAdmin._id, eventAdmin.role);

    // Store refresh token in cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none", // cross-domain
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successful",
      accessToken,
      user: {
        id: eventAdmin._id,
        name: eventAdmin.name,
        email: eventAdmin.email,
        role: eventAdmin.role,
        companyName: eventAdmin.companyName || null,
        assignedEvents: eventAdmin.assignedEvents, 
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Refresh Access Token
// =======================
export const refreshAccessTokenEventAdmin = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.role !== "eventAdmin") return res.status(401).json({ message: "User not found" });

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none", // cross-domain
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

// =======================
// Logout EventAdmin
// =======================
export const logoutEventAdmin = (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
};

// =======================
// Forgot Password
// =======================
export const forgotPasswordEventAdmin = async (req, res) => {
  try {
    const { email } = req.body;
    const eventAdmin = await User.findOne({ email, role: "eventAdmin" });
    if (!eventAdmin) return res.status(404).json({ message: "EventAdmin not found" });

    const token = crypto.randomBytes(32).toString("hex");
    const resetToken = crypto.createHash("sha256").update(token.trim()).digest("hex");

    eventAdmin.passwordResetToken = resetToken;
    eventAdmin.passwordResetExpires = Date.now() + 24 * 60 * 60 * 1000; // 1 day
    await eventAdmin.save();

    // Frontend URL for eventAdmin
    const frontendUrl = process.env.EVENT_ADMIN_FRONTEND_URL;
    const resetUrl = `${frontendUrl}/reset-password/${token}`;
    const message = `
      <h3>Password Reset Request</h3>
      <p>Click the button below to reset your password:</p>
      <a href="${resetUrl}" target="_blank">Reset Password</a>
    `;

    await sendEmail({
      email: eventAdmin.email,
      subject: "Password Reset",
      message,
    });

    res.json({ message: "Password reset link sent to your email address" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send reset email" });
  }
};

// =======================
// Reset Password
// =======================
export const resetPasswordEventAdmin = async (req, res) => {
  try {
    let { token } = req.params;
    const { password } = req.body;

    if (!token) return res.status(400).json({ message: "Token is required" });

     // Trim token to remove extra spaces/newlines
    token = token.trim();

    // Hash token to match DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const eventAdmin = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
      role: "eventAdmin",
    });

    if (!eventAdmin) {
        return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Update password
    eventAdmin.password = password;  // will be hashed in pre-save hook
    eventAdmin.passwordResetToken = null;
    eventAdmin.passwordResetExpires = null;
    await eventAdmin.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: error.message });
  }
};
