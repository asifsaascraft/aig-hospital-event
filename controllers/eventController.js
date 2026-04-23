// controllers/eventController.js
import Event from "../models/Event.js";

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
// Get all live and upcomming events (public)
// =======================
export const getLiveEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("organizer department venueName groupName")
      .sort({ startDate: 1 }); // sort by start date ascending

    // Filter events where dynamicStatus is "Live" or "Upcomming"
    const liveEvents = events
      .map((e) => e.toObject({ virtuals: true }))
      .filter(
        (e) => e.dynamicStatus === "Upcoming" || e.dynamicStatus === "Live",
      );

    res.json({
      success: true,
      data: liveEvents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch live events",
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

    //  VALIDATION Dates
    if (eventData.startDate && isNaN(new Date(eventData.startDate))) {
      return res.status(400).json({
        success: false,
        message: "Invalid startDate format",
      });
    }

    if (eventData.endDate && isNaN(new Date(eventData.endDate))) {
      return res.status(400).json({
        success: false,
        message: "Invalid endDate format",
      });
    }

    // Convert dates
    if (eventData.startDate) {
      eventData.startDate = new Date(eventData.startDate);
    }

    if (eventData.endDate) {
      eventData.endDate = new Date(eventData.endDate);
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

    //  VALIDATION Dates
    if (updatedData.startDate && isNaN(new Date(updatedData.startDate))) {
      return res.status(400).json({
        success: false,
        message: "Invalid startDate format",
      });
    }

    if (updatedData.endDate && isNaN(new Date(updatedData.endDate))) {
      return res.status(400).json({
        success: false,
        message: "Invalid endDate format",
      });
    }

    //  convert Dates
    if (updatedData.startDate) {
      updatedData.startDate = new Date(updatedData.startDate);
    }

    if (updatedData.endDate) {
      updatedData.endDate = new Date(updatedData.endDate);
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
