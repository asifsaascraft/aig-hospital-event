import Speaker from "../models/Speaker.js";
import SpeakerType from "../models/SpeakerType.js";
import Event from "../models/Event.js";

// =======================
// Create Speaker (EventAdmin)
// =======================
export const createSpeaker = async (req, res) => {
  try {
    const { eventId } = req.params;

    const {
      name,
      description,
      designation,
      speakerTypeId,
      status,
    } = req.body;

    // Validate Event
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // Validate Speaker Type
    const speakerType = await SpeakerType.findById(
      speakerTypeId
    );

    if (!speakerType) {
      return res.status(404).json({
        message: "Speaker Type not found",
      });
    }

    let image = "";

    if (req.file) {
      image = req.file.location;
    }

    const speaker = await Speaker.create({
      eventId,
      name,
      description,
      designation,
      image,
      speakerTypeId,
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Speaker created successfully",
      data: speaker,
    });
  } catch (error) {
    console.error("Create Speaker Error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(
        (err) => err.message
      );

      return res.status(400).json({
        message: errors.join(", "),
      });
    }

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Get All Speakers By Event
// =======================
export const getSpeakersByEvent = async (
  req,
  res
) => {
  try {
    const { eventId } = req.params;

    const speakers = await Speaker.find({
      eventId,
    })
      .populate(
        "speakerTypeId",
        "speakerType status"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      message:
        "Speakers fetched successfully",
      data: speakers,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Get Active Speakers
// =======================
export const getActiveSpeakersByEvent =
  async (req, res) => {
    try {
      const { eventId } = req.params;

      const speakers = await Speaker.find({
        eventId,
        status: "Active",
      })
        .populate(
          "speakerTypeId",
          "speakerType status"
        )
        .sort({
          createdAt: -1,
        });

      return res.status(200).json({
        success: true,
        message:
          "Active Speakers fetched successfully",
        data: speakers,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Server Error",
      });
    }
  };

  // =======================
// Get Speaker By Id
// =======================
export const getSpeakerById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const speaker =
      await Speaker.findById(id).populate(
        "speakerTypeId",
        "speakerType status"
      );

    if (!speaker) {
      return res.status(404).json({
        message: "Speaker not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Speaker fetched successfully",
      data: speaker,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Update Speaker
// =======================
export const updateSpeaker = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      name,
      description,
      designation,
      speakerTypeId,
      status,
    } = req.body;

    const speaker =
      await Speaker.findById(id);

    if (!speaker) {
      return res.status(404).json({
        message: "Speaker not found",
      });
    }

    if (speakerTypeId) {
      const speakerType =
        await SpeakerType.findById(
          speakerTypeId
        );

      if (!speakerType) {
        return res.status(404).json({
          message: "Speaker Type not found",
        });
      }

      speaker.speakerTypeId =
        speakerTypeId;
    }

    if (name) {
      speaker.name = name;
    }

    if (description) {
      speaker.description =
        description;
    }

    if (designation) {
      speaker.designation =
        designation;
    }

    if (status) {
      speaker.status = status;
    }

    if (req.file) {
      speaker.image =
        req.file.location;
    }

    await speaker.save();

    return res.status(200).json({
      success: true,
      message:
        "Speaker updated successfully",
      data: speaker,
    });
  } catch (error) {
    console.error(error);

    if (error.name === "ValidationError") {
      const errors = Object.values(
        error.errors
      ).map((err) => err.message);

      return res.status(400).json({
        message: errors.join(", "),
      });
    }

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Delete Speaker
// =======================
export const deleteSpeaker = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const speaker =
      await Speaker.findById(id);

    if (!speaker) {
      return res.status(404).json({
        message: "Speaker not found",
      });
    }

    await speaker.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Speaker deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};