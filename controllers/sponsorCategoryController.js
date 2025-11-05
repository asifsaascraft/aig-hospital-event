import SponsorCategory from "../models/SponsorCategory.js";
import Event from "../models/Event.js";

// =======================
// Create Sponsor Category (EventAdmin Only)
// =======================
export const createSponsorCategory = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { categoryName, status } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Create new Sponsor Category
    const sponsorCategory = await SponsorCategory.create({
      eventId,
      categoryName,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Sponsor category created successfully",
      data: sponsorCategory,
    });
  } catch (error) {
    console.error("Create Sponsor Category error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Sponsor Categories by Event ID (Public/User)
// =======================
export const getSponsorCategoriesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const sponsorCategories = await SponsorCategory.find({ eventId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Sponsor categories fetched successfully",
      data: sponsorCategories,
    });
  } catch (error) {
    console.error("Get Sponsor Categories error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get Active Sponsor Categories by Event ID (Public/User)
// =======================
export const getActiveSponsorCategoriesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const activeCategories = await SponsorCategory.find({
      eventId,
      status: "Active",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Active sponsor categories fetched successfully",
      data: activeCategories,
    });
  } catch (error) {
    console.error("Get Active Sponsor Categories error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Sponsor Category (EventAdmin Only)
// =======================
export const updateSponsorCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryName, status } = req.body;

    const sponsorCategory = await SponsorCategory.findById(id);
    if (!sponsorCategory) {
      return res.status(404).json({ message: "Sponsor category not found" });
    }

    if (categoryName) sponsorCategory.categoryName = categoryName;
    if (status) sponsorCategory.status = status;

    await sponsorCategory.save();

    res.status(200).json({
      success: true,
      message: "Sponsor category updated successfully",
      data: sponsorCategory,
    });
  } catch (error) {
    console.error("Update Sponsor Category error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Sponsor Category (EventAdmin Only)
// =======================
export const deleteSponsorCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const sponsorCategory = await SponsorCategory.findById(id);
    if (!sponsorCategory) {
      return res.status(404).json({ message: "Sponsor category not found" });
    }

    await sponsorCategory.deleteOne();

    res.status(200).json({
      success: true,
      message: "Sponsor category deleted successfully",
    });
  } catch (error) {
    console.error("Delete Sponsor Category error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
