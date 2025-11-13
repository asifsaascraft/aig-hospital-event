import Workshop from "../models/Workshop.js";
import Event from "../models/Event.js";
import WorkshopRegistration from "../models/WorkshopRegistration.js";
import sendEmailWithTemplate from "../utils/sendEmail.js";
/* 
========================================================
  1️ Register user for workshops (User)
========================================================
  @route   POST /api/workshops/events/:eventId/workshop-register
  @access  Protected (user)
========================================================
*/
export const registerForWorkshops = async (req, res) => {
  try {
    const user = req.user; // to access name and email for sending email
    const userId = req.user._id;
    const { eventId } = req.params;
    const { workshopIds } = req.body; // array of workshop IDs

    // Validate event
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

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
        "workshops.workshopIds": ws._id,
        eventId,
        registrationType,
      });

      if (regCount >= ws.maxRegAllowed) {
        return res.status(400).json({
          message: `Registration limit reached for workshop: ${ws.workshopName}`,
        });
      }
    }

    // Create registration record with nested workshops
    const registration = await WorkshopRegistration.create({
      eventId,
      userId,
      workshops: workshopIds.map((id) => ({ workshopIds: id, isSuspended: false })),
      registrationType,
      totalAmount,
      paymentStatus: registrationType === "Free" ? "Completed" : "Pending",
    });

    /* ============================================================
        Send Email Notification (Only for Free Workshop)
       - send structured array `workshopList` 
       - set `ifMultiple` to "s" or "" so template prints Workshop vs Workshops
    ============================================================ */
    if (registrationType === "Free") {
      try {
        // Build structured workshop list for template
        const workshopList = workshops.map((ws) => ({
          workshopName: ws.workshopName || "",
          hallName: ws.hallName || "",
          startDate: ws.startDate || "",
          startTime: ws.startTime || "",
          endDate: ws.endDate || "",
          endTime: ws.endTime || "",
        }));

        const displayName =
          user.name ||
          [user.fname, user.mname, user.lname].filter(Boolean).join(" ").trim() ||
          "Participant";

        const registrationDate = new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

        const ifMultiple = workshopList.length > 1 ? "s" : "";

        const mergeInfo = {
          name: displayName,
          eventName: event.eventName || "",
          registrationDate,
          workshopList, // array expected by your ZeptoMail template
          ifMultiple, // "s" or ""
        };

        await sendEmailWithTemplate({
          to: user.email,
          name: displayName,
          templateKey: "2518b.554b0da719bc314.k1.d03e4850-ba2e-11f0-87d4-ae9c7e0b6a9f.19a53799155",
          mergeInfo,
        });
      } catch (emailErr) {
        // Log email error but do not block registration success
        console.error("Error sending Free Workshop email:", emailErr);
      }
    }

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

/* 
========================================================
  2️ Get completed workshop registrations for specific event
========================================================
  @route   GET /api/workshops/my-registrations/event/:eventId
  @access  Protected (user)
========================================================
*/
export const getUserWorkshopRegistrationsByEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const registrations = await WorkshopRegistration.find({
      userId,
      eventId,
      paymentStatus: "Completed",
      "workshops.isSuspended": false,
    })
      .populate("eventId")
      .populate("workshops.workshopIds")
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

/* 
========================================================
  3️ Get all valid workshop registrations for an event (Event Admin)
========================================================
  @route   GET /api/workshops/event-admin/events/:eventId/workshop-registrations
  @access  Protected (eventAdmin)
========================================================
*/
export const getAllWorkshopRegistrationsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

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
        path: "workshops.workshopIds",
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
