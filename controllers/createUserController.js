import User from "../models/User.js";
import sendEmailWithTemplate from "../utils/sendEmail.js";

// =======================
// Only EventAdmin: Create User (signup)
// =======================
export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      prefix,
      affiliation,
      mobile,
      country,
    } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create user (role = 'user')
    const user = await User.create({
      name,
      email,
      password,
      prefix,
      affiliation,
      mobile,
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
// Get All Users (Only role = "user")
// =======================
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" })
      .select("-password -plainPassword -passwordResetToken -passwordResetExpires") // hide sensitive fields
      .sort({ createdAt: -1 }); // newest first

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
