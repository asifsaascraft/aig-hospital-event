import SessionHall from "../models/SessionHall.js";
import Event from "../models/Event.js";

// =======================
// Create Session Hall (EventAdmin Only)
// =======================
export const createSessionHall = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { sessionHallName, status } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const hall = await SessionHall.create({
      eventId,
      sessionHallName,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Session Hall created successfully",
      data: hall,
    });
  } catch (error) {
    console.error("Create Session Hall Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Get All Session Halls
// =======================
export const getSessionHallsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const halls = await SessionHall.find({
      eventId,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Session Halls fetched successfully",
      data: halls,
    });
  } catch (error) {
    console.error("Get Session Halls Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Get Active Session Halls
// =======================
export const getActiveSessionHallsByEvent = async (
  req,
  res
) => {
  try {
    const { eventId } = req.params;

    const halls = await SessionHall.find({
      eventId,
      status: "Active",
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message:
        "Active Session Halls fetched successfully",
      data: halls,
    });
  } catch (error) {
    console.error(
      "Get Active Session Halls Error:",
      error
    );

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Update Session Hall
// =======================
export const updateSessionHall = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionHallName, status } = req.body;

    const hall = await SessionHall.findById(id);

    if (!hall) {
      return res.status(404).json({
        message: "Session Hall not found",
      });
    }

    if (sessionHallName)
      hall.sessionHallName = sessionHallName;

    if (status) hall.status = status;

    await hall.save();

    res.status(200).json({
      success: true,
      message: "Session Hall updated successfully",
      data: hall,
    });
  } catch (error) {
    console.error(
      "Update Session Hall Error:",
      error
    );

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Delete Session Hall
// =======================
export const deleteSessionHall = async (req, res) => {
  try {
    const { id } = req.params;

    const hall = await SessionHall.findById(id);

    if (!hall) {
      return res.status(404).json({
        message: "Session Hall not found",
      });
    }

    await hall.deleteOne();

    res.status(200).json({
      success: true,
      message: "Session Hall deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Session Hall Error:",
      error
    );

    res.status(500).json({
      message: "Server Error",
    });
  }
};