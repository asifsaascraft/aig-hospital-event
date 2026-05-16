// controllers/eventController.js
import Event from "../models/Event.js";
import EventVisitor from "../models/EventVisitor.js";
import EventRegistration from "../models/EventRegistration.js";

// =======================
// Get all events (public)
// =======================
export const getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("organizer department venueName groupName")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: events.map((e) => e.toObject({ virtuals: true })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
      error: error.message,
    });
  }
};


// =======================
// Get only active events (public)
// =======================
export const getActiveEvents = async (req, res) => {
  try {
    const events = await Event.find({ isActive: true })
      .populate("organizer department venueName groupName")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: events.map((e) => e.toObject({ virtuals: true })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch active events",
      error: error.message,
    });
  }
};

// =======================
// Get single event (public)
// =======================
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id).populate(
      "organizer department venueName groupName",
    );
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }
    res.json({ success: true, data: event.toObject({ virtuals: true }) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch event",
      error: error.message,
    });
  }
};

// =======================
// Create event (admin only)
// =======================
export const createEvent = async (req, res) => {
  try {
    const { shortName } = req.body;

    //  Check required files
    if (!req.files?.eventImage || !req.files?.brochureUpload) {
      return res.status(400).json({
        success: false,
        message: "Event Image and Brochure PDF are required",
      });
    }

    // Check shortName uniqueness
    const existingEvent = await Event.findOne({ shortName });

    if (existingEvent) {
      return res.status(400).json({
        success: false,
        message: "Short Name already exists. Please use a unique Short Name.",
      });
    }

    // Create event
    const eventData = {
      ...req.body,
      eventImage: req.files.eventImage[0].location,
      brochureUpload: req.files.brochureUpload[0].location,
    };

    // VALIDATION Dates
    if (eventData.startDateTime && isNaN(new Date(eventData.startDateTime))) {
      return res.status(400).json({
        success: false,
        message: "Invalid startDateTime format",
      });
    }

    if (eventData.endDateTime && isNaN(new Date(eventData.endDateTime))) {
      return res.status(400).json({
        success: false,
        message: "Invalid endDateTime format",
      });
    }

    // Convert dates
    if (eventData.startDateTime) {
      eventData.startDateTime = new Date(eventData.startDateTime);
    }

    if (eventData.endDateTime) {
      eventData.endDateTime = new Date(eventData.endDateTime);
    }

    if (
      eventData.startDateTime &&
      eventData.endDateTime &&
      eventData.endDateTime < eventData.startDateTime
    ) {
      return res.status(400).json({
        success: false,
        message: "End date time must be greater than start date time",
      });
    }

    const newEvent = await Event.create(eventData);

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: newEvent.toObject({ virtuals: true }),
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.shortName) {
      return res.status(400).json({
        success: false,
        message: "Short Name already exists. Please choose another one.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create event",
      error: error.message,
    });
  }
};

// =======================
// Update event (admin only)
// =======================
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const existingEvent = await Event.findById(id);
    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    //  Handle shortName uniqueness
    if (req.body.shortName) {
      const duplicate = await Event.findOne({
        shortName: req.body.shortName,
        _id: { $ne: id },
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Short Name already exists",
        });
      }
    }

    const updatedData = { ...req.body };

    // VALIDATION Dates
    if (updatedData.startDateTime && isNaN(new Date(updatedData.startDateTime))) {
      return res.status(400).json({
        success: false,
        message: "Invalid startDateTime format",
      });
    }

    if (updatedData.endDateTime && isNaN(new Date(updatedData.endDateTime))) {
      return res.status(400).json({
        success: false,
        message: "Invalid endDateTime format",
      });
    }

    // Convert Dates
    if (updatedData.startDateTime) {
      updatedData.startDateTime = new Date(updatedData.startDateTime);
    }

    if (updatedData.endDateTime) {
      updatedData.endDateTime = new Date(updatedData.endDateTime);
    }

    if (
      updatedData.startDateTime &&
      updatedData.endDateTime &&
      updatedData.endDateTime < updatedData.startDateTime
    ) {
      return res.status(400).json({
        success: false,
        message: "End date time must be greater than start date time",
      });
    }

    //  Normalize fields (VERY IMPORTANT)
    if (Array.isArray(updatedData.brochureUpload)) {
      updatedData.brochureUpload = updatedData.brochureUpload[0];
    }

    if (Array.isArray(updatedData.eventImage)) {
      updatedData.eventImage = updatedData.eventImage[0];
    }

    //  Handle file uploads (override body if new file uploaded)
    if (req.files?.eventImage?.[0]?.location) {
      updatedData.eventImage = req.files.eventImage[0].location;
    }

    if (req.files?.brochureUpload?.[0]?.location) {
      updatedData.brochureUpload = req.files.brochureUpload[0].location;
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: updatedEvent.toObject({ virtuals: true }),
    });
  } catch (error) {
    console.error("UPDATE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update event",
      error: error.message,
    });
  }
};

// =======================
// Update only isActive status (admin only)
// =======================
export const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Validate boolean
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { isActive },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.json({
      success: true,
      message: `Event ${
        isActive ? "activated" : "deactivated"
      } successfully`,
      data: updatedEvent.toObject({ virtuals: true }),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update event status",
      error: error.message,
    });
  }
};

// =======================
// Delete event (admin only)
// =======================
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    res.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete event",
      error: error.message,
    });
  }
};


// =======================
// Track Event Visit
// =======================
export const trackEventVisit = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: eventId } = req.params;

    // check event exists
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // check already registered
    const existingRegistration = await EventRegistration.findOne({
      userId,
      eventId,
      isPaid: true,
      isSuspended: false,
    });

    // if already registered then no need store visitor
    if (existingRegistration) {
      return res.status(200).json({
        success: true,
        message: "User already registered",
      });
    }

    // store only once
    await EventVisitor.findOneAndUpdate(
      {
        userId,
        eventId,
      },
      {
        userId,
        eventId,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Event visitor tracked successfully",
    });
  } catch (error) {
    console.error("Track visit error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};