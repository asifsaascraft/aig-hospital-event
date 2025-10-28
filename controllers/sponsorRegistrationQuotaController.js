import SponsorRegistrationQuota from "../models/SponsorRegistrationQuota.js";
import Event from "../models/Event.js";
import Sponsor from "../models/Sponsor.js";

// =======================
// Create Sponsor Registration Quota (EventAdmin Only)
// =======================
export const createSponsorRegistrationQuota = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { sponsorId, quota, status } = req.body;

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

    // Create quota record
    const newQuota = await SponsorRegistrationQuota.create({
      eventId,
      sponsorId,
      quota,
      status,
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
      .populate("Sponsor")
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
    const { quota, status } = req.body;

    const quotaRecord = await SponsorRegistrationQuota.findById(id);
    if (!quotaRecord) {
      return res.status(404).json({ message: "Sponsor registration quota not found" });
    }

    if (quota !== undefined) quotaRecord.quota = quota;
    if (status) quotaRecord.status = status;

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
