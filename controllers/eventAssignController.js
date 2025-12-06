
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
      .lean();

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
// Update assigned event or company
// =======================
export const updateAssignedEvent = async (req, res) => {
  try {
    const { oldEventId, oldEventAdminId, newEventId, newEventAdminId } = req.body;

    // Remove from old company
    const oldAdmin = await User.findById(oldEventAdminId);
    if (oldAdmin) {
      oldAdmin.assignedEvents = oldAdmin.assignedEvents.filter(
        (id) => id.toString() !== oldEventId
      );
      await oldAdmin.save();
    }

    // Add to new company
    const newAdmin = await User.findById(newEventAdminId);
    if (!newAdmin || newAdmin.role !== "eventAdmin") {
      return res.status(404).json({ success: false, message: "New EventAdmin not found" });
    }

    const newEvent = await Event.findById(newEventId);
    if (!newEvent) {
      return res.status(404).json({ success: false, message: "New event not found" });
    }

    if (!newAdmin.assignedEvents.includes(newEvent._id)) {
      newAdmin.assignedEvents.push(newEvent._id);
    }

    await newAdmin.save();

    res.json({
      success: true,
      message: "Assignment updated successfully",
      data: newAdmin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update assignment",
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
