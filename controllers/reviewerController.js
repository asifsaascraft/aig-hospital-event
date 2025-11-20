import Reviewer from "../models/Reviewer.js";
import bcrypt from "bcryptjs";
import { generateStrongPassword } from "../utils/generatePassword.js";

// =======================
// Get all reviewers by Event ID (Public/User)
// =======================
export const getReviewersByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const reviewers = await Reviewer.find({ eventId })
      .sort({ createdAt: -1 })
      .populate("eventId");

    res.json({ success: true, data: reviewers });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviewers",
      error: error.message,
    });
  }
};

// =======================
// Get active reviewers by Event ID (Public/User)
// =======================
export const getActiveReviewersByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const reviewers = await Reviewer.find({
      eventId,
      status: "Active",
    })
      .sort({ createdAt: -1 })
      .populate("eventId");

    res.json({
      success: true,
      data: reviewers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch active reviewers",
      error: error.message,
    });
  }
};

// =======================
// Create reviewer (eventAdmin only)
// =======================
export const createReviewer = async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      reviewerName,
      email,
      abstractCategory,
      status,
    } = req.body;

    if (!eventId || !reviewerName || !email || !abstractCategory) {
      return res.status(400).json({
        success: false,
        message:
          "Required fields: eventId, reviewerName, email, abstractCategory",
      });
    }

    // Check if an active reviewer with this email already exists
    const existingActiveReviewer = await Reviewer.findOne({
      email,
      status: "Active",
    });

    if (existingActiveReviewer) {
      return res.status(400).json({
        success: false,
        message:
          "A reviewer with this email is already Active. Please deactivate the existing reviewer before adding a new one.",
      });
    }

    // Generate password
    const plainPassword = generateStrongPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const reviewer = await Reviewer.create({
      eventId,
      reviewerName,
      email,
      password: hashedPassword,
      plainPassword,
      abstractCategory,
      status: status || "Active",
    });

    res.status(201).json({
      success: true,
      message: "Reviewer created successfully",
      data: reviewer,
      plainPassword,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create reviewer",
      error: error.message,
    });
  }
};

// =======================
// Update reviewer (eventAdmin only)
// =======================
export const updateReviewer = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = { ...req.body };

    const reviewer = await Reviewer.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!reviewer) {
      return res.status(404).json({
        success: false,
        message: "Reviewer not found",
      });
    }

    res.json({ success: true, data: reviewer });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update reviewer",
      error: error.message,
    });
  }
};

// =======================
// Delete reviewer (eventAdmin only)
// =======================
export const deleteReviewer = async (req, res) => {
  try {
    const { id } = req.params;

    const reviewer = await Reviewer.findByIdAndDelete(id);

    if (!reviewer) {
      return res.status(404).json({
        success: false,
        message: "Reviewer not found",
      });
    }

    res.json({ success: true, message: "Reviewer deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete reviewer",
      error: error.message,
    });
  }
};
