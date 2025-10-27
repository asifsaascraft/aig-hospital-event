import User from "../models/User.js";
import bcrypt from "bcryptjs";
import sendEmailWithTemplate from "../utils/sendEmail.js";

// 🔐 Generate strong random password (8–14 chars)
function generateStrongPassword() {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const symbols = "!@#$%^&*";
  const all = upper + lower + digits + symbols;
  const length = Math.floor(Math.random() * (14 - 8 + 1)) + 8;

  let password = "";
  password += upper[Math.floor(Math.random() * upper.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  return password.split("").sort(() => Math.random() - 0.5).join("");
}

// =======================
// Get all eventAdmins (admin only)
// =======================
export const getTeams = async (req, res) => {
  try {
    const teams = await User.find({ role: "eventAdmin" }).sort({ createdAt: -1 });
    res.json({ success: true, data: teams });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch teams",
      error: error.message,
    });
  }
};

// =======================
// Create eventAdmin (admin only)
// =======================
export const createTeam = async (req, res) => {
  try {
    const { name, email, mobile, companyName, status } = req.body;

    if (!name || !email || !mobile || !companyName) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }
    
    //  Check if mobile already exists
    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile already exists",
      });
    }

    // Generate password
    const plainPassword = generateStrongPassword();

    const eventAdmin = await User.create({
      name,
      email,
      mobile,
      companyName,
      password: plainPassword,
      plainPassword,
      role: "eventAdmin",
      status: status || "Active",
    });

    //  Send welcome email using ZeptoMail template
    try {
      await sendEmailWithTemplate({
        to: email,
        name,
        templateKey: "2518b.554b0da719bc314.k1.f14bdd00-b303-11f0-ac53-ae9c7e0b6a9f.19a24808ed0",
        mergeInfo: {
          name,
          companyName,
          email,
          mobile,
        },
      });
    } catch (emailError) {
      console.error("Team creation email failed:", emailError);
    }

    // Return plain password to admin
    res.status(201).json({
      success: true,
      data: eventAdmin,
      plainPassword, // admin can note/send to user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create team",
      error: error.message,
    });
  }
};

// =======================
// Update eventAdmin (admin only)
// =======================
export const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, mobile, companyName, status } = req.body;

    const updatedData = { name, email, mobile, companyName, status };

    const eventAdmin = await User.findByIdAndUpdate(
      id,
      updatedData,
      { new: true, runValidators: true }
    );

    if (!eventAdmin) {
      return res
        .status(404)
        .json({ success: false, message: "EventAdmin not found" });
    }

    res.json({ success: true, data: eventAdmin });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update team",
      error: error.message,
    });
  }
};

// =======================
// Delete eventAdmin (admin only)
// =======================
export const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;

    const eventAdmin = await User.findByIdAndDelete(id);

    if (!eventAdmin) {
      return res
        .status(404)
        .json({ success: false, message: "EventAdmin not found" });
    }

    res.json({ success: true, message: "EventAdmin deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete team",
      error: error.message,
    });
  }
};
