import SpeakerType from "../models/SpeakerType.js";
import Event from "../models/Event.js";

// =======================
// Create Speaker Type (EventAdmin Only)
// =======================
export const createSpeakerType = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { speakerType, status } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // Create Speaker Type
    const speaker = await SpeakerType.create({
      eventId,
      speakerType,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Speaker Type created successfully",
      data: speaker,
    });
  } catch (error) {
    console.error("Create Speaker Type Error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Get All Speaker Types
// =======================
export const getSpeakerTypesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const speakerTypes = await SpeakerType.find({
      eventId,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Speaker Types fetched successfully",
      data: speakerTypes,
    });
  } catch (error) {
    console.error("Get Speaker Types Error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Get Active Speaker Types
// =======================
export const getActiveSpeakerTypesByEvent = async (
  req,
  res
) => {
  try {
    const { eventId } = req.params;

    const speakerTypes = await SpeakerType.find({
      eventId,
      status: "Active",
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Active Speaker Types fetched successfully",
      data: speakerTypes,
    });
  } catch (error) {
    console.error("Get Active Speaker Types Error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Update Speaker Type
// =======================
export const updateSpeakerType = async (req, res) => {
  try {
    const { id } = req.params;
    const { speakerType, status } = req.body;

    const speaker = await SpeakerType.findById(id);

    if (!speaker) {
      return res.status(404).json({
        message: "Speaker Type not found",
      });
    }

    if (speakerType) speaker.speakerType = speakerType;

    if (status) speaker.status = status;

    await speaker.save();

    res.status(200).json({
      success: true,
      message: "Speaker Type updated successfully",
      data: speaker,
    });
  } catch (error) {
    console.error("Update Speaker Type Error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Delete Speaker Type
// =======================
export const deleteSpeakerType = async (req, res) => {
  try {
    const { id } = req.params;

    const speaker = await SpeakerType.findById(id);

    if (!speaker) {
      return res.status(404).json({
        message: "Speaker Type not found",
      });
    }

    await speaker.deleteOne();

    res.status(200).json({
      success: true,
      message: "Speaker Type deleted successfully",
    });
  } catch (error) {
    console.error("Delete Speaker Type Error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};