// controllers/workshopController.js
import Workshop from "../models/Workshop.js";
import Event from "../models/Event.js";

// =======================
// Create Workshop (EventAdmin Only)
// =======================
export const createWorkshop = async (req, res) => {
  try {
    const { eventId } = req.params;

    const {
      workshopName,
      workshopCategory,
      hallName,
      workshopRegistrationType,
      amount,
      maxRegAllowed,
      startDateTime,
      endDateTime,
      isEventRegistrationRequired,
      status,
    } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // Validate workshopRegistrationType
    if (!["Paid", "Free"].includes(workshopRegistrationType)) {
      return res.status(400).json({
        message:
          "Invalid Workshop Registration Type. Must be 'Paid' or 'Free'.",
      });
    }

    // Validate amount
    if (
      workshopRegistrationType === "Paid" &&
      (!amount || amount <= 0)
    ) {
      return res.status(400).json({
        message:
          "Amount is required and must be greater than 0 for paid workshops.",
      });
    }

    // Validate dates
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

    // Create workshop
    const workshop = await Workshop.create({
      eventId,
      workshopName,
      workshopCategory,
      hallName,
      workshopRegistrationType,
      amount:
        workshopRegistrationType === "Free"
          ? 0
          : amount,
      maxRegAllowed,
      startDateTime: parsedStartDateTime,
      endDateTime: parsedEndDateTime,
      isEventRegistrationRequired,
      status: status || "Active",
    });

    res.status(201).json({
      success: true,
      message: "Workshop created successfully",
      data: workshop,
    });

  } catch (error) {
    console.error("Create workshop error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Get All Workshops by Event ID (Public/User)
// =======================
export const getWorkshopsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const workshops = await Workshop.find({ eventId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Workshops fetched successfully",
      data: workshops,
    });
  } catch (error) {
    console.error("Get workshops error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get Active (Upcoming) Workshops for Users
// =======================
export const getActiveWorkshopsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const now = new Date();

    const workshops = await Workshop.find({
      eventId,
      status: "Active",
      endDateTime: { $gte: now },
    }).sort({ startDateTime: 1 });

    res.status(200).json({
      success: true,
      message: "Active workshops fetched successfully",
      data: workshops,
    });

  } catch (error) {
    console.error("Get active workshops error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Update Workshop (EventAdmin Only)
// =======================
export const updateWorkshop = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      workshopName,
      workshopCategory,
      hallName,
      workshopRegistrationType,
      amount,
      maxRegAllowed,
      startDateTime,
      endDateTime,
      isEventRegistrationRequired,
      status,
    } = req.body;

    const workshop = await Workshop.findById(id);

    if (!workshop) {
      return res.status(404).json({
        message: "Workshop not found",
      });
    }

    // Registration type validation
    if (
      workshopRegistrationType &&
      !["Paid", "Free"].includes(workshopRegistrationType)
    ) {
      return res.status(400).json({
        message:
          "Invalid Workshop Registration Type. Must be 'Paid' or 'Free'.",
      });
    }

    // Date validations
    if (
      startDateTime &&
      isNaN(new Date(startDateTime))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid startDateTime format",
      });
    }

    if (
      endDateTime &&
      isNaN(new Date(endDateTime))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid endDateTime format",
      });
    }

    // Update fields
    if (workshopName)
      workshop.workshopName = workshopName;

    if (workshopCategory)
      workshop.workshopCategory = workshopCategory;

    if (hallName)
      workshop.hallName = hallName;

    if (workshopRegistrationType) {
      workshop.workshopRegistrationType =
        workshopRegistrationType;

      if (workshopRegistrationType === "Free") {
        workshop.amount = 0;
      }
    }

    if (amount !== undefined)
      workshop.amount = amount;

    if (maxRegAllowed !== undefined)
      workshop.maxRegAllowed = maxRegAllowed;

    if (startDateTime) {
      workshop.startDateTime =
        new Date(startDateTime);
    }

    if (endDateTime) {
      workshop.endDateTime =
        new Date(endDateTime);
    }

    // Final validation
    if (
      workshop.startDateTime &&
      workshop.endDateTime &&
      workshop.endDateTime < workshop.startDateTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "End date time must be greater than or equal to start date time",
      });
    }

    if (isEventRegistrationRequired !== undefined) {
      workshop.isEventRegistrationRequired =
        isEventRegistrationRequired;
    }

    if (status !== undefined)
      workshop.status = status;

    await workshop.save();

    res.status(200).json({
      success: true,
      message: "Workshop updated successfully",
      data: workshop,
    });

  } catch (error) {
    console.error("Update workshop error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Delete Workshop (EventAdmin Only)
// =======================
export const deleteWorkshop = async (req, res) => {
  try {
    const { id } = req.params;

    const workshop = await Workshop.findById(id);
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }

    await workshop.deleteOne();

    res.status(200).json({
      success: true,
      message: "Workshop deleted successfully",
    });
  } catch (error) {
    console.error("Delete workshop error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
