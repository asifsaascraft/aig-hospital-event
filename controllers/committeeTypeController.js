import CommitteeType from "../models/CommitteeType.js";
import Event from "../models/Event.js";

// =======================
// Create Committee Type (EventAdmin Only)
// =======================
export const createCommitteeType = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { committeeType, status } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Create Committee Type
    const committee = await CommitteeType.create({
      eventId,
      committeeType,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Committee Type created successfully",
      data: committee,
    });
  } catch (error) {
    console.error("Create Committee Type Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Committee Types by Event
// =======================
export const getCommitteeTypesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const committeeTypes = await CommitteeType.find({
      eventId,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Committee Types fetched successfully",
      data: committeeTypes,
    });
  } catch (error) {
    console.error("Get Committee Types Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get Active Committee Types
// =======================
export const getActiveCommitteeTypesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const committeeTypes = await CommitteeType.find({
      eventId,
      status: "Active",
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Active Committee Types fetched successfully",
      data: committeeTypes,
    });
  } catch (error) {
    console.error("Get Active Committee Types Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Committee Type
// =======================
export const updateCommitteeType = async (req, res) => {
  try {
    const { id } = req.params;
    const { committeeType, status } = req.body;

    const committee = await CommitteeType.findById(id);

    if (!committee) {
      return res.status(404).json({
        message: "Committee Type not found",
      });
    }

    if (committeeType) committee.committeeType = committeeType;
    if (status) committee.status = status;

    await committee.save();

    res.status(200).json({
      success: true,
      message: "Committee Type updated successfully",
      data: committee,
    });
  } catch (error) {
    console.error("Update Committee Type Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Committee Type
// =======================
export const deleteCommitteeType = async (req, res) => {
  try {
    const { id } = req.params;

    const committee = await CommitteeType.findById(id);

    if (!committee) {
      return res.status(404).json({
        message: "Committee Type not found",
      });
    }

    await committee.deleteOne();

    res.status(200).json({
      success: true,
      message: "Committee Type deleted successfully",
    });
  } catch (error) {
    console.error("Delete Committee Type Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};