import AgendaSessionType from "../models/AgendaSessionType.js";
import Event from "../models/Event.js";

// =======================
// Create Agenda Session Type (EventAdmin Only)
// =======================
export const createAgendaSessionType = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { sessionTypeName, status } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Create new session type
    const sessionType = await AgendaSessionType.create({
      eventId,
      sessionTypeName,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Agenda Session Type created successfully",
      data: sessionType,
    });
  } catch (error) {
    console.error("Create Agenda Session Type error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Session Types by Event ID (Public/User)
// =======================
export const getAgendaSessionTypesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const types = await AgendaSessionType.find({ eventId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Agenda Session Types fetched successfully",
      data: types,
    });
  } catch (error) {
    console.error("Get Agenda Session Types error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get Active Session Types by Event ID (Public/User)
// =======================
export const getActiveAgendaSessionTypesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const activeTypes = await AgendaSessionType.find({
      eventId,
      status: "Active",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Active Agenda Session Types fetched successfully",
      data: activeTypes,
    });
  } catch (error) {
    console.error("Get Active Agenda Session Types error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Agenda Session Type (EventAdmin Only)
// =======================
export const updateAgendaSessionType = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionTypeName, status } = req.body;

    const sessionType = await AgendaSessionType.findById(id);
    if (!sessionType) {
      return res.status(404).json({ message: "Agenda Session Type not found" });
    }

    if (sessionTypeName) sessionType.sessionTypeName = sessionTypeName;
    if (status) sessionType.status = status;

    await sessionType.save();

    res.status(200).json({
      success: true,
      message: "Agenda Session Type updated successfully",
      data: sessionType,
    });
  } catch (error) {
    console.error("Update Agenda Session Type error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Agenda Session Type (EventAdmin Only)
// =======================
export const deleteAgendaSessionType = async (req, res) => {
  try {
    const { id } = req.params;

    const sessionType = await AgendaSessionType.findById(id);
    if (!sessionType) {
      return res.status(404).json({ message: "Agenda Session Type not found" });
    }

    await sessionType.deleteOne();

    res.status(200).json({
      success: true,
      message: "Agenda Session Type deleted successfully",
    });
  } catch (error) {
    console.error("Delete Agenda Session Type error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
