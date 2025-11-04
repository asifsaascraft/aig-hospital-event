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
      workshopIds,
      registrationType,
      totalAmount,
      paymentStatus: registrationType === "Free" ? "Completed" : "Pending",
    });

    // Future: payment handling for Paid workshops can be added here

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
// Get all COMPLETED workshop registrations for logged-in user
// =======================
export const getUserWorkshopRegistrations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch only completed workshop registrations
    const registrations = await WorkshopRegistration.find({
      userId,
      paymentStatus: "Completed",
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
    console.error("Get user workshop registrations error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

