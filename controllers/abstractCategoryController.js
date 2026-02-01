import AbstractCategory from "../models/AbstractCategory.js";
import Event from "../models/Event.js";

// =======================
// Create Abstract Category (EventAdmin Only)
// =======================
export const createAbstractCategory = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { categoryLabel, categoryOptions, status } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Validate inputs
    if (!categoryLabel) {
      return res.status(400).json({ message: "Category Label is required" });
    }

    if (!Array.isArray(categoryOptions) || categoryOptions.length === 0) {
      return res
        .status(400)
        .json({ message: "Category Options must be a non-empty array" });
    }

    const abstractCategory = await AbstractCategory.create({
      eventId,
      categoryLabel,
      categoryOptions,
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
    const { categoryLabel, categoryOptions, status } = req.body;

    const abstractCategory = await AbstractCategory.findById(id);
    if (!abstractCategory) {
      return res
        .status(404)
        .json({ message: "Abstract Category not found" });
    }

    if (categoryLabel) abstractCategory.categoryLabel = categoryLabel;

    if (categoryOptions) {
      if (!Array.isArray(categoryOptions) || categoryOptions.length === 0) {
        return res
          .status(400)
          .json({ message: "Category Options must be a non-empty array" });
      }
      abstractCategory.categoryOptions = categoryOptions;
    }

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
