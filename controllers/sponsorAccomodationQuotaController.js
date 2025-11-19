import SponsorAccomodationQuota from "../models/SponsorAccomodationQuota.js";
import Event from "../models/Event.js";
import Sponsor from "../models/Sponsor.js";

// =======================
// Create Sponsor Accomodation Quota (EventAdmin Only)
// =======================
export const createSponsorAccomodationQuota = async (req, res) => {
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
    const existingQuota = await SponsorAccomodationQuota.findOne({ sponsorId });
    if (existingQuota) {
      return res.status(400).json({
        success: false,
        message: "This sponsor already has an accomodation quota.",
      });
    }

    // Create quota record
    const newQuota = await SponsorAccomodationQuota.create({
      eventId,
      sponsorId,
      quota,
      startDate,
      endDate,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Sponsor accomodation quota created successfully",
      data: newQuota,
    });
  } catch (error) {
    console.error("Create Sponsor Accomodation Quota error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Accomodation Quotas by Event ID (Public/User)
// =======================
export const getSponsorAccomodationQuotasByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const quotas = await SponsorAccomodationQuota.find({ eventId })
      .populate("sponsorId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Sponsor accomodation quotas fetched successfully",
      data: quotas,
    });
  } catch (error) {
    console.error("Get Sponsor Accomodation Quotas error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Sponsor Accomodation Quota (EventAdmin Only)
// =======================
export const updateSponsorAccomodationQuota = async (req, res) => {
  try {
    const { id } = req.params;
    const { sponsorId, quota, status, startDate, endDate } = req.body;

    const quotaRecord = await SponsorAccomodationQuota.findById(id);
    if (!quotaRecord) {
      return res
        .status(404)
        .json({ message: "Sponsor accomodation quota not found" });
    }

    //  If sponsorId is being updated, ensure it's unique globally
    if (sponsorId && sponsorId.toString() !== quotaRecord.sponsorId.toString()) {
      const existingQuota = await SponsorAccomodationQuota.findOne({ sponsorId });
      if (existingQuota) {
        return res.status(400).json({
          success: false,
          message: "This sponsor already has an accomodation quota.",
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
      message: "Sponsor accomodation quota updated successfully",
      data: quotaRecord,
    });
  } catch (error) {
    console.error("Update Sponsor Accomodation Quota error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Sponsor Accomodation Quota (EventAdmin Only)
// =======================
export const deleteSponsorAccomodationQuota = async (req, res) => {
  try {
    const { id } = req.params;

    const quotaRecord = await SponsorAccomodationQuota.findById(id);
    if (!quotaRecord) {
      return res
        .status(404)
        .json({ message: "Sponsor accomodation quota not found" });
    }

    await quotaRecord.deleteOne();

    res.status(200).json({
      success: true,
      message: "Sponsor accomodation quota deleted successfully",
    });
  } catch (error) {
    console.error("Delete Sponsor Accomodation Quota error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
