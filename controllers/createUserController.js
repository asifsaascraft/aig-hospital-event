import User from "../models/User.js";
import sendEmailWithTemplate from "../utils/sendEmail.js";
import { generateStrongPassword } from "../utils/generatePassword.js";


// =======================
// (EventAdmin Authorize): Create User (signup)
// =======================
export const registerUserByEventAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      termAndCondition,
      prefix,
      designation,
      affiliation,
      mobile,
      mciRegistered,
      mciNumber,
      mciState,
      department,
      gender,
      address,
      state,
      city,
      pincode,
      country,
    } = req.body;

    // =======================
    // Validation
    // =======================
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, Email and Password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Check mobile
    if (mobile) {
      const existingMobile = await User.findOne({ mobile });
      if (existingMobile) {
        return res.status(400).json({
          success: false,
          message: "Mobile already exists",
        });
      }
    }

    let createdByValue = "self";
    let createdById = null;

    // EVENT ADMIN
    if (req.user?.role === "eventAdmin") {
      createdByValue = "eventAdmin";
      createdById = req.user._id;
    }

    // =======================
    // Create User
    // =======================
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      termAndCondition,
      prefix,
      designation,
      affiliation,
      mobile,
      mciRegistered,
      mciNumber,
      mciState,
      department,
      gender,
      address,
      state,
      city,
      pincode,
      country,
      role: "user",
      status: "Active",
      createdBy: createdByValue,
      createdById: createdById,
    });

    // =======================
    // Send Email
    // =======================
    try {
      await sendEmailWithTemplate({
        to: user.email,
        name: user.name,
        templateKey:
          "2518b.554b0da719bc314.k1.4b76afb1-a361-11f0-bc12-525400c92439.199be08ce2b",
        mergeInfo: {
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          affiliation: user.affiliation || "N/A",
        },
      });
    } catch (err) {
      console.error("Email error:", err);
    }

    res.status(201).json({
      success: true,
      message: "User created successfully by EventAdmin",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// Admin: Get All Users
// =======================
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      role: "user",
    })
      .select(
        "-password -plainPassword -passwordResetToken -passwordResetExpires"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =======================
// EventAdmin: Get ONLY EventAdmin Created Users
// =======================
export const getAllUsersCreatedByEventAdmin = async (req, res) => {
  try {
    const users = await User.find({
      role: "user",
      createdBy: "eventAdmin",
      createdById: req.user._id,
    })
      .select(
        "-password -plainPassword -passwordResetToken -passwordResetExpires",
      )
      .sort({ createdAt: -1 });

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
// Sponsor: Get ONLY Sponsor Created Users
// =======================
export const getAllUsersCreatedBySponsor = async (req, res) => {
  try {
    const users = await User.find({
      role: "user",
      createdBy: "sponsor",
      createdById: req.sponsor._id,
    })
      .select(
        "-password -plainPassword -passwordResetToken -passwordResetExpires",
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get sponsor users error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// =======================
// only EventAdmin: Update User
// =======================
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const updateFields = { ...req.body };

    // =======================
    // Check if user exists
    // =======================
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.createdById?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own created users",
      });
    }

    // =======================
    //  BLOCK EMAIL UPDATE
    // =======================
    if (updateFields.email) {
      return res.status(400).json({
        success: false,
        message: "Email cannot be updated",
      });
    }

    // =======================
    // Mobile duplicate check
    // =======================
    if (updateFields.mobile && updateFields.mobile !== user.mobile) {
      const mobileExists = await User.findOne({
        mobile: updateFields.mobile,
      });

      if (mobileExists) {
        return res.status(400).json({
          success: false,
          message: "Mobile already exists",
        });
      }
    }

    // =======================
    // Remove restricted fields
    // =======================
    delete updateFields.password;
    delete updateFields.plainPassword;
    delete updateFields.passwordResetToken;
    delete updateFields.passwordResetExpires;
    delete updateFields.role;
    delete updateFields.status;

    // =======================
    // Update user
    // =======================
    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
      runValidators: true,
    }).select(
      "-password -plainPassword -passwordResetToken -passwordResetExpires",
    );

    // =======================
    // Response
    // =======================
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
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

    if (user.createdById?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own created users",
      });
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
// (EventAdmin Authorize): Check Email Exists (Role: user)
// =======================
export const checkUserEmailExists = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();


    const user = await User.findOne({
      email: normalizedEmail,
      role: "user"
    }).select(
      "-password -plainPassword -passwordResetToken -passwordResetExpires -otp -otpExpires",
    );

    if (user) {
      return res.status(200).json({
        success: true,
        exists: true,
        message: "User found with this email, fill the registration form",
        user,
      });
    }

    return res.status(200).json({
      success: true,
      exists: false,
      message: "Email does not exist",
      user: null,
    });
  } catch (error) {
    console.error("Check email error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =======================
// (Sponsor Only): Create User (signup)
// =======================
export const registerUserBySponsor = async (req, res) => {
  try {
    const {
      name,
      email,
      prefix,
      designation,
      affiliation,
      mobile,
      mciRegistered,
      mciNumber,
      mciState,
      department,
      gender,
      address,
      state,
      city,
      pincode,
      country,
    } = req.body;

    // =======================
    // Validation
    // =======================
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    // Check email
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Check mobile
    if (mobile) {
      const existingMobile = await User.findOne({ mobile });
      if (existingMobile) {
        return res.status(400).json({
          success: false,
          message: "Mobile already exists",
        });
      }
    }

    // Generate password
    const plainPassword = generateStrongPassword();

    if (!req.sponsor) {
      return res.status(401).json({
        success: false,
        message: "Sponsor not authorized",
      });
    }

    // created By SPONSOR
    let createdByValue = "sponsor";
    let createdById = req.sponsor._id;


    // =======================
    // Create User
    // =======================
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: plainPassword,
      termAndCondition: true,
      prefix,
      designation,
      affiliation,
      mobile,
      mciRegistered,
      mciNumber,
      mciState,
      department,
      gender,
      address,
      state,
      city,
      pincode,
      country,
      role: "user",
      status: "Active",
      createdBy: createdByValue,
      createdById: createdById,
    });

    // =======================
    // Send Email
    // =======================
    try {
      await sendEmailWithTemplate({
        to: user.email,
        name: user.name,
        templateKey:
          "2518b.554b0da719bc314.k1.4b76afb1-a361-11f0-bc12-525400c92439.199be08ce2b",
        mergeInfo: {
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          affiliation: user.affiliation || "N/A",
        },
      });
    } catch (err) {
      console.error("Email error:", err);
    }

    res.status(201).json({
      success: true,
      message: "User created successfully by Sponsor",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};