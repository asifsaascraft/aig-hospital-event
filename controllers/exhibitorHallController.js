import ExhibitorHall from "../models/ExhibitorHall.js";
import Event from "../models/Event.js";

// =======================
// Create Hall (EventAdmin Only)
// =======================
export const createExhibitorHall = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { hallName, status } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Create new hall
    const hall = await ExhibitorHall.create({
      eventId,
      hallName,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Exhibitor Hall created successfully",
      data: hall,
    });
  } catch (error) {
    console.error("Create Exhibitor Hall error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Halls by Event ID (Public/User)
// =======================
export const getExhibitorHallsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const halls = await ExhibitorHall.find({ eventId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Exhibitor Halls fetched successfully",
      data: halls,
    });
  } catch (error) {
    console.error("Get Exhibitor Halls error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get Active Halls by Event ID (Public/User)
// =======================
export const getActiveExhibitorHallsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const activeHalls = await ExhibitorHall.find({
      eventId,
      status: "Active",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Active Exhibitor Halls fetched successfully",
      data: activeHalls,
    });
  } catch (error) {
    console.error("Get Active Exhibitor Halls error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Hall (EventAdmin Only)
// =======================
export const updateExhibitorHall = async (req, res) => {
  try {
    const { id } = req.params;
    const { hallName, status } = req.body;

    const hall = await ExhibitorHall.findById(id);
    if (!hall) {
      return res.status(404).json({ message: "Exhibitor Hall not found" });
    }

    if (hallName) hall.hallName = hallName;
    if (status) hall.status = status;

    await hall.save();

    res.status(200).json({
      success: true,
      message: "Exhibitor Hall updated successfully",
      data: hall,
    });
  } catch (error) {
    console.error("Update Exhibitor Hall error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Hall (EventAdmin Only)
// =======================
export const deleteExhibitorHall = async (req, res) => {
  try {
    const { id } = req.params;

    const hall = await ExhibitorHall.findById(id);
    if (!hall) {
      return res.status(404).json({ message: "Exhibitor Hall not found" });
    }

    await hall.deleteOne();

    res.status(200).json({
      success: true,
      message: "Exhibitor Hall deleted successfully",
    });
  } catch (error) {
    console.error("Delete Exhibitor Hall error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
