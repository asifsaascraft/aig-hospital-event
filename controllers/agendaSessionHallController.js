import AgendaSessionHall from "../models/AgendaSessionHall.js";
import Event from "../models/Event.js";

// =======================
// Create Agenda Session Hall (EventAdmin Only)
// =======================
export const createAgendaSessionHall = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { hallName, status } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Create new hall
    const hall = await AgendaSessionHall.create({
      eventId,
      hallName,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Agenda Session Hall created successfully",
      data: hall,
    });
  } catch (error) {
    console.error("Create Agenda Session Hall error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Halls by Event ID (Public/User)
// =======================
export const getAgendaSessionHallsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const halls = await AgendaSessionHall.find({ eventId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Agenda Session Halls fetched successfully",
      data: halls,
    });
  } catch (error) {
    console.error("Get Agenda Session Halls error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get Active Halls by Event ID (Public/User)
// =======================
export const getActiveAgendaSessionHallsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const activeHalls = await AgendaSessionHall.find({
      eventId,
      status: "Active",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Active Agenda Session Halls fetched successfully",
      data: activeHalls,
    });
  } catch (error) {
    console.error("Get Active Agenda Session Halls error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Hall (EventAdmin Only)
// =======================
export const updateAgendaSessionHall = async (req, res) => {
  try {
    const { id } = req.params;
    const { hallName, status } = req.body;

    const hall = await AgendaSessionHall.findById(id);
    if (!hall) {
      return res.status(404).json({ message: "Agenda Session Hall not found" });
    }

    if (hallName) hall.hallName = hallName;
    if (status) hall.status = status;

    await hall.save();

    res.status(200).json({
      success: true,
      message: "Agenda Session Hall updated successfully",
      data: hall,
    });
  } catch (error) {
    console.error("Update Agenda Session Hall error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Hall (EventAdmin Only)
// =======================
export const deleteAgendaSessionHall = async (req, res) => {
  try {
    const { id } = req.params;

    const hall = await AgendaSessionHall.findById(id);
    if (!hall) {
      return res
        .status(404)
        .json({ message: "Agenda Session Hall not found" });
    }

    await hall.deleteOne();

    res.status(200).json({
      success: true,
      message: "Agenda Session Hall deleted successfully",
    });
  } catch (error) {
    console.error("Delete Agenda Session Hall error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
