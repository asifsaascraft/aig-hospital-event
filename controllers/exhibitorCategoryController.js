import ExhibitorCategory from "../models/ExhibitorCategory.js";
import Event from "../models/Event.js";

// =======================
// Create Exhibitor Category (EventAdmin Only)
// =======================
export const createExhibitorCategory = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { categoryName, status } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Create new Exhibitor Category
    const exhibitorCategory = await ExhibitorCategory.create({
      eventId,
      categoryName,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Exhibitor category created successfully",
      data: exhibitorCategory,
    });
  } catch (error) {
    console.error("Create Exhibitor Category error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Exhibitor Categories by Event ID (Public/User)
// =======================
export const getExhibitorCategoriesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const exhibitorCategories = await ExhibitorCategory.find({ eventId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Exhibitor categories fetched successfully",
      data: exhibitorCategories,
    });
  } catch (error) {
    console.error("Get Exhibitor Categories error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get Active Exhibitor Categories by Event ID (Public/User)
// =======================
export const getActiveExhibitorCategoriesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const activeCategories = await ExhibitorCategory.find({
      eventId,
      status: "Active",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Active exhibitor categories fetched successfully",
      data: activeCategories,
    });
  } catch (error) {
    console.error("Get Active Exhibitor Categories error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Exhibitor Category (EventAdmin Only)
// =======================
export const updateExhibitorCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryName, status } = req.body;

    const exhibitorCategory = await ExhibitorCategory.findById(id);
    if (!exhibitorCategory) {
      return res.status(404).json({ message: "Exhibitor category not found" });
    }

    if (categoryName) exhibitorCategory.categoryName = categoryName;
    if (status) exhibitorCategory.status = status;

    await exhibitorCategory.save();

    res.status(200).json({
      success: true,
      message: "Exhibitor category updated successfully",
      data: exhibitorCategory,
    });
  } catch (error) {
    console.error("Update Exhibitor Category error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Exhibitor Category (EventAdmin Only)
// =======================
export const deleteExhibitorCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const exhibitorCategory = await ExhibitorCategory.findById(id);
    if (!exhibitorCategory) {
      return res.status(404).json({ message: "Exhibitor category not found" });
    }

    await exhibitorCategory.deleteOne();

    res.status(200).json({
      success: true,
      message: "Exhibitor category deleted successfully",
    });
  } catch (error) {
    console.error("Delete Exhibitor Category error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
