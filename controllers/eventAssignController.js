import User from "../models/User.js";
import Event from "../models/Event.js";
import EventAssign from "../models/EventAssign.js";

/**
 * =====================================
 * Admin: Get all event assignments
 * =====================================
 */
export const getEventAssignments = async (req, res) => {
  try {
    const assignments = await EventAssign.find()
      .populate("eventAdminId")
      .populate("assignedEvents.eventId", "eventName eventType startDate endDate")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch event assignments",
      error: error.message,
    });
  }
};

/**
 * =====================================
 * Admin: Assign event + modules to eventAdmin
 * =====================================
 */
export const assignEvent = async (req, res) => {
  try {
    const {
      eventAdminId,
      eventId,
      modules = {}, // dashboard, registration, etc.
    } = req.body;

    if (!eventAdminId || !eventId) {
      return res.status(400).json({
        success: false,
        message: "eventAdminId and eventId are required",
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

    // Find or create assignment document
    let assignment = await EventAssign.findOne({ eventAdminId });

    if (!assignment) {
      assignment = new EventAssign({
        eventAdminId,
        eventAdminName: eventAdmin.name,
        assignedEvents: [],
      });
    }

    // Check duplicate assignment
    const alreadyAssigned = assignment.assignedEvents.some(
      (e) => e.eventId.toString() === eventId
    );

    if (alreadyAssigned) {
      return res.status(400).json({
        success: false,
        message: "Event already assigned to this EventAdmin",
      });
    }

    assignment.assignedEvents.push({
      eventId,
      ...modules, // spread module permissions
    });

    await assignment.save();

    res.json({
      success: true,
      message: "Event assigned successfully with module permissions",
      data: assignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to assign event",
      error: error.message,
    });
  }
};

/**
 * =====================================
 * Admin: Update modules for assigned event
 * =====================================
 */
export const updateAssignedEvent = async (req, res) => {
  try {
    const { eventAdminId, eventId, modules } = req.body;

    const assignment = await EventAssign.findOne({ eventAdminId });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const assignedEvent = assignment.assignedEvents.find(
      (e) => e.eventId.toString() === eventId
    );

    if (!assignedEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not assigned to this EventAdmin",
      });
    }

    // Update module permissions
    Object.keys(modules).forEach((key) => {
      assignedEvent[key] = modules[key];
    });

    await assignment.save();

    res.json({
      success: true,
      message: "Event permissions updated successfully",
      data: assignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update assignment",
      error: error.message,
    });
  }
};

/**
 * =====================================
 * Admin: Remove event assignment
 * =====================================
 */
export const removeAssignedEvent = async (req, res) => {
  try {
    const { eventAdminId, eventId } = req.params;

    const assignment = await EventAssign.findOne({ eventAdminId });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    assignment.assignedEvents = assignment.assignedEvents.filter(
      (e) => e.eventId.toString() !== eventId
    );

    await assignment.save();

    res.json({
      success: true,
      message: "Event removed successfully",
      data: assignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to remove event",
      error: error.message,
    });
  }
};
