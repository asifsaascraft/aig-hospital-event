// controllers/roomCategoryController.js
import RoomCategory from "../models/RoomCategory.js";

// =======================
// Get all room categories (logged-in users)
// =======================
export const getRoomCategories = async (req, res) => {
  try {
    const categories = await RoomCategory.find()
      .populate("hotel", "hotelName") // populate hotel reference with name
      .sort({ createdAt: -1 });

    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch room categories",
      error: error.message,
    });
  }
};

// =======================
// Get single room category by ID (logged-in users)
// =======================
export const getRoomCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await RoomCategory.findById(id).populate("hotel", "hotelName");

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Room category not found" });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch room category",
      error: error.message,
    });
  }
};

// =======================
// Create room category (admin only)
// =======================
export const createRoomCategory = async (req, res) => {
  try {
    const { hotel, roomCategory, roomType, status } = req.body;

    if (!hotel || !roomCategory || !roomType || !status) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    const newCategory = await RoomCategory.create({
      hotel,
      roomCategory,
      roomType,
      status,
    });

    res.status(201).json({ success: true, data: newCategory });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create room category",
      error: error.message,
    });
  }
};

// =======================
// Update room category (admin only)
// =======================
export const updateRoomCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = { ...req.body };

    const updatedCategory = await RoomCategory.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    }).populate("hotel", "hotelName");

    if (!updatedCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Room category not found" });
    }

    res.json({ success: true, data: updatedCategory });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update room category",
      error: error.message,
    });
  }
};

// =======================
// Delete room category (admin only)
// =======================
export const deleteRoomCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCategory = await RoomCategory.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Room category not found" });
    }

    res.json({ success: true, message: "Room category deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete room category",
      error: error.message,
    });
  }
};
