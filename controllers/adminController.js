// import crypto from "crypto";
// import User from "../models/User.js";
// import { generateTokens } from "../utils/generateTokens.js";
// import sendEmail from "../utils/sendEmail.js";
// import jwt from "jsonwebtoken"; // fixed import for refreshAccessToken

// // =======================
// // Admin Signup (Postman only)
// // =======================
// export const registerAdmin = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     // only one admin allowed
//     const existing = await User.findOne({ role: "admin" });
//     if (existing) {
//       return res.status(400).json({ message: "Admin already exists" });
//     }

//     const admin = await User.create({
//       name,
//       email,
//       password,
//       role: "admin",
//       status: "Active", // default
//     });

//     res.status(201).json({ message: "Admin created successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // =======================
// // Admin Login
// // =======================
// export const loginAdmin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const admin = await User.findOne({ email, role: "admin" });
//     if (!admin) return res.status(400).json({ message: "Invalid credentials" });

//     if (admin.status !== "Active") {
//       return res.status(403).json({ message: "Admin account is inactive" });
//     }

//     const isMatch = await admin.matchPassword(password);
//     if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

//     // Generate tokens
//     const { accessToken, refreshToken } = generateTokens(admin._id, admin.role);

//     // Store refresh token in cookie
//     res.cookie("refreshToken", refreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//       maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//     });

//     res.json({
//       message: "Admin login successful",
//       accessToken,
//       user: {
//         id: admin._id,
//         name: admin.name,
//         email: admin.email,
//         role: admin.role,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // =======================
// // Refresh Access Token
// // =======================
// export const refreshAccessToken = async (req, res) => {
//   try {
//     const token = req.cookies.refreshToken;
//     if (!token) return res.status(401).json({ message: "No refresh token" });

//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

//     const user = await User.findById(decoded.id);
//     if (!user) return res.status(401).json({ message: "User not found" });

//     const { accessToken, refreshToken } = generateTokens(user._id, user.role);

//     // Update cookie with new refresh token
//     res.cookie("refreshToken", refreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });

//     res.json({ accessToken });
//   } catch (error) {
//     res.status(401).json({ message: "Invalid refresh token" });
//   }
// };

// // =======================
// // Logout Admin
// // =======================
// export const logoutAdmin = (req, res) => {
//   res.clearCookie("refreshToken");
//   res.json({ message: "Logged out successfully" });
// };

// // =======================
// // Forgot Password
// // =======================
// export const forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const admin = await User.findOne({ email, role: "admin" });
//     if (!admin) return res.status(404).json({ message: "Admin not found" });

//     // Generate token
//     const token = crypto.randomBytes(32).toString("hex");
//     const resetToken = crypto.createHash("sha256").update(token).digest("hex");

//     admin.passwordResetToken = resetToken;
//     admin.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 min
//     await admin.save();

//     // Send token as query param
//     const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
//     const message = `
//       <h3>Password Reset Request</h3>
//       <p>Click the link below to reset your password:</p>
//       <a href="${resetUrl}" target="_blank">${resetUrl}</a>
//     `;

//     await sendEmail({
//       email: admin.email,
//       subject: "Password Reset",
//       message,
//     });

//     res.json({ message: "Password reset link sent to email" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // =======================
// // Reset Password
// // =======================
// export const resetPassword = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const { password } = req.body;

//     const admin = await User.findOne({
//       passwordResetToken: token,
//       passwordResetExpires: { $gt: Date.now() },
//     });

//     if (!admin) return res.status(400).json({ message: "Invalid or expired token" });

//     admin.password = password; // will be hashed by pre-save hook
//     admin.passwordResetToken = null;
//     admin.passwordResetExpires = null;

//     await admin.save();

//     res.json({ message: "Password reset successful" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };



//New Code

import crypto from "crypto";
import User from "../models/User.js";
import { generateTokens } from "../utils/generateTokens.js";
import sendEmail from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";

// =======================
// Admin Signup (Postman only)
// =======================
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // only one admin allowed
    const existing = await User.findOne({ role: "admin" });
    if (existing) {
      return res.status(400).json({ message: "This Admin account is already exists" });
    }

    const admin = await User.create({
      name,
      email,
      password,
      role: "admin",
      status: "Active", // default
    });

    res.status(201).json({ message: "New Admin account created successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Admin Login
// =======================
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({ email, role: "admin" });
    if (!admin) return res.status(400).json({ message: "No Admin account found with this email" });

    if (admin.status !== "Active") {
      return res.status(403).json({ message: "This Admin account is inactive" });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "You entered wrong password for this account" });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(admin._id, admin.role);

    // Store tokens in HttpOnly cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: "Admin account login successful",
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Refresh Access Token
// =======================
export const refreshAccessToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    // Update cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Access token refreshed" });
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

// =======================
// Logout Admin
// =======================
export const logoutAdmin = (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
};

// =======================
// Forgot Password
// =======================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await User.findOne({ email, role: "admin" });
    if (!admin) return res.status(404).json({ message: "Admin account not found with this email" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    admin.passwordResetToken = resetToken;
    admin.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 min
    await admin.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `
      <h3>Password Reset Request</h3>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
    `;

    // respond immediately
    res.json({ message: "Password reset link sent (if email exists)" });

    // send email in background (non-blocking)
    sendEmail({
      email: admin.email,
      subject: "Password Reset",
      message,
    }).catch(err => console.error("Email error:", err));

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Reset Password
// =======================
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const admin = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!admin) return res.status(400).json({ message: "Invalid or expired token" });

    admin.password = password; // will be hashed by pre-save hook
    admin.passwordResetToken = null;
    admin.passwordResetExpires = null;

    await admin.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
