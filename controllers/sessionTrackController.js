import SessionTrack from "../models/SessionTrack.js";
import Event from "../models/Event.js";

// =======================
// Create Session Track (EventAdmin Only)
// =======================
export const createSessionTrack = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { sessionTrackName, status } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const track = await SessionTrack.create({
      eventId,
      sessionTrackName,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Session Track created successfully",
      data: track,
    });
  } catch (error) {
    console.error("Create Session Track Error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Get All Session Tracks
// =======================
export const getSessionTracksByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const tracks = await SessionTrack.find({
      eventId,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Session Tracks fetched successfully",
      data: tracks,
    });
  } catch (error) {
    console.error("Get Session Tracks Error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Get Active Session Tracks
// =======================
export const getActiveSessionTracksByEvent = async (
  req,
  res
) => {
  try {
    const { eventId } = req.params;

    const tracks = await SessionTrack.find({
      eventId,
      status: "Active",
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Active Session Tracks fetched successfully",
      data: tracks,
    });
  } catch (error) {
    console.error("Get Active Session Tracks Error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Update Session Track
// =======================
export const updateSessionTrack = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionTrackName, status } = req.body;

    const track = await SessionTrack.findById(id);

    if (!track) {
      return res.status(404).json({
        message: "Session Track not found",
      });
    }

    if (sessionTrackName)
      track.sessionTrackName = sessionTrackName;

    if (status)
      track.status = status;

    await track.save();

    res.status(200).json({
      success: true,
      message: "Session Track updated successfully",
      data: track,
    });
  } catch (error) {
    console.error("Update Session Track Error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Delete Session Track
// =======================
export const deleteSessionTrack = async (req, res) => {
  try {
    const { id } = req.params;

    const track = await SessionTrack.findById(id);

    if (!track) {
      return res.status(404).json({
        message: "Session Track not found",
      });
    }

    await track.deleteOne();

    res.status(200).json({
      success: true,
      message: "Session Track deleted successfully",
    });
  } catch (error) {
    console.error("Delete Session Track Error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};