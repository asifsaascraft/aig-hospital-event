import crypto from "crypto";
import User from "../models/User.js";
import { generateTokens } from "../utils/generateTokens.js";
import sendEmailWithTemplate from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";

// =======================
// Support Admin Signup (Postman only)
// =======================
export const registerSupportAdmin = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    // Check existing support admin
    const existing = await User.findOne({
      email,
      role: "supportAdmin",
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "Support Admin already exists with this email" });
    }

    const supportAdmin = await User.create({
      name,
      email,
      mobile,
      password,
      role: "supportAdmin",
      status: "Active",
    });

    res.status(201).json({
      message: "Support Admin created successfully",
      data: {
        id: supportAdmin._id,
        name: supportAdmin.name,
        email: supportAdmin.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Support Admin Login
// =======================
export const loginSupportAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const supportAdmin = await User.findOne({
      email,
      role: "supportAdmin",
    });

    if (!supportAdmin) {
      return res.status(400).json({
        message: "Email does not exist",
      });
    }

    if (supportAdmin.status !== "Active") {
      return res.status(403).json({
        message: "Support Admin account is inactive",
      });
    }

    const isMatch = await supportAdmin.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({
        message: "You entered wrong password",
      });
    }

    const { accessToken, refreshToken } = generateTokens(
      supportAdmin._id,
      supportAdmin.role
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Support Admin login successful",
      accessToken,
      user: {
        id: supportAdmin._id,
        name: supportAdmin.name,
        email: supportAdmin.email,
        role: supportAdmin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Refresh Access Token
// =======================
export const refreshSupportAdminAccessToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        message: "No refresh token",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);

    if (!user || user.role !== "supportAdmin") {
      return res.status(401).json({
        message: "Support Admin not found",
      });
    }

    const { accessToken, refreshToken } = generateTokens(
      user._id,
      user.role
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({
      message: "Invalid refresh token",
    });
  }
};

// =======================
// Logout Support Admin
// =======================
export const logoutSupportAdmin = (req, res) => {
  res.clearCookie("refreshToken");

  res.json({
    message: "Logged out successfully",
  });
};

