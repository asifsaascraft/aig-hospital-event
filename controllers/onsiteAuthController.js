import jwt from "jsonwebtoken";
import LoginGenerateToken from "../models/LoginGenerateToken.js";
import Event from "../models/Event.js";

// =======================
// Onsite Login
// =======================
export const loginOnsite = async (req, res) => {
  try {
    const { loginToken } = req.body;

    if (!loginToken) {
      return res.status(400).json({
        message: "Login token is required",
      });
    }

    const tokenRecord = await LoginGenerateToken.findOne({
      loginToken: loginToken.trim(),
      status: "Active",
    }).populate("eventId", "eventName startDateTime endDateTime");

    if (!tokenRecord) {
      return res.status(401).json({
        message: "Invalid or inactive login token",
      });
    }

    const accessToken = jwt.sign(
      {
        id: tokenRecord._id,
        role: "onsite",
        eventId: tokenRecord.eventId._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES || "1d",
      },
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        _id: tokenRecord._id,
        eventId: tokenRecord.eventId,
        name: tokenRecord.name,
        accessToken,
      },
    });
  } catch (error) {
    console.error("Onsite Login Error:", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};
