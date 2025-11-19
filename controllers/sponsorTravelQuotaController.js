import SponsorTravelQuota from "../models/SponsorTravelQuota.js";
import Event from "../models/Event.js";
import Sponsor from "../models/Sponsor.js";

// =======================
// Create Sponsor Travel Quota (EventAdmin Only)
// =======================
export const createSponsorTravelQuota = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { sponsorId, quota, status, startDate, endDate } = req.body;

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

    //  Check if sponsorId already exists globally
    const existingQuota = await SponsorTravelQuota.findOne({ sponsorId });
    if (existingQuota) {
      return res.status(400).json({
        success: false,
        message: "This sponsor already has a travel quota.",
      });
    }

    // Create quota record
    const newQuota = await SponsorTravelQuota.create({
      eventId,
      sponsorId,
      quota,
      startDate,
      endDate,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Sponsor travel quota created successfully",
      data: newQuota,
    });
  } catch (error) {
    console.error("Create Sponsor Travel Quota error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Travel Quotas by Event ID (Public/User)
// =======================
export const getSponsorTravelQuotasByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const quotas = await SponsorTravelQuota.find({ eventId })
      .populate("sponsorId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Sponsor travel quotas fetched successfully",
      data: quotas,
    });
  } catch (error) {
    console.error("Get Sponsor Travel Quotas error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Sponsor Travel Quota (EventAdmin Only)
// =======================
export const updateSponsorTravelQuota = async (req, res) => {
  try {
    const { id } = req.params;
    const { sponsorId, quota, status, startDate, endDate } = req.body;

    const quotaRecord = await SponsorTravelQuota.findById(id);
    if (!quotaRecord) {
      return res
        .status(404)
        .json({ message: "Sponsor travel quota not found" });
    }

    //  If sponsorId is being updated, ensure it's unique globally
    if (sponsorId && sponsorId.toString() !== quotaRecord.sponsorId.toString()) {
      const existingQuota = await SponsorTravelQuota.findOne({ sponsorId });
      if (existingQuota) {
        return res.status(400).json({
          success: false,
          message: "This sponsor already has a travel quota.",
        });
      }
      quotaRecord.sponsorId = sponsorId;
    }

    if (quota !== undefined) quotaRecord.quota = quota;
    if (startDate !== undefined) quotaRecord.startDate = startDate;
    if (endDate !== undefined) quotaRecord.endDate = endDate;
    if (status) quotaRecord.status = status;

    await quotaRecord.save();

    res.status(200).json({
      success: true,
      message: "Sponsor travel quota updated successfully",
      data: quotaRecord,
    });
  } catch (error) {
    console.error("Update Sponsor Travel Quota error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Sponsor Travel Quota (EventAdmin Only)
// =======================
export const deleteSponsorTravelQuota = async (req, res) => {
  try {
    const { id } = req.params;

    const quotaRecord = await SponsorTravelQuota.findById(id);
    if (!quotaRecord) {
      return res
        .status(404)
        .json({ message: "Sponsor travel quota not found" });
    }

    await quotaRecord.deleteOne();

    res.status(200).json({
      success: true,
      message: "Sponsor travel quota deleted successfully",
    });
  } catch (error) {
    console.error("Delete Sponsor Travel Quota error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
