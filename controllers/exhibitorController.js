import Exhibitor from "../models/Exhibitor.js";
import bcrypt from "bcryptjs";
import { generateStrongPassword } from "../utils/generatePassword.js";

// =======================
// Get all exhibitors by Event ID (Public/User)
// =======================
export const getExhibitorsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const exhibitors = await Exhibitor.find({ eventId })
      .sort({ createdAt: -1 })
      .populate("eventId exhibitorBooth");

    res.json({ success: true, data: exhibitors });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch exhibitors",
      error: error.message,
    });
  }
};

// =======================
// Get active exhibitors by Event ID (Public/User)
// =======================
export const getActiveExhibitorsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const exhibitors = await Exhibitor.find({
      eventId,
      status: "Active",
    })
      .sort({ createdAt: -1 })
      .populate("eventId exhibitorBooth");

    res.json({
      success: true,
      data: exhibitors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch active exhibitors",
      error: error.message,
    });
  }
};

// =======================
// Create exhibitor (eventAdmin only)
// =======================
export const createExhibitor = async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      exhibitorName,
      contactPersonName,
      email,
      mobile,
      additionalEmail,
      gstNumber,
      companyAddress,
      exhibitorBooth,
      exhibitorCategory,
      status,
    } = req.body;

    if (
      !eventId ||
      !exhibitorName ||
      !contactPersonName ||
      !email ||
      !mobile ||
      !companyAddress ||
      !exhibitorBooth ||
      !exhibitorCategory
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Required fields: eventId, exhibitorName, contactPersonName, email, mobile, companyAddress, exhibitorBooth, exhibitorCategory",
      });
    }

    // Check if an active exhibitor with this email already exists
    const existingActiveExhibitor = await Exhibitor.findOne({
      email,
      status: "Active",
    });

    if (existingActiveExhibitor) {
      return res.status(400).json({
        success: false,
        message:
          "An exhibitor with this email is already Active. Please deactivate the existing exhibitor before adding a new one.",
      });
    }

    // Generate password
    const plainPassword = generateStrongPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const exhibitor = await Exhibitor.create({
      eventId,
      exhibitorName,
      contactPersonName,
      email,
      mobile,
      additionalEmail,
      password: hashedPassword,
      plainPassword,
      gstNumber,
      companyAddress,
      exhibitorBooth,
      exhibitorCategory,
      status: status || "Active",
    });

    res.status(201).json({
      success: true,
      message: "Exhibitor created successfully",
      data: exhibitor,
      plainPassword,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create exhibitor",
      error: error.message,
    });
  }
};

// =======================
// Update exhibitor (eventAdmin only)
// =======================
export const updateExhibitor = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = { ...req.body };

    // Fetch current exhibitor
    const existingExhibitor = await Exhibitor.findById(id);
    if (!existingExhibitor) {
      return res.status(404).json({
        success: false,
        message: "Exhibitor not found",
      });
    }

    // Determine final email & status after update
    const finalEmail = updatedData.email || existingExhibitor.email;
    const finalStatus = updatedData.status || existingExhibitor.status;

    // Check if same email exhibitor already active
    if (finalStatus === "Active") {
      const existingActiveExhibitor = await Exhibitor.findOne({
        email: finalEmail,
        status: "Active",
        _id: { $ne: id },
      });

      if (existingActiveExhibitor) {
        return res.status(400).json({
          success: false,
          message:
            "An exhibitor with this email is already Active. Please deactivate the existing exhibitor before activating this one.",
        });
      }
    }

    const exhibitor = await Exhibitor.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!exhibitor) {
      return res.status(404).json({
        success: false,
        message: "Exhibitor not found",
      });
    }

    res.json({ success: true, data: exhibitor });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update exhibitor",
      error: error.message,
    });
  }
};


// =======================
// Delete exhibitor (eventAdmin only)
// =======================
export const deleteExhibitor = async (req, res) => {
  try {
    const { id } = req.params;

    const exhibitor = await Exhibitor.findByIdAndDelete(id);

    if (!exhibitor) {
      return res.status(404).json({
        success: false,
        message: "Exhibitor not found",
      });
    }

    res.json({ success: true, message: "Exhibitor deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete exhibitor",
      error: error.message,
    });
  }
};
