import Announcement from "../models/Announcement.js";

// =======================
// Get all announcements (any logged-in role)
// =======================
export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch announcements",
      error: error.message,
    });
  }
};

// =======================
// Create new announcement (admin only)
// =======================
export const createAnnouncement = async (req, res) => {
  try {
    const { heading, description, postedBy } = req.body;

    if (!heading || !description || !postedBy) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const announcement = await Announcement.create({
      heading,
      description,
      postedBy,
    });

    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create announcement",
      error: error.message,
    });
  }
};

// =======================
// Update announcement (admin only)
// =======================
export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { heading, description, postedBy } = req.body;

    const announcement = await Announcement.findByIdAndUpdate(
      id,
      { heading, description, postedBy },
      { new: true, runValidators: true }
    );

    if (!announcement) {
      return res
        .status(404)
        .json({ success: false, message: "Announcement not found" });
    }

    res.json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update announcement",
      error: error.message,
    });
  }
};

// =======================
// Delete announcement (admin only)
// =======================
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findByIdAndDelete(id);

    if (!announcement) {
      return res
        .status(404)
        .json({ success: false, message: "Announcement not found" });
    }

    res.json({ success: true, message: "Announcement deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete announcement",
      error: error.message,
    });
  }
};
