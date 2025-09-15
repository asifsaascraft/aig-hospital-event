import User from "../models/User.js";

//  Admin Signup (Postman only)
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // check if admin already exists
    const existing = await User.findOne({ email, role: "admin" });
    if (existing) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const admin = await User.create({
      name,
      email,
      password,
      role: "admin",
      status: "Active", // default active
    });

    res.status(201).json({ message: "Admin created successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  Admin Login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({ email, role: "admin" });
    if (!admin) return res.status(400).json({ message: "Invalid credentials" });

    // check status
    if (admin.status !== "Active") {
      return res.status(403).json({ message: "Admin account is inactive" });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = admin.getJwtToken();
    res.json({ message: "Admin login successful", token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
