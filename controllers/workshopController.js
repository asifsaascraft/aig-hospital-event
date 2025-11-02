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
      amount,
      maxRegAllowed,
      startDate,
      endDate,
      isEventRegistrationRequired,
    } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Create new workshop
    const workshop = await Workshop.create({
      eventId,
      workshopName,
      workshopType,
      hallName,
      amount,
      maxRegAllowed,
      startDate,
      endDate,
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
// Update Workshop (EventAdmin Only)
// =======================
export const updateWorkshop = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      workshopName,
      workshopType,
      hallName,
      amount,
      maxRegAllowed,
      startDate,
      endDate,
      isEventRegistrationRequired,
    } = req.body;

    // Find existing workshop
    const workshop = await Workshop.findById(id);
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }

    // Update fields only if provided
    if (workshopName) workshop.workshopName = workshopName;
    if (workshopType) workshop.workshopType = workshopType;
    if (hallName) workshop.hallName = hallName;
    if (amount !== undefined) workshop.amount = amount;
    if (maxRegAllowed !== undefined) workshop.maxRegAllowed = maxRegAllowed;
    if (startDate) workshop.startDate = startDate;
    if (endDate) workshop.endDate = endDate;
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
