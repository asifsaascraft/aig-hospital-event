import Workshop from "../models/Workshop.js";
import Event from "../models/Event.js";
import WorkshopRegistration from "../models/WorkshopRegistration.js";

// =======================
// Register user for workshops (User)
// =======================
export const registerForWorkshops = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;
    const { workshopIds } = req.body; // array of workshop IDs

    // Validate event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Validate input
    if (!Array.isArray(workshopIds) || workshopIds.length === 0) {
      return res.status(400).json({ message: "Workshop IDs are required" });
    }


    // Fetch workshops
    const workshops = await Workshop.find({ _id: { $in: workshopIds }, eventId });

    if (workshops.length !== workshopIds.length) {
      return res.status(400).json({ message: "One or more workshops not found for this event" });
    }

    // Ensure all workshops are of same registration type (Paid or Free)
    const types = [...new Set(workshops.map((ws) => ws.workshopRegistrationType))];
    if (types.length > 1) {
      return res.status(400).json({
        message: "You can only register for either all Paid or all Free workshops at once.",
      });
    }

    const registrationType = types[0];
    let totalAmount = 0;

    // Calculate total for paid workshops
    if (registrationType === "Paid") {
      totalAmount = workshops.reduce((sum, ws) => sum + (ws.amount || 0), 0);
    }

    // Check max registration limit for each workshop
    for (const ws of workshops) {
      const regCount = await WorkshopRegistration.countDocuments({
        workshopIds: ws._id,
        registrationType,
        eventId,
      });

      if (regCount >= ws.maxRegAllowed) {
        return res.status(400).json({
          message: `Registration limit reached for workshop: ${ws.workshopName}`,
        });
      }
    }

    // Create registration record
    const registration = await WorkshopRegistration.create({
      eventId,
      userId,
      workshops: workshopIds.map((id) => ({ workshopIds: id, isSuspended: false })),
      registrationType,
      totalAmount,
      paymentStatus: registrationType === "Free" ? "Completed" : "Pending",
    });
    

    res.status(201).json({
      success: true,
      message: "Workshop registration successful",
      data: registration,
    });
  } catch (error) {
    console.error("Register workshop error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// Get completed workshop registrations for specific event
// =======================
export const getUserWorkshopRegistrationsByEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;

    // Validate event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Fetch completed workshop registrations for this event
    const registrations = await WorkshopRegistration.find({
      userId,
      eventId,
      paymentStatus: "Completed",
      isSuspended: false
    })
      .populate("eventId")
      .populate("workshopIds")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Completed workshop registrations fetched successfully",
      data: registrations,
    });
  } catch (error) {
    console.error("Get user workshop registrations by event error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// Get All Valid Workshop Registrations for an Event (Event Admin)
// =======================
export const getAllWorkshopRegistrationsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Validate event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Fetch all valid workshop registrations:
    // Include:
    // - Free workshops (always)
    // - Paid workshops where paymentStatus is Completed
    const registrations = await WorkshopRegistration.find({
      eventId,
      $or: [
        { registrationType: "Free" },
        { registrationType: "Paid", paymentStatus: "Completed" },
      ],
    })
      .populate({
        path: "userId",
        select: "prefix name email mobile gender",
      })
      .populate({
        path: "workshopIds",
        select: "workshopName amount workshopRegistrationType",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "All valid workshop registrations fetched successfully",
      event: { id: event._id, name: event.eventName },
      totalRegistrations: registrations.length,
      data: registrations,
    });
  } catch (error) {
    console.error("Get all workshop registrations by event error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* 
========================================================
  4️ Update Suspension Status of a Single Workshop (Event Admin)
========================================================
  @route   PATCH /api/workshops/event-admin/:registrationId/suspend/:subId
  @access  Protected (eventAdmin)
========================================================
*/
export const updateWorkshopSuspension = async (req, res) => {
  try {
    const { registrationId, subId } = req.params;
    const { isSuspended } = req.body;

    if (typeof isSuspended !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Invalid value for isSuspended. Must be true or false.",
      });
    }

    const registration = await WorkshopRegistration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ success: false, message: "Workshop registration not found" });
    }

    const workshopSub = registration.workshops.id(subId);
    if (!workshopSub) {
      return res.status(404).json({ success: false, message: "Workshop entry not found" });
    }

    workshopSub.isSuspended = isSuspended;
    await registration.save();

    res.status(200).json({
      success: true,
      message: `Workshop entry ${isSuspended ? "suspended" : "unsuspended"} successfully`,
      data: workshopSub,
    });
  } catch (error) {
    console.error("Update workshop suspension error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
