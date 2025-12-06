// controllers/sponsorAuthController.js
import Sponsor from "../models/Sponsor.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import sendEmailWithTemplate from "../utils/sendEmail.js";
import { generateTokens } from "../utils/generateTokens.js";

// =======================
// Sponsor Login
// =======================
export const loginSponsor = async (req, res) => {
  try {
    const { email, password } = req.body;

    const sponsor = await Sponsor.findOne({ email });
    if (!sponsor) {
      return res.status(400).json({ message: "Email does not exist" });
    }

    if (sponsor.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact event admin."
      });
    }

    const isMatch = await bcrypt.compare(password, sponsor.password);
    if (!isMatch) {
      return res.status(400).json({ message: "You Entered Wrong password" });
    }

    const { accessToken, refreshToken } = generateTokens(sponsor._id, "sponsor");

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      // secure must be false on localhost
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        id: sponsor._id,
        sponsorName: sponsor.sponsorName,
        email: sponsor.email,
      },
    });

  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};



// =======================
// Sponsor Logout
// =======================
export const logoutSponsor = async (req, res) => {
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
export const refreshAccessTokenSponsor = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const sponsor = await Sponsor.findById(decoded.id);
    if (!sponsor) {
      return res.status(401).json({ message: "Sponsor not found" });
    }

    const { accessToken } = generateTokens(sponsor._id, "sponsor");

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
export const forgotPasswordSponsor = async (req, res) => {
  try {
    const { email } = req.body;
    const sponsor = await Sponsor.findOne({ email });

    if (!sponsor) {
      return res.status(404).json({ message: "Sponsor not found" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetPasswordExpire = Date.now() + 24 * 60 * 60 * 1000; // 1 day expiry

    sponsor.resetPasswordToken = resetPasswordToken;
    sponsor.resetPasswordExpire = resetPasswordExpire;
    await sponsor.save({ validateBeforeSave: false });

    const frontendUrl = process.env.SPONSOR_FRONTEND_URL;
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    await sendEmailWithTemplate({
      to: sponsor.email,
      name: sponsor.sponsorName,
      templateKey: "2518b.554b0da719bc314.k1.01bb6360-9c50-11f0-8ac3-ae9c7e0b6a9f.1998fb77496",
      mergeInfo: {
        name: sponsor.sponsorName,
        password_reset_link: resetUrl,
      },
    });

    res.json({ success: true, message: "Password reset email sent" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send password reset email", error: error.message });
  }
};

// =======================
// Reset Password
// =======================
export const resetPasswordSponsor = async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const sponsor = await Sponsor.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!sponsor) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    sponsor.password = await bcrypt.hash(newPassword, 10);
    sponsor.plainPassword = newPassword;
    sponsor.resetPasswordToken = undefined;
    sponsor.resetPasswordExpire = undefined;
    await sponsor.save();

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Password reset failed", error: error.message });
  }
};

// =======================
// Get Sponsor's Event (Deeply Populated)
// =======================
export const getMyEvent = async (req, res) => {
  try {
    const sponsorId = req.sponsor?._id || req.sponsor?.id;

    if (!sponsorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    // Fetch sponsor and deeply populate related event details
    const sponsor = await Sponsor.findById(sponsorId).populate({
      path: "eventId",
      populate: [
        { path: "organizer" },
        { path: "department" },
        { path: "venueName" },
      ],
      options: { sort: { createdAt: -1 } },
    });

    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: "Sponsor not found",
      });
    }

    if (!sponsor.eventId) {
      return res.status(404).json({
        success: false,
        message: "No event associated with this sponsor",
      });
    }

    res.json({
      success: true,
      message: "Event fetched successfully",
      event: sponsor.eventId.toObject({ virtuals: true }),
      sponsor: {
        sponsorName: sponsor.sponsorName
      },
    });
  } catch (error) {
    console.error("Get sponsor event error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch event",
      error: error.message,
    });
  }
};

