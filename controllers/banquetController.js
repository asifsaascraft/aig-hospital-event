import Banquet from "../models/Banquet.js";
import Event from "../models/Event.js";

// =======================
// Create Banquet (EventAdmin Only)
// =======================
export const createBanquet = async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      banquetslabName,
      amount,
      startDateTime,
      endDateTime,
      status,
    } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // VALIDATION Dates
    if (startDateTime && isNaN(new Date(startDateTime))) {
      return res.status(400).json({
        success: false,
        message: "Invalid startDateTime format",
      });
    }

    if (endDateTime && isNaN(new Date(endDateTime))) {
      return res.status(400).json({
        success: false,
        message: "Invalid endDateTime format",
      });
    }

    // Convert dates
    const parsedStartDateTime = new Date(startDateTime);
    const parsedEndDateTime = new Date(endDateTime);

    // End validation
    if (parsedEndDateTime < parsedStartDateTime) {
      return res.status(400).json({
        success: false,
        message:
          "End date time must be greater than or equal to start date time",
      });
    }

    // Create new banquet
    const banquet = await Banquet.create({
      eventId,
      banquetslabName,
      amount,
      startDateTime: parsedStartDateTime,
      endDateTime: parsedEndDateTime,
      status: status || "Active",
    });

    res.status(201).json({
      success: true,
      message: "Banquet created successfully",
      data: banquet,
    });
  } catch (error) {
    console.error("Create banquet error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Banquets by Event ID (Public/User)
// =======================
export const getBanquetsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const banquets = await Banquet.find({ eventId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Banquets fetched successfully",
      data: banquets,
    });
  } catch (error) {
    console.error("Get banquets error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get Active Banquets where endDate >= Today
// =======================
export const getActiveBanquetsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const now = new Date();

    const banquets = await Banquet.find({
      eventId,
      status: "Active",
      endDateTime: { $gte: now },
    }).sort({ startDateTime: 1 });

    res.status(200).json({
      success: true,
      message: "Active and non-expired banquets fetched successfully",
      data: banquets,
    });

  } catch (error) {
    console.error("Get active banquets error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};


// =======================
// Update Banquet (EventAdmin Only)
// =======================
export const updateBanquet = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      banquetslabName,
      amount,
      startDateTime,
      endDateTime,
      status,
    } = req.body;

    // Find existing banquet
    const banquet = await Banquet.findById(id);
    if (!banquet) {
      return res.status(404).json({ message: "Banquet not found" });
    }

    // VALIDATION Dates
    if (startDateTime && isNaN(new Date(startDateTime))) {
      return res.status(400).json({
        success: false,
        message: "Invalid startDateTime format",
      });
    }

    if (endDateTime && isNaN(new Date(endDateTime))) {
      return res.status(400).json({
        success: false,
        message: "Invalid endDateTime format",
      });
    }

    // Update fields only if provided
    if (banquetslabName) banquet.banquetslabName = banquetslabName;
    if (amount !== undefined) banquet.amount = amount;

    if (startDateTime) {
      banquet.startDateTime = new Date(startDateTime);
    }

    if (endDateTime) {
      banquet.endDateTime = new Date(endDateTime);
    }
    if (status !== undefined) banquet.status = status;

    // Final validation
    if (
      banquet.startDateTime &&
      banquet.endDateTime &&
      banquet.endDateTime < banquet.startDateTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "End date time must be greater than or equal to start date time",
      });
    }

    await banquet.save();

    res.status(200).json({
      success: true,
      message: "Banquet updated successfully",
      data: banquet,
    });
  } catch (error) {
    console.error("Update banquet error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Banquet (EventAdmin Only)
// =======================
export const deleteBanquet = async (req, res) => {
  try {
    const { id } = req.params;

    const banquet = await Banquet.findById(id);
    if (!banquet) {
      return res.status(404).json({ message: "Banquet not found" });
    }

    await banquet.deleteOne();

    res.status(200).json({
      success: true,
      message: "Banquet deleted successfully",
    });
  } catch (error) {
    console.error("Delete banquet error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
