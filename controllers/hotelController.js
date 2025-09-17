// controllers/hotelController.js
import Hotel from "../models/Hotel.js";

// =======================
// Get all hotels (public for logged-in users)
// =======================
export const getHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find().sort({ createdAt: -1 });
    res.json({ success: true, data: hotels });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch hotels",
      error: error.message,
    });
  }
};

// =======================
// Get single hotel by ID (public for logged-in users)
// =======================
export const getHotelById = async (req, res) => {
  try {
    const { id } = req.params;
    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return res.status(404).json({ success: false, message: "Hotel not found" });
    }
    res.json({ success: true, data: hotel });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch hotel",
      error: error.message,
    });
  }
};

// =======================
// Create hotel (admin only)
// =======================
export const createHotel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Hotel image is required" });
    }

    const {
      hotelName,
      hotelAddress,
      country,
      state,
      city,
      status,
      hotelCategory,
      googleMapLink,
      distanceFromAirport,
      distanceFromRailwayStation,
      nearestMetroStation,
    } = req.body;

    // Validate required fields
    if (!hotelName || !hotelAddress || !country || !state || !city || !status || !distanceFromAirport || !distanceFromRailwayStation || !nearestMetroStation) {
      return res.status(400).json({ success: false, message: "All required fields must be provided" });
    }

    const newHotel = await Hotel.create({
      hotelName,
      hotelAddress,
      hotelImage: req.file.path, // Cloudinary URL
      country,
      state,
      city,
      status,
      hotelCategory,
      googleMapLink,
      distanceFromAirport,
      distanceFromRailwayStation,
      nearestMetroStation,
    });

    res.status(201).json({ success: true, data: newHotel });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create hotel",
      error: error.message,
    });
  }
};

// =======================
// Update hotel (admin only)
// =======================
export const updateHotel = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = { ...req.body };

    if (req.file) updatedData.hotelImage = req.file.path;

    const updatedHotel = await Hotel.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedHotel) {
      return res.status(404).json({ success: false, message: "Hotel not found" });
    }

    res.json({ success: true, data: updatedHotel });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update hotel",
      error: error.message,
    });
  }
};

// =======================
// Delete hotel (admin only)
// =======================
export const deleteHotel = async (req, res) => {
  try {
    const { id } = req.params;

    const hotel = await Hotel.findByIdAndDelete(id);

    if (!hotel) {
      return res.status(404).json({ success: false, message: "Hotel not found" });
    }

    res.json({ success: true, message: "Hotel deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete hotel",
      error: error.message,
    });
  }
};
