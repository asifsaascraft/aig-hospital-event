import Reviewer from "../models/Reviewer.js";
import AbstractCategory from "../models/AbstractCategory.js";
import bcrypt from "bcryptjs";
import { generateStrongPassword } from "../utils/generatePassword.js";

// =======================
// Get all reviewers by Event ID
// =======================
export const getReviewersByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const reviewers = await Reviewer.find({ eventId })
      .sort({ createdAt: -1 })
      .populate("eventId")
      .populate("abstractCategory");

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
// Get ACTIVE reviewers by Event ID
// =======================
export const getActiveReviewersByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const reviewers = await Reviewer.find({
      eventId,
      status: "Active",
    })
      .sort({ createdAt: -1 })
      .populate("eventId")
      .populate("abstractCategory");

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
// Create reviewer
// =======================
export const createReviewer = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { reviewerName, email, abstractCategory, status } = req.body;

    if (!eventId || !reviewerName || !email || !abstractCategory) {
      return res.status(400).json({
        success: false,
        message: "Required: eventId, reviewerName, email, abstractCategory",
      });
    }

    // Verify Abstract Category Exists & Is Active
    const categoryExists = await AbstractCategory.findOne({
      _id: abstractCategory,
      eventId,
      status: "Active",
    });

    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Selected abstract category not found or Inactive for this event",
      });
    }

    // Check if an active reviewer exists with same email
    const existingActiveReviewer = await Reviewer.findOne({
      email,
      status: "Active",
    });

    if (existingActiveReviewer) {
      return res.status(400).json({
        success: false,
        message: "Reviewer with this email already Active. Deactivate first.",
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
// Update reviewer
// =======================
export const updateReviewer = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = { ...req.body };

    // Check if making user Active OR updating email
    if ((updatedData.status === "Active") || updatedData.email) {
      const reviewerToBeUpdated = await Reviewer.findById(id);

      if (!reviewerToBeUpdated) {
        return res.status(404).json({
          success: false,
          message: "Reviewer not found",
        });
      }

      const newEmail = updatedData.email || reviewerToBeUpdated.email;

      // Check for another active reviewer with same email
      const existingActiveReviewer = await Reviewer.findOne({
        _id: { $ne: id }, // Exclude current reviewer
        email: newEmail,
        status: "Active",
      });

      if (existingActiveReviewer) {
        return res.status(400).json({
          success: false,
          message: "Another active reviewer already exists with this email",
        });
      }
    }

    // If updating abstractCategory, validate it
    if (updatedData.abstractCategory) {
      const validCategory = await AbstractCategory.findOne({
        _id: updatedData.abstractCategory,
        status: "Active",
      });

      if (!validCategory) {
        return res.status(400).json({
          success: false,
          message: "Selected abstract category does not exist or inactive",
        });
      }
    }

    const reviewer = await Reviewer.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    }).populate("abstractCategory");

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
// Delete reviewer
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
