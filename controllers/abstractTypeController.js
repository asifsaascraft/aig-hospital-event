import AbstractType from "../models/AbstractType.js";
import Event from "../models/Event.js";

// =======================
// Create Abstract Type (EventAdmin Only)
// =======================
export const createAbstractType = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { typeName, status } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Create new abstract type
    const abstractType = await AbstractType.create({
      eventId,
      typeName,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Abstract Type created successfully",
      data: abstractType,
    });
  } catch (error) {
    console.error("Create Abstract Type error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Abstract Types by Event ID (Public/User)
// =======================
export const getAbstractTypesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const types = await AbstractType.find({ eventId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Abstract Types fetched successfully",
      data: types,
    });
  } catch (error) {
    console.error("Get Abstract Types error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get Active Abstract Types by Event ID (Public/User)
// =======================
export const getActiveAbstractTypesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const activeTypes = await AbstractType.find({
      eventId,
      status: "Active",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Active Abstract Types fetched successfully",
      data: activeTypes,
    });
  } catch (error) {
    console.error("Get Active Abstract Types error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Abstract Type (EventAdmin Only)
// =======================
export const updateAbstractType = async (req, res) => {
  try {
    const { id } = req.params;
    const { typeName, status } = req.body;

    const abstractType = await AbstractType.findById(id);
    if (!abstractType) {
      return res.status(404).json({ message: "Abstract Type not found" });
    }

    if (typeName) abstractType.typeName = typeName;
    if (status) abstractType.status = status;

    await abstractType.save();

    res.status(200).json({
      success: true,
      message: "Abstract Type updated successfully",
      data: abstractType,
    });
  } catch (error) {
    console.error("Update Abstract Type error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Abstract Type (EventAdmin Only)
// =======================
export const deleteAbstractType = async (req, res) => {
  try {
    const { id } = req.params;

    const abstractType = await AbstractType.findById(id);
    if (!abstractType) {
      return res.status(404).json({ message: "Abstract Type not found" });
    }

    await abstractType.deleteOne();

    res.status(200).json({
      success: true,
      message: "Abstract Type deleted successfully",
    });
  } catch (error) {
    console.error("Delete Abstract Type error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
