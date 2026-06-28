import Message from "../models/Message.js";
import Event from "../models/Event.js";

// =======================
// Create Message (EventAdmin)
// Only one message allowed per event
// =======================
export const createMessage = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const alreadyExists = await Message.findOne({ eventId });

    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        message: "Message already exists for this event. Please update it.",
      });
    }

    const images =
      req.files && req.files.length
        ? req.files.map((file) => file.location)
        : [];

    const newMessage = await Message.create({
      eventId,
      message,
      images,
    });

    return res.status(201).json({
      success: true,
      message: "Message created successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("Create Message Error:", error);

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
// Get Message By Event
// =======================
export const getMessageByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const message = await Message.findOne({
      eventId,
    }).populate("eventId", "eventName");

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message fetched successfully",
      data: message,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Get Message By Id
// =======================
export const getMessageById = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findById(id)
      .populate("eventId", "eventName");

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message fetched successfully",
      data: message,
    });
  } catch (error) {
    console.error("Get Message By Id Error:", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Update Message
// =======================
export const updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, existingImages } = req.body;

    const data = await Message.findById(id);

    if (!data) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    if (message) {
      data.message = message;
    }

    let images = [];

    if (existingImages) {
      if (Array.isArray(existingImages)) {
        images = existingImages;
      } else {
        images = [existingImages];
      }
    }

    if (req.files && req.files.length) {
      const uploadedImages = req.files.map(
        (file) => file.location
      );

      images = [...images, ...uploadedImages];
    }

    data.images = images;

    await data.save();

    return res.status(200).json({
      success: true,
      message: "Message updated successfully",
      data,
    });
  } catch (error) {
    console.error(error);

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
// Delete Message
// =======================
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    await message.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};