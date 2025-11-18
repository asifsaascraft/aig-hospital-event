import AbstractCategory from "../models/AbstractCategory.js";
import Event from "../models/Event.js";

// =======================
// Create Abstract Category (EventAdmin Only)
// =======================
export const createAbstractCategory = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { categoryName, status } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Create new abstract category
    const abstractCategory = await AbstractCategory.create({
      eventId,
      categoryName,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Abstract Category created successfully",
      data: abstractCategory,
    });
  } catch (error) {
    console.error("Create Abstract Category error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Abstract Categories by Event ID (Public/User)
// =======================
export const getAbstractCategoriesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const categories = await AbstractCategory.find({ eventId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Abstract Categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    console.error("Get Abstract Categories error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get Active Abstract Categories by Event ID (Public/User)
// =======================
export const getActiveAbstractCategoriesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const activeCategories = await AbstractCategory.find({
      eventId,
      status: "Active",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Active Abstract Categories fetched successfully",
      data: activeCategories,
    });
  } catch (error) {
    console.error("Get Active Abstract Categories error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Abstract Category (EventAdmin Only)
// =======================
export const updateAbstractCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryName, status } = req.body;

    const abstractCategory = await AbstractCategory.findById(id);
    if (!abstractCategory) {
      return res
        .status(404)
        .json({ message: "Abstract Category not found" });
    }

    if (categoryName) abstractCategory.categoryName = categoryName;
    if (status) abstractCategory.status = status;

    await abstractCategory.save();

    res.status(200).json({
      success: true,
      message: "Abstract Category updated successfully",
      data: abstractCategory,
    });
  } catch (error) {
    console.error("Update Abstract Category error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Abstract Category (EventAdmin Only)
// =======================
export const deleteAbstractCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const abstractCategory = await AbstractCategory.findById(id);
    if (!abstractCategory) {
      return res
        .status(404)
        .json({ message: "Abstract Category not found" });
    }

    await abstractCategory.deleteOne();

    res.status(200).json({
      success: true,
      message: "Abstract Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete Abstract Category error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
