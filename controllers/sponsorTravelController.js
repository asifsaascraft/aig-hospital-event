// controllers/travelController.js
import Travel from "../models/Travel.js";
import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";
import TravelAgent from "../models/TravelAgent.js";
import SponsorTravelQuota from "../models/SponsorTravelQuota.js";

// =======================
// Create Travel (Sponsor Only)
// =======================
export const createTravelBySponsor = async (req, res) => {
  try {
    const sponsorId = req.sponsor._id;
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

    // =======================
    //  BASIC VALIDATION
    // =======================
    if (
      !eventRegistrationId ||
      !travelAgentId ||
      !pickupPoint ||
      !pickupPointType ||
      !date ||
      !time ||
      !dropPoint
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // =======================
    //  CHECK EVENT
    // =======================
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // =======================
    //  CHECK EVENT REGISTRATION
    // =======================
    const registration = await EventRegistration.findById(eventRegistrationId);
    if (!registration) {
      return res.status(404).json({
        message: "Event registration not found",
      });
    }

    // =======================
    // CHECK DUPLICATE BOOKING
    // =======================
    const existingTravel = await Travel.findOne({
      eventId,
      eventRegistrationId,
    });

    if (existingTravel) {
      return res.status(400).json({
        message: "Travel already booked for this registration",
      });
    }

    // =======================
    //  CHECK TRAVEL AGENT
    // =======================
    const agent = await TravelAgent.findById(travelAgentId);
    if (!agent) {
      return res.status(404).json({
        message: "Travel agent not found",
      });
    }

    // =======================
    //  QUOTA CHECK
    // =======================
    const quotaData = await SponsorTravelQuota.findOne({
      eventId,
      sponsorId,
      status: "Active",
    });

    if (!quotaData) {
      return res.status(403).json({
        message: "No travel quota assigned to this sponsor",
      });
    }

    // =======================
    //  DATE VALIDATION
    // =======================
    const travelDate = new Date(date.split("/").reverse().join("-"));

    //  Start Date Check
    if (quotaData.startDate && travelDate < quotaData.startDate) {
      return res.status(400).json({
        message: `Travel cannot be booked before ${quotaData.startDate.toDateString()}`,
      });
    }

    //  End Date Check
    if (quotaData.endDate && travelDate > quotaData.endDate) {
      return res.status(400).json({
        message: `Travel cannot be booked after ${quotaData.endDate.toDateString()}`,
      });
    }

    // =======================
    //  QUOTA LIMIT CHECK
    // =======================
    const usedQuota = await Travel.countDocuments({
      eventId,
      sponsorId,
      createdBy: "sponsor",
    });

    if (usedQuota >= quotaData.quota) {
      return res.status(400).json({
        message: "Travel quota exceeded",
      });
    }

    // =======================
    //  CREATE TRAVEL
    // =======================
    const travel = await Travel.create({
      eventId,
      eventRegistrationId,
      travelAgentId,
      pickupPoint,
      pickupPointType,
      date,
      time,
      dropPoint,
      sponsorId,
      createdBy: "sponsor",
    });

    res.status(201).json({
      success: true,
      message: "Travel created by sponsor successfully",
      data: travel,
    });
  } catch (error) {
    console.error("Sponsor create travel error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Sponsor Travel Bookings by Specific Sponsor
// =======================
export const getTravelBySponsor = async (req, res) => {
  try {
    const sponsorId = req.sponsor._id;
    const { eventId } = req.params;

    const travels = await Travel.find({
      eventId,
      sponsorId,
      createdBy: "sponsor",
    })
      .populate("travelAgentId")
      .populate({
        path: "eventRegistrationId",
        populate: {
          path: "registrationSlabId",
          select: "slabName",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Sponsor travel fetched successfully",
      data: travels,
    });
  } catch (error) {
    console.error("Sponsor get travel error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Travel (Sponsor Only)
// =======================
export const updateTravelBySponsor = async (req, res) => {
  try {
    const sponsorId = req.sponsor._id;
    const { id } = req.params;

    const travel = await Travel.findOne({
      _id: id,
      sponsorId,
      createdBy: "sponsor",
    });

    if (!travel) {
      return res.status(404).json({
        message: "Travel not found or not authorized",
      });
    }

    // =======================
    // CHECK DUPLICATE
    // =======================
    if (req.body.eventRegistrationId) {
      const existingTravel = await Travel.findOne({
        eventId: travel.eventId,
        eventRegistrationId: req.body.eventRegistrationId,
        _id: { $ne: id },
      });

      if (existingTravel) {
        return res.status(400).json({
          message: "Travel already booked for this registration",
        });
      }
    }

    Object.assign(travel, req.body);

    await travel.save();

    res.status(200).json({
      success: true,
      message: "Sponsor travel updated",
      data: travel,
    });
  } catch (error) {
    console.error("Sponsor update error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ======================================
// GET SPONSOR TRAVEL QUOTA SUMMARY (Sponsor Only)
// ======================================
export const getSponsorTravelQuotaSummary = async (req, res) => {
  try {
    const sponsorId = req.sponsor._id;
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required",
      });
    }

    // ===============================
    //  Step 1: Fetch quota record
    // ===============================
    const quotaRecord = await SponsorTravelQuota.findOne({
      sponsorId,
      eventId,
    });

    if (!quotaRecord) {
      return res.status(404).json({
        success: false,
        message: "No travel quota assigned for this sponsor",
      });
    }

    // ===============================
    //  Step 2: Count used travel
    // ===============================
    const usedTravel = await Travel.countDocuments({
      sponsorId,
      eventId,
      createdBy: "sponsor",
    });

    // ===============================
    //  Step 3: Calculate remaining
    // ===============================
    const remaining = Math.max(quotaRecord.quota - usedTravel, 0);

    // ===============================
    //  Step 4: Response
    // ===============================
    return res.status(200).json({
      success: true,
      message: "Sponsor travel quota summary fetched successfully",
      data: {
        sponsorId,
        eventId,
        totalQuota: quotaRecord.quota,
        usedTravel,
        remainingQuota: remaining,
        startDate: quotaRecord.startDate,
        endDate: quotaRecord.endDate,
        status: quotaRecord.status,
      },
    });
  } catch (error) {
    console.error("Get Sponsor Travel Quota Summary error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching travel quota summary",
    });
  }
};
