import RoomCategory from "../models/RoomCategory.js";

// =======================
// Get All Room Categories
// =======================
export const getRoomCategories = async (req, res) => {
  try {
    const roomCategories = await RoomCategory.find()
      .populate("hotelId", "hotelName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: roomCategories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch room categories",
      error: error.message,
    });
  }
};

// =======================
// Get Active Room Categories
// =======================
export const getActiveRoomCategories = async (req, res) => {
  try {
    const roomCategories = await RoomCategory.find({
      status: "Active",
    })
      .populate("hotelId", "hotelName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Active room categories fetched successfully",
      data: roomCategories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch active room categories",
      error: error.message,
    });
  }
};

// =======================
// Get Room Category By ID
// =======================
export const getRoomCategoryById = async (req, res) => {
  try {
    const roomCategory = await RoomCategory.findById(req.params.id).populate(
      "hotelId",
      "hotelName"
    );

    if (!roomCategory) {
      return res.status(404).json({
        success: false,
        message: "Room category not found",
      });
    }

    res.status(200).json({
      success: true,
      data: roomCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch room category",
      error: error.message,
    });
  }
};

// =======================
// Create Room Category
// =======================
export const createRoomCategory = async (req, res) => {
  try {
    const { hotelId, roomCategoryName, status } = req.body;

    if (!hotelId || !roomCategoryName) {
      return res.status(400).json({
        success: false,
        message: "Hotel and Room Category Name are required",
      });
    }

    const roomCategory = await RoomCategory.create({
      hotelId,
      roomCategoryName,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Room category created successfully",
      data: roomCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create room category",
      error: error.message,
    });
  }
};

// =======================
// Update Room Category
// =======================
export const updateRoomCategory = async (req, res) => {
  try {
    const roomCategory = await RoomCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!roomCategory) {
      return res.status(404).json({
        success: false,
        message: "Room category not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Room category updated successfully",
      data: roomCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update room category",
      error: error.message,
    });
  }
};

// =======================
// Delete Room Category
// =======================
export const deleteRoomCategory = async (req, res) => {
  try {
    const roomCategory = await RoomCategory.findByIdAndDelete(req.params.id);

    if (!roomCategory) {
      return res.status(404).json({
        success: false,
        message: "Room category not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Room category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete room category",
      error: error.message,
    });
  }
};