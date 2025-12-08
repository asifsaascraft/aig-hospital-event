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

    //  Check if mobile already exists
    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile already exists",
      });
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

// =======================
// Update User (Only eventAdmin)
// =======================
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const {
      name,
      email,
      prefix,
      affiliation,
      mobile,
      country,
    } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check Duplicate Email (Ignore current user)
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already registered" });
      }
    }

    // Check Duplicate Mobile (Ignore current user)
    if (mobile && mobile !== user.mobile) {
      const mobileExists = await User.findOne({ mobile });
      if (mobileExists) {
        return res.status(400).json({ message: "Mobile already exists" });
      }
    }

    // Fields allowed to update
    const fieldsToUpdate = {
      name,
      email,
      prefix,
      affiliation,
      mobile,
      country,
    };

    // Remove undefined values
    Object.keys(fieldsToUpdate).forEach(
      (key) => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const updatedUser = await User.findByIdAndUpdate(userId, fieldsToUpdate, {
      new: true,
      runValidators: true,
    }).select("-password -plainPassword -passwordResetToken -passwordResetExpires");

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// =======================
// Delete User (Only eventAdmin)
// =======================
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });

  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



// =======================
// Check If Email Exists (Only for role = "user") 
// =======================
export const checkUserEmailExists = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required in body",
      });
    }

    const user = await User.findOne({ email, role: "user" });

    if (user) {
      return res.status(200).json({
        success: true,
        exists: true,
        message: "Email already registered",
      });
    }

    return res.status(200).json({
      success: true,
      exists: false,
      message: "Email is not exist",
    });

  } catch (error) {
    console.error("Check email error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
