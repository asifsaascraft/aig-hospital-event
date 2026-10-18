// controllers/hotelController.js
import Hotel from "../models/Hotel.js";

// Convert Indian HH:mm time to UTC for database storage
const parseTime = (value) => {
  if (typeof value !== "string") return null;

  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);

  if (!match) return null;

  const [, hours, minutes] = match;

  // Frontend time is interpreted as IST (UTC+05:30)
  return new Date(
    Date.UTC(
      1970,
      0,
      1,
      Number(hours),
      Number(minutes),
      0,
      0
    ) - 330 * 60 * 1000
  );
};

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
// Get ACTIVE hotels (public for logged-in users)
// =======================
export const getActiveHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find({ status: "Active" }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Active hotels fetched successfully",
      data: hotels,
    });
  } catch (error) {
    console.error("Get Active Hotels Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active hotels",
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
      return res
        .status(404)
        .json({ success: false, message: "Hotel not found" });
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
      return res.status(400).json({
        success: false,
        message: "Hotel image is required",
      });
    }

    const {
      hotelName,
      hotelAddress,
      checkinTime,
      checkoutTime,
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
    if (
      !hotelName ||
      !hotelAddress ||
      !checkinTime ||
      !checkoutTime ||
      !country ||
      !state ||
      !city ||
      !status ||
      !distanceFromAirport ||
      !distanceFromRailwayStation ||
      !nearestMetroStation
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    const parsedCheckinTime = parseTime(checkinTime);
    const parsedCheckoutTime = parseTime(checkoutTime);

    if (!parsedCheckinTime || !parsedCheckoutTime) {
      return res.status(400).json({
        success: false,
        message: "Check-in and check-out times must be in HH:mm format",
      });
    }
    const newHotel = await Hotel.create({
      hotelName,
      hotelAddress,
      checkinTime: parsedCheckinTime,
      checkoutTime: parsedCheckoutTime,
      hotelImage: req.file.location,
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

    res.status(201).json({
      success: true,
      message: "Hotel created successfully",
      data: newHotel,
    });
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

    if (updatedData.checkinTime !== undefined) {
      const parsedCheckinTime = parseTime(updatedData.checkinTime);

      if (!parsedCheckinTime) {
        return res.status(400).json({
          success: false,
          message: "Check-in time must be in HH:mm format",
        });
      }

      updatedData.checkinTime = parsedCheckinTime;
    }

    if (updatedData.checkoutTime !== undefined) {
      const parsedCheckoutTime = parseTime(updatedData.checkoutTime);

      if (!parsedCheckoutTime) {
        return res.status(400).json({
          success: false,
          message: "Check-out time must be in HH:mm format",
        });
      }

      updatedData.checkoutTime = parsedCheckoutTime;
    }

    // If new image uploaded
    if (req.file) {
      updatedData.hotelImage = req.file.location;
    }

    // ===============================
    // Step 1: Update Hotel
    // ===============================
    const updatedHotel = await Hotel.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedHotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    // ===============================
    // Step 2: If Hotel is set to Inactive → Update RoomCategories
    // ===============================
    if (updatedData.status === "Inactive") {
      await RoomCategory.updateMany(
        { hotel: id },
        { $set: { status: "Inactive" } },
      );
    }

    res.json({
      success: true,
      message: "Hotel updated successfully",
      data: updatedHotel,
    });
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
      return res
        .status(404)
        .json({ success: false, message: "Hotel not found" });
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
