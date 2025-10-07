import Venue from "../models/Venue.js";

// =======================
// Get all venues (public)
// =======================
export const getVenues = async (req, res) => {
  try {
    const venues = await Venue.find().sort({ createdAt: -1 });
    res.json({ success: true, data: venues });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch venues",
      error: error.message,
    });
  }
};

// =======================
// Create venue (admin only)
// =======================
export const createVenue = async (req, res) => {
  try {
    const {
      venueName,
      venueAddress,
      country,
      state,
      city,
      website,
      status,
      googleMapLink,
      distanceFromAirport,
      distanceFromRailwayStation,
      nearestMetroStation,
    } = req.body;

    // Check if image is uploaded
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Venue image is required" });
    }

    // Validate required fields
    if (!venueName || !venueAddress || !country || !state || !city || !status || !distanceFromAirport || !distanceFromRailwayStation || !nearestMetroStation) {
      return res.status(400).json({ success: false, message: "All required fields must be provided" });
    }

    const newVenue = await Venue.create({
      venueName,
      venueAddress,
      venueImage: req.file.location,
      country,
      state,
      city,
      website,
      status,
      googleMapLink,
      distanceFromAirport,
      distanceFromRailwayStation,
      nearestMetroStation,
    });

    res.status(201).json({ success: true, data: newVenue });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create venue",
      error: error.message,
    });
  }
};

// =======================
// Update venue (admin only)
// =======================
export const updateVenue = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedData = { ...req.body };
    if (req.file) updatedData.venueImage = req.file.location;

    const updatedVenue = await Venue.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });

    if (!updatedVenue) {
      return res.status(404).json({ success: false, message: "Venue not found" });
    }

    res.json({ success: true, data: updatedVenue });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update venue",
      error: error.message,
    });
  }
};

// =======================
// Delete venue (admin only)
// =======================
export const deleteVenue = async (req, res) => {
  try {
    const { id } = req.params;

    const venue = await Venue.findByIdAndDelete(id);

    if (!venue) {
      return res.status(404).json({ success: false, message: "Venue not found" });
    }

    res.json({ success: true, message: "Venue deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete venue",
      error: error.message,
    });
  }
};


