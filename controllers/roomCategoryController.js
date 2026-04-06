// controllers/roomCategoryController.js
import RoomCategory from "../models/RoomCategory.js";
import Hotel from "../models/Hotel.js";

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
// Get ACTIVE room categories (logged-in users)
// =======================
export const getActiveRoomCategories = async (req, res) => {
  try {
    const categories = await RoomCategory.find({ status: "Active" })
      .populate("hotel", "hotelName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Active room categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    console.error("Get Active Room Categories Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active room categories",
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

    if (!hotel || !roomCategory || !roomType) {
      return res.status(400).json({
        success: false,
        message: "hotel, roomCategory and roomType are required",
      });
    }

    // prevent duplicate same category + type in same hotel
    const existingCategory = await RoomCategory.findOne({
      hotel,
      roomCategory,
      roomType,
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "This room category and type already exists for this hotel",
      });
    }

    const newCategory = await RoomCategory.create({
      hotel,
      roomCategory,
      roomType,
      status: status || "Active",
    });

    res.status(201).json({
      success: true,
      message: "Room category created successfully",
      data: newCategory,
    });

  } catch (error) {
    console.error("Create Room Category Error:", error);
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

    // ===============================
    // Step 1: Check if exists
    // ===============================
    const existingCategory = await RoomCategory.findById(id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Room category not found",
      });
    }

    // ===============================
    // Step 2: Prepare final values (important)
    // ===============================
    const finalHotel = updatedData.hotel || existingCategory.hotel;
    const finalRoomCategory =
      updatedData.roomCategory || existingCategory.roomCategory;
    const finalRoomType =
      updatedData.roomType || existingCategory.roomType;

    // ===============================
    // Step 3: Duplicate check (exclude current)
    // ===============================
    const duplicate = await RoomCategory.findOne({
      hotel: finalHotel,
      roomCategory: finalRoomCategory,
      roomType: finalRoomType,
      _id: { $ne: id }, // 🔥 important
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message:
          "This room category and type already exists for this hotel",
      });
    }

    // ===============================
    // Step 4: Update
    // ===============================
    const updatedCategory = await RoomCategory.findByIdAndUpdate(
      id,
      updatedData,
      {
        new: true,
        runValidators: true,
      }
    ).populate("hotel", "hotelName");

    res.status(200).json({
      success: true,
      message: "Room category updated successfully",
      data: updatedCategory,
    });

  } catch (error) {
    console.error("Update Room Category Error:", error);
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
