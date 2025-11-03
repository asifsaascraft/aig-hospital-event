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
      workshopType,
      hallName,
      workshopRegistrationType,
      amount,
      maxRegAllowed,
      startDate,
      endDate,
      startTime,
      endTime,
      isEventRegistrationRequired,
    } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Validate workshopRegistrationType
    if (!["paid", "free"].includes(workshopRegistrationType.toLowerCase())) {
      return res.status(400).json({
        message: "Invalid Workshop Registration Type. Must be 'paid' or 'free'.",
      });
    }

    // Validate amount for paid workshops
    if (workshopRegistrationType.toLowerCase() === "paid" && (!amount || amount <= 0)) {
      return res
        .status(400)
        .json({ message: "Amount is required and must be greater than 0 for paid workshops." });
    }

    // Create new workshop
    const workshop = await Workshop.create({
      eventId,
      workshopName,
      workshopType,
      hallName,
      workshopRegistrationType,
      amount: workshopRegistrationType.toLowerCase() === "free" ? 0 : amount,
      maxRegAllowed,
      startDate,
      endDate,
      startTime,
      endTime,
      isEventRegistrationRequired,
    });

    res.status(201).json({
      success: true,
      message: "Workshop created successfully",
      data: workshop,
    });
  } catch (error) {
    console.error("Create workshop error:", error);
    res.status(500).json({ message: "Server Error" });
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
    const workshops = await Workshop.find({ eventId });

    const now = new Date();

    // Filter workshops still active based on endDate + endTime
    const activeWorkshops = workshops.filter((ws) => {
      try {
        const [day, month, year] = ws.endDate.split("/");
        const endDateTime = new Date(`${year}-${month}-${day} ${ws.endTime}`);
        return endDateTime > now;
      } catch {
        return false;
      }
    });

    res.status(200).json({
      success: true,
      message: "Active workshops fetched successfully",
      data: activeWorkshops,
    });
  } catch (error) {
    console.error("Get active workshops error:", error);
    res.status(500).json({ message: "Server Error" });
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
      workshopType,
      hallName,
      workshopRegistrationType,
      amount,
      maxRegAllowed,
      startDate,
      endDate,
      startTime,
      endTime,
      isEventRegistrationRequired,
    } = req.body;

    const workshop = await Workshop.findById(id);
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }

    // Update only provided fields
    if (workshopName) workshop.workshopName = workshopName;
    if (workshopType) workshop.workshopType = workshopType;
    if (hallName) workshop.hallName = hallName;
    if (workshopRegistrationType) {
      if (!["paid", "free"].includes(workshopRegistrationType.toLowerCase())) {
        return res.status(400).json({
          message: "Invalid Workshop Registration Type. Must be 'paid' or 'free'.",
        });
      }
      workshop.workshopRegistrationType = workshopRegistrationType;
      // Reset amount if free
      if (workshopRegistrationType.toLowerCase() === "free") {
        workshop.amount = 0;
      }
    }
    if (amount !== undefined) workshop.amount = amount;
    if (maxRegAllowed !== undefined) workshop.maxRegAllowed = maxRegAllowed;
    if (startDate) workshop.startDate = startDate;
    if (endDate) workshop.endDate = endDate;
    if (startTime) workshop.startTime = startTime;
    if (endTime) workshop.endTime = endTime;
    if (isEventRegistrationRequired !== undefined)
      workshop.isEventRegistrationRequired = isEventRegistrationRequired;

    await workshop.save();

    res.status(200).json({
      success: true,
      message: "Workshop updated successfully",
      data: workshop,
    });
  } catch (error) {
    console.error("Update workshop error:", error);
    res.status(500).json({ message: "Server Error" });
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
