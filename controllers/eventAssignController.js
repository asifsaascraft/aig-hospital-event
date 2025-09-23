// controllers/eventAssignController.js
import User from "../models/User.js";
import Event from "../models/Event.js";

// =======================
// Get all event assignments (admin only)
// =======================
export const getEventAssignments = async (req, res) => {
  try {
    const eventAdmins = await User.find({ role: "eventAdmin" })
      .populate({
        path: "assignedEvents",
        select: "_id eventName eventType", 
      })
      .lean(); // ensures no extra fields like dynamicStatus

    res.json({
      success: true,
      data: eventAdmins,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch event assignments",
      error: error.message,
    });
  }
};

// =======================
// Assign an event to an eventAdmin (admin only)
// =======================
export const assignEvent = async (req, res) => {
  try {
    const { eventId, eventAdminId } = req.body;

    if (!eventId || !eventAdminId) {
      return res.status(400).json({
        success: false,
        message: "EventId and EventAdminId are required",
      });
    }

    const eventAdmin = await User.findById(eventAdminId);
    if (!eventAdmin || eventAdmin.role !== "eventAdmin") {
      return res.status(404).json({
        success: false,
        message: "EventAdmin not found",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (!eventAdmin.assignedEvents.includes(event._id)) {
      eventAdmin.assignedEvents.push(event._id);
      await eventAdmin.save();
    }

    res.json({
      success: true,
      message: "Event assigned successfully",
      data: eventAdmin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to assign event",
      error: error.message,
    });
  }
};

// =======================
// Update assigned event for eventAdmin (replace old event with new)
// =======================
export const updateAssignedEvent = async (req, res) => {
  try {
    const { eventAdminId } = req.params;
    const { oldEventId, newEventId } = req.body;

    const eventAdmin = await User.findById(eventAdminId);
    if (!eventAdmin || eventAdmin.role !== "eventAdmin") {
      return res.status(404).json({
        success: false,
        message: "EventAdmin not found",
      });
    }

    const oldIndex = eventAdmin.assignedEvents.indexOf(oldEventId);
    if (oldIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "Old event not found in assignments",
      });
    }

    const newEvent = await Event.findById(newEventId);
    if (!newEvent) {
      return res.status(404).json({
        success: false,
        message: "New event not found",
      });
    }

    eventAdmin.assignedEvents[oldIndex] = newEvent._id;
    await eventAdmin.save();

    res.json({
      success: true,
      message: "Event updated successfully",
      data: eventAdmin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update assigned event",
      error: error.message,
    });
  }
};

// =======================
// Remove assigned event from eventAdmin
// =======================
export const removeAssignedEvent = async (req, res) => {
  try {
    const { eventAdminId, eventId } = req.params;

    const eventAdmin = await User.findById(eventAdminId);
    if (!eventAdmin || eventAdmin.role !== "eventAdmin") {
      return res.status(404).json({
        success: false,
        message: "EventAdmin not found",
      });
    }

    eventAdmin.assignedEvents = eventAdmin.assignedEvents.filter(
      (eId) => eId.toString() !== eventId
    );

    await eventAdmin.save();

    res.json({
      success: true,
      message: "Event removed successfully",
      data: eventAdmin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to remove event",
      error: error.message,
    });
  }
};
