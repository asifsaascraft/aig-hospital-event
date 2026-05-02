import SponsorRegistrationQuota from "../models/SponsorRegistrationQuota.js";
import Event from "../models/Event.js";
import Sponsor from "../models/Sponsor.js";

// =======================
// Create Sponsor Registration Quota (EventAdmin Only)
// =======================
export const createSponsorRegistrationQuota = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { sponsorId, quota, startDateTime, endDateTime } = req.body;


    // ===============================
    // Required check
    // ===============================
    if (!startDateTime || !endDateTime) {
      return res.status(400).json({
        message: "Start and End date time are required",
      });
    }

    // ===============================
    // Validate format
    // ===============================
    if (isNaN(new Date(startDateTime))) {
      return res.status(400).json({
        message: "Invalid startDateTime format",
      });
    }

    if (isNaN(new Date(endDateTime))) {
      return res.status(400).json({
        message: "Invalid endDateTime format",
      });
    }

    // ===============================
    // Convert
    // ===============================
    const parsedStart = new Date(startDateTime);
    const parsedEnd = new Date(endDateTime);

    // ===============================
    // Compare
    // ===============================
    if (parsedEnd < parsedStart) {
      return res.status(400).json({
        message: "End date must be greater than or equal to start date",
      });
    }

    // Validate event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Validate sponsor
    const sponsor = await Sponsor.findById(sponsorId);
    if (!sponsor) {
      return res.status(404).json({ message: "Sponsor not found" });
    }

    //  Check if sponsorId already exists 
    const existingQuota = await SponsorRegistrationQuota.findOne({ sponsorId, eventId });
    if (existingQuota) {
      return res.status(400).json({
        success: false,
        message: "This sponsor already has a registration quota.",
      });
    }

    // Create quota record
    const newQuota = await SponsorRegistrationQuota.create({
      eventId,
      sponsorId,
      quota,
      startDateTime: parsedStart,
      endDateTime: parsedEnd,
    });

    res.status(201).json({
      success: true,
      message: "Sponsor registration quota created successfully",
      data: newQuota,
    });
  } catch (error) {
    console.error("Create Sponsor Registration Quota error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Quotas by Event ID (Public/User)
// =======================
export const getSponsorRegistrationQuotasByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const quotas = await SponsorRegistrationQuota.find({ eventId })
      .populate("sponsorId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Sponsor registration quotas fetched successfully",
      data: quotas,
    });
  } catch (error) {
    console.error("Get Sponsor Registration Quotas error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Sponsor Registration Quota (EventAdmin Only)
// =======================
export const updateSponsorRegistrationQuota = async (req, res) => {
  try {
    const { id } = req.params;
    const { sponsorId, quota, startDateTime, endDateTime } = req.body;

    // ===============================
    // Validate format
    // ===============================
    if (startDateTime && isNaN(new Date(startDateTime))) {
      return res.status(400).json({
        message: "Invalid startDateTime format",
      });
    }

    if (endDateTime && isNaN(new Date(endDateTime))) {
      return res.status(400).json({
        message: "Invalid endDateTime format",
      });
    }

    const quotaRecord = await SponsorRegistrationQuota.findById(id);
    if (!quotaRecord) {
      return res
        .status(404)
        .json({ message: "Sponsor registration quota not found" });
    }

    //  If sponsorId is being updated, ensure it's unique globally
    if (sponsorId && sponsorId.toString() !== quotaRecord.sponsorId.toString()) {
      const existingQuota = await SponsorRegistrationQuota.findOne({ sponsorId });
      if (existingQuota) {
        return res.status(400).json({
          success: false,
          message: "This sponsor already has a registration quota.",
        });
      }
      quotaRecord.sponsorId = sponsorId;
    }

    if (quota !== undefined) quotaRecord.quota = quota;

    // ===============================
    // Final values + conversion
    // ===============================
    const finalStart = startDateTime
      ? new Date(startDateTime)
      : quotaRecord.startDateTime;

    const finalEnd = endDateTime
      ? new Date(endDateTime)
      : quotaRecord.endDateTime;

    // ===============================
    // Compare
    // ===============================
    if (finalEnd < finalStart) {
      return res.status(400).json({
        message: "End date must be greater than or equal to start date",
      });
    }

    quotaRecord.startDateTime = finalStart;
    quotaRecord.endDateTime = finalEnd;

    await quotaRecord.save();

    res.status(200).json({
      success: true,
      message: "Sponsor registration quota updated successfully",
      data: quotaRecord,
    });
  } catch (error) {
    console.error("Update Sponsor Registration Quota error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


// =======================
// Delete Sponsor Registration Quota (EventAdmin Only)
// =======================
export const deleteSponsorRegistrationQuota = async (req, res) => {
  try {
    const { id } = req.params;

    const quotaRecord = await SponsorRegistrationQuota.findById(id);
    if (!quotaRecord) {
      return res.status(404).json({ message: "Sponsor registration quota not found" });
    }

    await quotaRecord.deleteOne();

    res.status(200).json({
      success: true,
      message: "Sponsor registration quota deleted successfully",
    });
  } catch (error) {
    console.error("Delete Sponsor Registration Quota error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
