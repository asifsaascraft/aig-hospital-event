// controllers/eventController.js
import Event from "../models/Event.js";

// =======================
// Get all events (public)
// =======================
export const getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("organizer department venueName")
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
// Get all live events (public)
// =======================
export const getLiveEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("organizer department venueName")
      .sort({ startDate: 1 }); // sort by start date ascending

    // Filter events where dynamicStatus is "Live" or "Running"
    const liveEvents = events
      .map((e) => e.toObject({ virtuals: true }))
      .filter((e) => e.dynamicStatus === "Live" || e.dynamicStatus === "Running");

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
      "organizer department venueName"
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
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Event image is required" });
    }

    const eventData = {
      ...req.body,
      eventImage: req.file.location,
    };

    const newEvent = await Event.create(eventData);

    res
      .status(201)
      .json({ success: true, data: newEvent.toObject({ virtuals: true }) });
  } catch (error) {
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

    const updatedData = { ...req.body };
    if (req.file) updatedData.eventImage = req.file.location;

    const updatedEvent = await Event.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedEvent) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    res.json({ success: true, data: updatedEvent.toObject({ virtuals: true }) });
  } catch (error) {
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
