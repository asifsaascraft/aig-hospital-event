import Reviewer from "../models/Reviewer.js";
import AbstractCategory from "../models/AbstractCategory.js";
import AbstractSetting from "../models/AbstractSetting.js";
import bcrypt from "bcryptjs";
import { generateStrongPassword } from "../utils/generatePassword.js";
import sendEmailWithTemplate from "../utils/sendEmail.js";

/* =======================
   Get all reviewers by Event ID
======================= */
export const getReviewersByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const reviewers = await Reviewer.find({ eventId })
      .sort({ createdAt: -1 })
      .populate("eventId")
      .populate("categories.categoryId");

    res.json({ success: true, data: reviewers });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviewers",
      error: error.message,
    });
  }
};

/* =======================
   Get ACTIVE reviewers by Event ID
======================= */
export const getActiveReviewersByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const reviewers = await Reviewer.find({
      eventId,
      status: "Active",
    })
      .sort({ createdAt: -1 })
      .populate("eventId")
      .populate("categories.categoryId");

    res.json({ success: true, data: reviewers });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch active reviewers",
      error: error.message,
    });
  }
};

/* =======================
   Create Reviewer
======================= */
export const createReviewer = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { reviewerName, email, categories, status } = req.body;

    if (
      !reviewerName ||
      !email ||
      !Array.isArray(categories) ||
      categories.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "reviewerName, email and categories are required",
      });
    }

    // STEP 1: Abstract Settings
    const abstractSetting = await AbstractSetting.findOne({ eventId });
    if (!abstractSetting) {
      return res.status(400).json({
        success: false,
        message: "Abstract settings not configured for this event",
      });
    }

    const limit = abstractSetting.numberOfAbstractSubmission;

    // STEP 2: Validate each category + limit
    for (const cat of categories) {
      const validCategory = await AbstractCategory.findOne({
        _id: cat.categoryId,
        eventId,
        status: "Active",
      });

      if (!validCategory) {
        return res.status(400).json({
          success: false,
          message: "One or more selected categories are invalid or inactive",
        });
      }

      const activeCount = await Reviewer.countDocuments({
        eventId,
        status: "Active",
        "categories.categoryId": cat.categoryId,
      });

      if ((status === "Active" || !status) && activeCount >= limit) {
        return res.status(400).json({
          success: false,
          message: `Reviewer limit reached for category ${validCategory.categoryLabel}`,
        });
      }
    }

    // STEP 3: Unique active email
    const existingReviewer = await Reviewer.findOne({
      email,
      status: "Active",
    });
    if (existingReviewer) {
      return res.status(400).json({
        success: false,
        message: "Active reviewer already exists with this email",
      });
    }

    // STEP 4: Password
    const plainPassword = generateStrongPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const reviewer = await Reviewer.create({
      eventId,
      reviewerName,
      email,
      password: hashedPassword,
      plainPassword, // optional – remove if not required
      categories,
      status: status || "Active",
    });

    //  Send welcome email using ZeptoMail template
    try {
      await sendEmailWithTemplate({
        to: email,
        reviewerName,
        templateKey:
          "2518b.554b0da719bc314.k1.98f60d71-0028-11f1-8765-cabf48e1bf81.19c1e1157c4",
        mergeInfo: {
          reviewerName,
          email,
          plainPassword,
        },
      });
    } catch (emailError) {
      console.error("Team creation email failed:", emailError);
    }

    res.status(201).json({
      success: true,
      message: "Reviewer created successfully",
      data: reviewer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create reviewer",
      error: error.message,
    });
  }
};

/* =======================
   Update Reviewer
======================= */
export const updateReviewer = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = { ...req.body };

    const reviewer = await Reviewer.findById(id);
    if (!reviewer) {
      return res
        .status(404)
        .json({ success: false, message: "Reviewer not found" });
    }

    // Validate categories if updated
    if (updatedData.categories) {
      const abstractSetting = await AbstractSetting.findOne({
        eventId: reviewer.eventId,
      });
      const limit = abstractSetting.numberOfAbstractSubmission;

      for (const cat of updatedData.categories) {
        const activeCount = await Reviewer.countDocuments({
          _id: { $ne: id },
          eventId: reviewer.eventId,
          status: "Active",
          "categories.categoryId": cat.categoryId,
        });

        if (activeCount >= limit) {
          return res.status(400).json({
            success: false,
            message: "Reviewer limit exceeded for selected category",
          });
        }
      }
    }

    const updatedReviewer = await Reviewer.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    }).populate("categories.categoryId");

    res.json({ success: true, data: updatedReviewer });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update reviewer",
      error: error.message,
    });
  }
};

/* =======================
   Delete Reviewer
======================= */
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
