import WorkshopCategory from "../models/WorkshopCategory.js";
import Event from "../models/Event.js";

// =======================
// Create Workshop Category (EventAdmin Only)
// =======================
export const createWorkshopCategory = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { WorkshopCategoryName, status } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Create new category
    const category = await WorkshopCategory.create({
      eventId,
      WorkshopCategoryName,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Workshop Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Create Workshop Category error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Workshop Categories by Event ID (Public/User)
// =======================
export const getWorkshopCategoriesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const categories = await WorkshopCategory.find({ eventId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Workshop Categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    console.error("Get Workshop Categories error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get Active Workshop Categories by Event ID (Public/User)
// =======================
export const getActiveWorkshopCategoriesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const categories = await WorkshopCategory.find({
      eventId,
      status: "Active",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Active Workshop Categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    console.error("Get Active Workshop Categories error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


// =======================
// Update Workshop Category (EventAdmin Only)
// =======================
export const updateWorkshopCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { WorkshopCategoryName, status } = req.body;

    const category = await WorkshopCategory.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Workshop Category not found" });
    }

    if (WorkshopCategoryName) category.WorkshopCategoryName = WorkshopCategoryName;
    if (status) category.status = status;

    await category.save();

    res.status(200).json({
      success: true,
      message: "Workshop Category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Update Workshop Category error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Workshop Category (EventAdmin Only)
// =======================
export const deleteWorkshopCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await WorkshopCategory.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Workshop Category not found" });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: "Workshop Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete Workshop Category error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
