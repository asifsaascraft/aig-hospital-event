import QuickLink from "../models/QuickLink.js";
import Event from "../models/Event.js";

// =======================
// Create Quick Link (EventAdmin)
// =======================
export const createQuickLink = async (req, res) => {
  try {
    const { eventId } = req.params;

    const {
      title,
      quickLink,
      status,
    } = req.body;

    // Validate Event
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const link = await QuickLink.create({
      eventId,
      title,
      quickLink,
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Quick Link created successfully",
      data: link,
    });
  } catch (error) {
    console.error("Create Quick Link Error:", error);

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
// Get All Quick Links By Event
// =======================
export const getQuickLinksByEvent = async (
  req,
  res
) => {
  try {
    const { eventId } = req.params;

    const links = await QuickLink.find({
      eventId,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Quick Links fetched successfully",
      data: links,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Get Active Quick Links
// =======================
export const getActiveQuickLinksByEvent =
  async (req, res) => {
    try {
      const { eventId } = req.params;

      const links = await QuickLink.find({
        eventId,
        status: "Active",
      }).sort({
        createdAt: -1,
      });

      return res.status(200).json({
        success: true,
        message:
          "Active Quick Links fetched successfully",
        data: links,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Server Error",
      });
    }
  };

// =======================
// Get Quick Link By Id
// =======================
export const getQuickLinkById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const link = await QuickLink.findById(id);

    if (!link) {
      return res.status(404).json({
        message: "Quick Link not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Quick Link fetched successfully",
      data: link,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Update Quick Link
// =======================
export const updateQuickLink = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      title,
      quickLink,
      status,
    } = req.body;

    const link = await QuickLink.findById(id);

    if (!link) {
      return res.status(404).json({
        message: "Quick Link not found",
      });
    }

    if (title) {
      link.title = title;
    }

    if (quickLink) {
      link.quickLink = quickLink;
    }

    if (status) {
      link.status = status;
    }

    await link.save();

    return res.status(200).json({
      success: true,
      message:
        "Quick Link updated successfully",
      data: link,
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
// Delete Quick Link
// =======================
export const deleteQuickLink = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const link = await QuickLink.findById(id);

    if (!link) {
      return res.status(404).json({
        message: "Quick Link not found",
      });
    }

    await link.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Quick Link deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};