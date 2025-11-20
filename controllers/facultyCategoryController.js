import FacultyCategory from "../models/FacultyCategory.js";
import Event from "../models/Event.js";

// =======================
// Create Faculty Category (EventAdmin Only)
// =======================
export const createFacultyCategory = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { facultyType, status } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Create new faculty category
    const facultyCategory = await FacultyCategory.create({
      eventId,
      facultyType,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Faculty Category created successfully",
      data: facultyCategory,
    });
  } catch (error) {
    console.error("Create Faculty Category error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Faculty Categories by Event ID (Public/User)
// =======================
export const getFacultyCategoriesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const categories = await FacultyCategory.find({ eventId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Faculty Categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    console.error("Get Faculty Categories error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get Active Faculty Categories by Event ID (Public/User)
// =======================
export const getActiveFacultyCategoriesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const activeCategories = await FacultyCategory.find({
      eventId,
      status: "Active",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Active Faculty Categories fetched successfully",
      data: activeCategories,
    });
  } catch (error) {
    console.error("Get Active Faculty Categories error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Faculty Category (EventAdmin Only)
// =======================
export const updateFacultyCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { facultyType, status } = req.body;

    const facultyCategory = await FacultyCategory.findById(id);
    if (!facultyCategory) {
      return res
        .status(404)
        .json({ message: "Faculty Category not found" });
    }

    if (facultyType) facultyCategory.facultyType = facultyType;
    if (status) facultyCategory.status = status;

    await facultyCategory.save();

    res.status(200).json({
      success: true,
      message: "Faculty Category updated successfully",
      data: facultyCategory,
    });
  } catch (error) {
    console.error("Update Faculty Category error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Faculty Category (EventAdmin Only)
// =======================
export const deleteFacultyCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const facultyCategory = await FacultyCategory.findById(id);
    if (!facultyCategory) {
      return res
        .status(404)
        .json({ message: "Faculty Category not found" });
    }

    await facultyCategory.deleteOne();

    res.status(200).json({
      success: true,
      message: "Faculty Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete Faculty Category error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
