import Hall from "../models/Hall.js";
import Event from "../models/Event.js";

// =======================
// Create Hall (EventAdmin Only)
// =======================
export const createHall = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { hallName, status } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Create new hall
    const hall = await Hall.create({
      eventId,
      hallName,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Hall created successfully",
      data: hall,
    });
  } catch (error) {
    console.error("Create hall error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Halls by Event ID (Public/User)
// =======================
export const getHallsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const halls = await Hall.find({ eventId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Halls fetched successfully",
      data: halls,
    });
  } catch (error) {
    console.error("Get halls error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Hall (EventAdmin Only)
// =======================
export const updateHall = async (req, res) => {
  try {
    const { id } = req.params;
    const { hallName, status } = req.body;

    // Find existing hall
    const hall = await Hall.findById(id);
    if (!hall) {
      return res.status(404).json({ message: "Hall not found" });
    }

    // Update only provided fields
    if (hallName) hall.hallName = hallName;
    if (status) hall.status = status;

    await hall.save();

    res.status(200).json({
      success: true,
      message: "Hall updated successfully",
      data: hall,
    });
  } catch (error) {
    console.error("Update hall error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Hall (EventAdmin Only)
// =======================
export const deleteHall = async (req, res) => {
  try {
    const { id } = req.params;

    const hall = await Hall.findById(id);
    if (!hall) {
      return res.status(404).json({ message: "Hall not found" });
    }

    await hall.deleteOne();

    res.status(200).json({
      success: true,
      message: "Hall deleted successfully",
    });
  } catch (error) {
    console.error("Delete hall error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
