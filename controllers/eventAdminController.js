import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Event from "../models/Event.js";
import EventAssign from "../models/EventAssign.js";
import { generateTokens } from "../utils/generateTokens.js";
import sendEmailWithTemplate from "../utils/sendEmail.js";

/* =======================
   EventAdmin Login
======================= */
export const loginEventAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const eventAdmin = await User.findOne({ email, role: "eventAdmin" });
    if (!eventAdmin) {
      return res.status(400).json({ message: "Email does not exist" });
    }

    if (eventAdmin.status !== "Active") {
      return res.status(403).json({ message: "EventAdmin account is inactive" });
    }

    const isMatch = await eventAdmin.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "You entered wrong password" });
    }

    const { accessToken, refreshToken } = generateTokens(
      eventAdmin._id,
      eventAdmin.role
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
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
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =======================
   Refresh Access Token
======================= */
export const refreshAccessTokenEventAdmin = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.role !== "eventAdmin") {
      return res.status(401).json({ message: "User not found" });
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

/* =======================
   Logout EventAdmin
======================= */
export const logoutEventAdmin = (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
};

/* =======================
   Forgot Password
======================= */
export const forgotPasswordEventAdmin = async (req, res) => {
  try {
    const { email } = req.body;

    const eventAdmin = await User.findOne({ email, role: "eventAdmin" });
    if (!eventAdmin) {
      return res.status(404).json({ message: "EventAdmin not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const resetToken = crypto
      .createHash("sha256")
      .update(token.trim())
      .digest("hex");

    eventAdmin.passwordResetToken = resetToken;
    eventAdmin.passwordResetExpires = Date.now() + 24 * 60 * 60 * 1000;
    await eventAdmin.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.EVENT_ADMIN_FRONTEND_URL}/reset-password/${token}`;

    await sendEmailWithTemplate({
      to: eventAdmin.email,
      name: eventAdmin.name,
      templateKey:
        "2518b.554b0da719bc314.k1.01bb6360-9c50-11f0-8ac3-ae9c7e0b6a9f.1998fb77496",
      mergeInfo: {
        name: eventAdmin.name,
        password_reset_link: resetUrl,
      },
    });

    res.json({ message: "Password reset link sent to your email address" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send reset email" });
  }
};

/* =======================
   Reset Password
======================= */
export const resetPasswordEventAdmin = async (req, res) => {
  try {
    let { token } = req.params;
    const { password } = req.body;

    token = token?.trim();
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const eventAdmin = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
      role: "eventAdmin",
    });

    if (!eventAdmin) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    eventAdmin.password = password;
    eventAdmin.passwordResetToken = null;
    eventAdmin.passwordResetExpires = null;
    await eventAdmin.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =======================
   Get Logged-in EventAdmin Events (NEW)
======================= */
export const myEvents = async (req, res) => {
  try {
    const eventAdminId = req.user._id;

    const assignment = await EventAssign.findOne({ eventAdminId })
      .populate({
        path: "eventAdminId",
        select: "name email companyName",
      })
      .populate({
        path: "assignedEvents.eventId",
        populate: [
          { path: "organizer" },
          { path: "department" },
          { path: "venueName" },
        ],
      });

    if (!assignment) {
      return res.json({
        success: true,
        events: [],
        user: {
          name: req.user.name,
        },
      });
    }

    const events = assignment.assignedEvents.map((item) => ({
      ...item.eventId.toObject({ virtuals: true }),
      permissions: {
        dashboard: item.dashboard,
        registration: item.registration,
        abstract: item.abstract,
        faculty: item.faculty,
        agenda: item.agenda,
        exhibitor: item.exhibitor,
        sponsor: item.sponsor,
        travel: item.travel,
        accomodation: item.accomodation,
        marketing: item.marketing,
        communication: item.communication,
        accounting: item.accounting,
        badging: item.badging,
        eventapp: item.eventapp,
        presentation: item.presentation,
      },
    }));

    res.json({
      success: true,
      events,
      user: {
        name: assignment.eventAdminId.name,
      },
    });
  } catch (error) {
    console.error("My events error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
      error: error.message,
    });
  }
};

