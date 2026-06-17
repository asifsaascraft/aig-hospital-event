import crypto from "crypto";

import LoginGenerateToken from "../models/LoginGenerateToken.js";
import Event from "../models/Event.js";

// =======================
// Generate 16 Character Token
// =======================
const generateLoginToken = async () => {
  let token;
  let exists = true;

  while (exists) {
    token = crypto.randomBytes(8).toString("hex").toUpperCase(); // 16 chars

    exists = await LoginGenerateToken.findOne({
      loginToken: token,
    });
  }

  return token;
};

// =======================
// Create Login Token
// =======================
export const createLoginGenerateToken = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, status } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const loginToken = await generateLoginToken();

    const tokenRecord = await LoginGenerateToken.create({
      eventId,
      name,
      status: status || "Active",
      loginToken,
    });

    return res.status(201).json({
      success: true,
      message: "Login token generated successfully",
      data: tokenRecord,
    });
  } catch (error) {
    console.error("Create Login Token Error:", error);

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
// Get All Tokens By Event
// =======================
export const getLoginGenerateTokensByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const tokens = await LoginGenerateToken.find({
      eventId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Login tokens fetched successfully",
      data: tokens,
    });
  } catch (error) {
    console.error("Get Login Tokens Error:", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Update Login Token
// =======================
export const updateLoginGenerateToken = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const tokenRecord = await LoginGenerateToken.findById(id);

    if (!tokenRecord) {
      return res.status(404).json({
        message: "Login token record not found",
      });
    }

    if (name !== undefined) {
      tokenRecord.name = name;
    }

    if (status !== undefined) {
      tokenRecord.status = status;
    }

    await tokenRecord.save();

    return res.status(200).json({
      success: true,
      message: "Login token updated successfully",
      data: tokenRecord,
    });
  } catch (error) {
    console.error("Update Login Token Error:", error);

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
// Delete Login Token
// =======================
export const deleteLoginGenerateToken = async (req, res) => {
  try {
    const { id } = req.params;

    const tokenRecord = await LoginGenerateToken.findById(id);

    if (!tokenRecord) {
      return res.status(404).json({
        message: "Login token record not found",
      });
    }

    await tokenRecord.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Login token deleted successfully",
    });
  } catch (error) {
    console.error("Delete Login Token Error:", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};