import EventGroup from "../models/EventGroup.js";

// =======================
// Get all event groups (public)
// =======================
export const getEventGroups = async (req, res) => {
  try {
    const groups = await EventGroup.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch event groups",
      error: error.message,
    });
  }
};

// =======================
// Get only ACTIVE event groups (public)
// =======================
export const getActiveEventGroups = async (req, res) => {
  try {
    const groups = await EventGroup.find({ status: "Active" })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch active event groups",
      error: error.message,
    });
  }
};

// =======================
// Create event group (admin only)
// =======================
export const createEventGroup = async (req, res) => {
  try {
    const { groupName, status } = req.body;

    // validation
    if (!groupName) {
      return res.status(400).json({
        success: false,
        message: "Group name is required",
      });
    }

    // prevent duplicate group name
    const existingGroup = await EventGroup.findOne({ groupName });
    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: "Group already exists",
      });
    }

    const group = await EventGroup.create({
      groupName,
      status,
    });

    res.status(201).json({
      success: true,
      data: group,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create event group",
      error: error.message,
    });
  }
};

// =======================
// Update event group (admin only)
// =======================
export const updateEventGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { groupName, status } = req.body;

    // check duplicate name (excluding current)
    if (groupName) {
      const existingGroup = await EventGroup.findOne({
        groupName,
        _id: { $ne: id },
      });

      if (existingGroup) {
        return res.status(400).json({
          success: false,
          message: "Group name already exists",
        });
      }
    }

    const group = await EventGroup.findByIdAndUpdate(
      id,
      { groupName, status },
      { new: true, runValidators: true }
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Event group not found",
      });
    }

    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update event group",
      error: error.message,
    });
  }
};

// =======================
// Delete event group (admin only)
// =======================
export const deleteEventGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await EventGroup.findByIdAndDelete(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Event group not found",
      });
    }

    res.json({
      success: true,
      message: "Event group deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete event group",
      error: error.message,
    });
  }
};