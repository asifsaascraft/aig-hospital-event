// controllers/travelController.js
import Travel from "../models/Travel.js";
import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";
import TravelAgent from "../models/TravelAgent.js";

// =======================
// Create Travel (EventAdmin Only)
// =======================
export const createTravel = async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      eventRegistrationId,
      travelAgentId,
      pickupPoint,
      pickupPointType,
      date,
      time,
      dropPoint,
    } = req.body;

    // Validate required refs
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const registration = await EventRegistration.findById(eventRegistrationId);
    if (!registration)
      return res.status(404).json({ message: "Event registration not found" });

    const agent = await TravelAgent.findById(travelAgentId);
    if (!agent) return res.status(404).json({ message: "Travel agent not found" });

    const travel = await Travel.create({
      eventId,
      eventRegistrationId,
      travelAgentId,
      pickupPoint,
      pickupPointType,
      date,
      time,
      dropPoint,
    });

    res.status(201).json({
      success: true,
      message: "Travel booking created successfully",
      data: travel,
    });
  } catch (error) {
    console.error("Create travel error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Travel Bookings by Event ID
// =======================
export const getTravelByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const travels = await Travel.find({ eventId })
      .populate("eventRegistrationId")
      .populate("travelAgentId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Travel bookings fetched successfully",
      data: travels,
    });
  } catch (error) {
    console.error("Get travel error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Travel (EventAdmin Only)
// =======================
export const updateTravel = async (req, res) => {
  try {
    const { id } = req.params;

    const travel = await Travel.findById(id);
    if (!travel) {
      return res.status(404).json({ message: "Travel record not found" });
    }

    const {
      eventRegistrationId,
      travelAgentId,
      pickupPoint,
      pickupPointType,
      date,
      time,
      dropPoint,
    } = req.body;

    if (eventRegistrationId) travel.eventRegistrationId = eventRegistrationId;
    if (travelAgentId) travel.travelAgentId = travelAgentId;
    if (pickupPoint) travel.pickupPoint = pickupPoint;
    if (pickupPointType) travel.pickupPointType = pickupPointType;
    if (date) travel.date = date;
    if (time) travel.time = time;
    if (dropPoint) travel.dropPoint = dropPoint;

    await travel.save();

    res.status(200).json({
      success: true,
      message: "Travel record updated successfully",
      data: travel,
    });
  } catch (error) {
    console.error("Update travel error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Travel (EventAdmin Only)
// =======================
export const deleteTravel = async (req, res) => {
  try {
    const { id } = req.params;

    const travel = await Travel.findById(id);
    if (!travel) {
      return res.status(404).json({ message: "Travel record not found" });
    }

    await travel.deleteOne();

    res.status(200).json({
      success: true,
      message: "Travel record deleted successfully",
    });
  } catch (error) {
    console.error("Delete travel error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
