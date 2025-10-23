import Booth from "../models/Booth.js";
import Event from "../models/Event.js";

// =======================
// Create Booth (EventAdmin Only)
// =======================
export const createBooth = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { booth, hallName, stallType, status } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Create new booth
    const newBooth = await Booth.create({
      eventId,
      booth,
      hallName,
      stallType,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Booth created successfully",
      data: newBooth,
    });
  } catch (error) {
    console.error("Create booth error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Booths by Event ID (Public/User)
// =======================
export const getBoothsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const booths = await Booth.find({ eventId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Booths fetched successfully",
      data: booths,
    });
  } catch (error) {
    console.error("Get booths error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Booth (EventAdmin Only)
// =======================
export const updateBooth = async (req, res) => {
  try {
    const { id } = req.params;
    const { booth, hallName, stallType, status } = req.body;

    // Find existing booth
    const existingBooth = await Booth.findById(id);
    if (!existingBooth) {
      return res.status(404).json({ message: "Booth not found" });
    }

    // Update only provided fields
    if (booth) existingBooth.booth = booth;
    if (hallName) existingBooth.hallName = hallName;
    if (stallType) existingBooth.stallType = stallType;
    if (status) existingBooth.status = status;

    await existingBooth.save();

    res.status(200).json({
      success: true,
      message: "Booth updated successfully",
      data: existingBooth,
    });
  } catch (error) {
    console.error("Update booth error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Booth (EventAdmin Only)
// =======================
export const deleteBooth = async (req, res) => {
  try {
    const { id } = req.params;

    const booth = await Booth.findById(id);
    if (!booth) {
      return res.status(404).json({ message: "Booth not found" });
    }

    await booth.deleteOne();

    res.status(200).json({
      success: true,
      message: "Booth deleted successfully",
    });
  } catch (error) {
    console.error("Delete booth error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
