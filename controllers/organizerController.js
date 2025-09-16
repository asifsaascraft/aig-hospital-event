import Organizer from "../models/Organizer.js";

// =======================
// Get all organizers (public)
// =======================
export const getOrganizers = async (req, res) => {
  try {
    const organizers = await Organizer.find().sort({ createdAt: -1 });
    res.json({ success: true, data: organizers });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch organizers",
      error: error.message,
    });
  }
};

// =======================
// Create organizer (admin only)
// =======================
export const createOrganizer = async (req, res) => {
  try {
    const { organizerName, contactPersonName, contactPersonMobile, contactPersonEmail, status } = req.body;

    if (!organizerName || !contactPersonName || !contactPersonMobile || !contactPersonEmail) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const organizer = await Organizer.create({
      organizerName,
      contactPersonName,
      contactPersonMobile,
      contactPersonEmail,
      status,
    });

    res.status(201).json({ success: true, data: organizer });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create organizer",
      error: error.message,
    });
  }
};

// =======================
// Update organizer (admin only)
// =======================
export const updateOrganizer = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizerName, contactPersonName, contactPersonMobile, contactPersonEmail, status } = req.body;

    const organizer = await Organizer.findByIdAndUpdate(
      id,
      { organizerName, contactPersonName, contactPersonMobile, contactPersonEmail, status },
      { new: true, runValidators: true }
    );

    if (!organizer) {
      return res.status(404).json({ success: false, message: "Organizer not found" });
    }

    res.json({ success: true, data: organizer });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update organizer",
      error: error.message,
    });
  }
};

// =======================
// Delete organizer (admin only)
// =======================
export const deleteOrganizer = async (req, res) => {
  try {
    const { id } = req.params;

    const organizer = await Organizer.findByIdAndDelete(id);

    if (!organizer) {
      return res.status(404).json({ success: false, message: "Organizer not found" });
    }

    res.json({ success: true, message: "Organizer deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete organizer",
      error: error.message,
    });
  }
};
