// controllers/eventAssignController.js

import User from "../models/User.js";
import Event from "../models/Event.js";
import EventAssign from "../models/EventAssign.js";


// =======================
// Get all event assignments (admin only)
// =======================
export const getEventAssignments = async (req, res) => {
  try {
    const assignments = await EventAssign.find()
      .populate({
        path: "assignedEvents.eventId",
        select: "_id eventName eventType",
      })
      .lean();

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



// =======================
// Assign Event to EventAdmin (Create or Update without duplicate)
// =======================
export const assignEvent = async (req, res) => {
  try {
    const { eventAdminId, eventId, ...moduleFields } = req.body;

    if (!eventAdminId || !eventId) {
      return res.status(400).json({
        success: false,
        message: "eventAdminId and eventId are required",
      });
    }

    // Check valid EventAdmin
    const eventAdmin = await User.findById(eventAdminId);
    if (!eventAdmin || eventAdmin.role !== "eventAdmin") {
      return res.status(404).json({ success: false, message: "EventAdmin not found" });
    }

    // Check Event Exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    // Create if first time
    let assignment = await EventAssign.findOne({ eventAdminId });

    if (!assignment) {
      assignment = await EventAssign.create({
        eventAdminId,
        eventAdminName: eventAdmin.name,
        assignedEvents: [{ eventId, ...moduleFields }],
      });
    } else {
      // Check event already exists
      const exists = assignment.assignedEvents.some(
        (item) => item.eventId.toString() === eventId
      );

      if (!exists) {
        assignment.assignedEvents.push({ eventId, ...moduleFields });
        await assignment.save();
      } else {
        // Updating individual module fields
        const updateQuery = {};
        for (let key in moduleFields) {
          updateQuery[`assignedEvents.$[elem].${key}`] = moduleFields[key];
        }

        await EventAssign.updateOne(
          { eventAdminId },
          { $set: updateQuery },
          { arrayFilters: [{ "elem.eventId": eventId }] }
        );

        assignment = await EventAssign.findOne({ eventAdminId });
      }
    }

    res.json({
      success: true,
      message: "Event assigned successfully",
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



// =======================
// Update module permissions for assigned event
// =======================
export const updateAssignedEvent = async (req, res) => {
  try {
    const { eventAdminId, eventId, ...moduleFields } = req.body;

    const updateQuery = {};
    for (let key in moduleFields) {
      updateQuery[`assignedEvents.$[elem].${key}`] = moduleFields[key];
    }

    const updated = await EventAssign.findOneAndUpdate(
      { eventAdminId },
      { $set: updateQuery },
      {
        arrayFilters: [{ "elem.eventId": eventId }],
        new: true,
      }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Assignment record or event not found",
      });
    }

    res.json({
      success: true,
      message: "Permissions updated successfully",
      data: updated,
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
// Remove Assigned event from EventAdmin
// =======================
export const removeAssignedEvent = async (req, res) => {
  try {
    const { eventAdminId, eventId } = req.params;

    const updated = await EventAssign.findOneAndUpdate(
      { eventAdminId },
      { $pull: { assignedEvents: { eventId } } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Assignment record not found",
      });
    }

    res.json({
      success: true,
      message: "Event removed successfully",
      data: updated,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to remove event",
      error: error.message,
    });
  }
};
