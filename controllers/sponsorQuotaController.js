import SponsorAccomodationQuota from "../models/SponsorAccomodationQuota.js";
import SponsorRegistrationQuota from "../models/SponsorRegistrationQuota.js";
import SponsorTravelQuota from "../models/SponsorTravelQuota.js";
import SponsorWorkshopQuota from "../models/SponsorWorkshopQuota.js";
import Event from "../models/Event.js";
import Sponsor from "../models/Sponsor.js";

// ==========================================
// Get Sponsor Quota Status
// Sponsor Only
// ==========================================
export const getSponsorQuotaStatus = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Sponsor ID comes from logged-in sponsor
    const sponsorId = req.sponsor._id;

    // ==========================================
    // Validate Event
    // ==========================================
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // ==========================================
    // Validate Sponsor
    // ==========================================
    const sponsor = await Sponsor.findById(sponsorId);

    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: "Sponsor not found",
      });
    }

    // ==========================================
    // Check Accommodation Quota
    // ==========================================
    const accommodationQuota =
      await SponsorAccomodationQuota.findOne({
        eventId,
        sponsorId,
      });

    const accommodation = !!(
      accommodationQuota &&
      accommodationQuota.quotas &&
      accommodationQuota.quotas.length > 0
    );

    // ==========================================
    // Check Registration Quota
    // ==========================================
    const registrationQuota =
      await SponsorRegistrationQuota.findOne({
        eventId,
        sponsorId,
      });

    const registration = !!registrationQuota;

    // ==========================================
    // Check Travel Quota
    // ==========================================
    const travelQuota =
      await SponsorTravelQuota.findOne({
        eventId,
        sponsorId,
      });

    const travel = !!travelQuota;

    // ==========================================
    // Check Workshop Quota
    // ==========================================
    const workshopQuota =
      await SponsorWorkshopQuota.findOne({
        eventId,
        sponsorId,
      });

    const workshop = !!workshopQuota;

    // ==========================================
    // Final Response
    // ==========================================
    return res.status(200).json({
      success: true,
      message: "Sponsor quota status fetched successfully",
      data: {
        accommodation,
        travel,
        registration,
        workshop,
      },
    });
  } catch (error) {
    console.error("Get Sponsor Quota Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};