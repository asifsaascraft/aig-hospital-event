import SponsorWorkshopQuota from "../models/SponsorWorkshopQuota.js";
import Event from "../models/Event.js";
import Sponsor from "../models/Sponsor.js";
import Workshop from "../models/Workshop.js";

// =======================
// Create Sponsor Workshop Quota
// =======================
export const createSponsorWorkshopQuota = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { sponsorId, workshopId, quota, startDateTime, endDateTime } =
      req.body;

    if (!startDateTime || !endDateTime) {
      return res.status(400).json({
        message: "Start and End date time are required",
      });
    }

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

    const parsedStart = new Date(startDateTime);
    const parsedEnd = new Date(endDateTime);

    if (parsedEnd < parsedStart) {
      return res.status(400).json({
        message: "End date must be greater than or equal to start date",
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }
    const workshop = await Workshop.findOne({
      _id: workshopId,
      eventId,
    });

    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: "Workshop not found",
      });
    }

    if (quota > workshop.maxRegAllowed) {
      return res.status(400).json({
        success: false,
        message: `Quota cannot exceed workshop max registration limit (${workshop.maxRegAllowed})`,
      });
    }

    const sponsor = await Sponsor.findById(sponsorId);

    if (!sponsor) {
      return res.status(404).json({
        message: "Sponsor not found",
      });
    }

    const existingQuota = await SponsorWorkshopQuota.findOne({
      sponsorId,
      workshopId,
      eventId,
    });

    if (existingQuota) {
      return res.status(400).json({
        success: false,
        message: "This sponsor already has a workshop quota.",
      });
    }

    const newQuota = await SponsorWorkshopQuota.create({
      eventId,
      workshopId,
      sponsorId,
      quota,
      startDateTime: parsedStart,
      endDateTime: parsedEnd,
    });

    return res.status(201).json({
      success: true,
      message: "Sponsor workshop quota created successfully",
      data: newQuota,
    });
  } catch (error) {
    console.error("Create Sponsor Workshop Quota error:", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Get All Workshop Quotas By Event
// =======================
export const getSponsorWorkshopQuotasByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const quotas = await SponsorWorkshopQuota.find({
      eventId,
    })
      .populate("sponsorId")
      .populate("workshopId", "workshopName workshopCategory")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      message: "Sponsor workshop quotas fetched successfully",
      data: quotas,
    });
  } catch (error) {
    console.error("Get Sponsor Workshop Quotas error:", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Update Sponsor Workshop Quota
// =======================
export const updateSponsorWorkshopQuota = async (req, res) => {
  try {
    const { id } = req.params;
    const { sponsorId, workshopId, quota, startDateTime, endDateTime } =
      req.body;

    const quotaRecord = await SponsorWorkshopQuota.findById(id);

    if (!quotaRecord) {
      return res.status(404).json({
        message: "Sponsor workshop quota not found",
      });
    }

    const targetWorkshopId = workshopId || quotaRecord.workshopId;

    const workshop = await Workshop.findById(targetWorkshopId);

    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: "Workshop not found",
      });
    }

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

    // ======================================
    // Duplicate Check
    // ======================================

    const finalSponsorId = sponsorId || quotaRecord.sponsorId;

    const finalWorkshopId = workshopId || quotaRecord.workshopId;

    const existingQuota = await SponsorWorkshopQuota.findOne({
      sponsorId: finalSponsorId,
      workshopId: finalWorkshopId,
      eventId: quotaRecord.eventId,
      _id: { $ne: id },
    });

    if (existingQuota) {
      return res.status(400).json({
        success: false,
        message: "This sponsor already has a quota for this workshop.",
      });
    }

    // update values
    if (sponsorId) {
      quotaRecord.sponsorId = sponsorId;
    }

    if (workshopId) {
      quotaRecord.workshopId = workshopId;
    }

    if (quota !== undefined) {
      quotaRecord.quota = quota;
    }

    const finalStart = startDateTime
      ? new Date(startDateTime)
      : quotaRecord.startDateTime;

    const finalEnd = endDateTime
      ? new Date(endDateTime)
      : quotaRecord.endDateTime;

    if (finalEnd < finalStart) {
      return res.status(400).json({
        message: "End date must be greater than or equal to start date",
      });
    }

    quotaRecord.startDateTime = finalStart;
    quotaRecord.endDateTime = finalEnd;

    const finalQuota = quota !== undefined ? quota : quotaRecord.quota;

    if (finalQuota > workshop.maxRegAllowed) {
      return res.status(400).json({
        success: false,
        message: `Quota cannot exceed workshop max registration limit (${workshop.maxRegAllowed})`,
      });
    }

    await quotaRecord.save();

    return res.status(200).json({
      success: true,
      message: "Sponsor workshop quota updated successfully",
      data: quotaRecord,
    });
  } catch (error) {
    console.error("Update Sponsor Workshop Quota error:", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Delete Sponsor Workshop Quota
// =======================
export const deleteSponsorWorkshopQuota = async (req, res) => {
  try {
    const { id } = req.params;

    const quotaRecord = await SponsorWorkshopQuota.findById(id);

    if (!quotaRecord) {
      return res.status(404).json({
        message: "Sponsor workshop quota not found",
      });
    }

    await quotaRecord.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Sponsor workshop quota deleted successfully",
    });
  } catch (error) {
    console.error("Delete Sponsor Workshop Quota error:", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};
