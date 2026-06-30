import Download from "../models/Download.js";
import Event from "../models/Event.js";

// =======================
// Create Download (EventAdmin)
// =======================
export const createDownload = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title } = req.body;

    // Validate Event
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    let uploadFile = "";

    if (req.file) {
      uploadFile = req.file.location;
    }

    const download = await Download.create({
      eventId,
      title,
      uploadFile,
    });

    return res.status(201).json({
      success: true,
      message: "Download created successfully",
      data: download,
    });
  } catch (error) {
    console.error("Create Download Error:", error);

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
// Get All Downloads By Event
// =======================
export const getDownloadsByEvent = async (
  req,
  res
) => {
  try {
    const { eventId } = req.params;

    const downloads = await Download.find({
      eventId,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Downloads fetched successfully",
      data: downloads,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Get Download By Id
// =======================
export const getDownloadById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const download =
      await Download.findById(id);

    if (!download) {
      return res.status(404).json({
        message: "Download not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Download fetched successfully",
      data: download,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Update Download
// =======================
export const updateDownload = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const download =
      await Download.findById(id);

    if (!download) {
      return res.status(404).json({
        message: "Download not found",
      });
    }

    if (title) {
      download.title = title;
    }

    if (req.file) {
      download.uploadFile =
        req.file.location;
    }

    await download.save();

    return res.status(200).json({
      success: true,
      message:
        "Download updated successfully",
      data: download,
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
// Delete Download
// =======================
export const deleteDownload = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const download =
      await Download.findById(id);

    if (!download) {
      return res.status(404).json({
        message: "Download not found",
      });
    }

    await download.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Download deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};