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

      arrivalPickupPoint,
      arrivalPickupPointType,
      arrivalPickupDateTime,
      arrivalDropOffPoint,

      departurePickupPoint,
      departurePickupPointType,
      departurePickupDateTime,
      departureDropOffPoint,
    } = req.body;
    
    // Date validation format
    if (isNaN(new Date(arrivalPickupDateTime))) {
      return res.status(400).json({
        message: "Invalid arrival pickup datetime format",
      });
    }

    if (isNaN(new Date(departurePickupDateTime))) {
      return res.status(400).json({
        message: "Invalid departure pickup datetime format",
      });
    }

    // Validate required refs
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const registration = await EventRegistration.findById(eventRegistrationId);
    if (!registration)
      return res.status(404).json({ message: "Event registration not found" });

    // =======================
    // CHECK DUPLICATE BOOKING
    // =======================
    const existingTravel = await Travel.findOne({
      eventId,
      eventRegistrationId,
    });

    if (existingTravel) {
      return res.status(400).json({
        success: false,
        message: "Travel already booked for this registration",
      });
    }

    const agent = await TravelAgent.findById(travelAgentId);
    if (!agent)
      return res.status(404).json({ message: "Travel agent not found" });

    const travel = await Travel.create({
      eventId,
      eventRegistrationId,
      travelAgentId,

      arrivalPickupPoint,
      arrivalPickupPointType,
      arrivalPickupDateTime,
      arrivalDropOffPoint,

      departurePickupPoint,
      departurePickupPointType,
      departurePickupDateTime,
      departureDropOffPoint,

      createdBy: "eventAdmin",
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
      .populate({
        path: "eventRegistrationId",
        populate: {
          path: "registrationSlabId",
          select: "slabName",
        },
      })
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

      arrivalPickupPoint,
      arrivalPickupPointType,
      arrivalPickupDateTime,
      arrivalDropOffPoint,

      departurePickupPoint,
      departurePickupPointType,
      departurePickupDateTime,
      departureDropOffPoint,
    } = req.body;

    // =======================
    // CHECK DUPLICATE BOOKING
    // =======================
    if (eventRegistrationId) {
      const existingTravel = await Travel.findOne({
        eventId: travel.eventId,
        eventRegistrationId,
        _id: { $ne: id }, // exclude current record
      });

      if (existingTravel) {
        return res.status(400).json({
          success: false,
          message: "Travel already booked for this registration",
        });
      }
    }

    if (eventRegistrationId) travel.eventRegistrationId = eventRegistrationId;
    if (travelAgentId) travel.travelAgentId = travelAgentId;

    if (arrivalPickupPoint) travel.arrivalPickupPoint = arrivalPickupPoint;
    if (arrivalPickupPointType) travel.arrivalPickupPointType = arrivalPickupPointType;
    if (arrivalPickupDateTime) travel.arrivalPickupDateTime = arrivalPickupDateTime;
    if (arrivalDropOffPoint) travel.arrivalDropOffPoint = arrivalDropOffPoint;

    if (departurePickupPoint) travel.departurePickupPoint = departurePickupPoint;
    if (departurePickupPointType) travel.departurePickupPointType = departurePickupPointType;
    if (departurePickupDateTime) travel.departurePickupDateTime = departurePickupDateTime;
    if (departureDropOffPoint) travel.departureDropOffPoint = departureDropOffPoint;

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
