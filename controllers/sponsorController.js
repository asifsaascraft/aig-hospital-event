import Sponsor from "../models/Sponsor.js";
import bcrypt from "bcryptjs";
import { generateStrongPassword } from "../utils/generatePassword.js";
import SponsorRegistrationQuota from "../models/SponsorRegistrationQuota.js";
import SponsorAccomodationQuota from "../models/SponsorAccomodationQuota.js";
import SponsorTravelQuota from "../models/SponsorTravelQuota.js";
import EventRegistration from "../models/EventRegistration.js";
import Event from "../models/Event.js";

// =======================
// Get all sponsors by Event ID (Public/User)
// =======================
export const getSponsorsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const sponsors = await Sponsor.find({ eventId })
      .sort({ createdAt: -1 })
      .populate("eventId", "eventName");

    res.json({ success: true, data: sponsors });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch sponsors",
      error: error.message,
    });
  }
};

// =======================
// Get active sponsors by Event ID (Public/User)
// =======================
export const getActiveSponsorsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const sponsors = await Sponsor.find({
      eventId,
      status: "Active",
    })
      .sort({ createdAt: -1 })
      .populate("eventId", "eventName");

    res.json({
      success: true,
      data: sponsors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch active sponsors",
      error: error.message,
    });
  }
};

// =======================
// Create sponsor (eventAdmin only)
// =======================
export const createSponsor = async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      sponsorName,
      contactPersonName,
      email,
      mobile,
      additionalEmail,
      gstNumber,
      companyAddress,
      status,
    } = req.body;

    if (
      !eventId ||
      !sponsorName ||
      !contactPersonName ||
      !email ||
      !mobile ||
      !companyAddress
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Required fields: eventId, sponsorName, contactPersonName, email, mobile, companyAddress",
      });
    }

    //  NEW (STRICT UNIQUE EMAIL)
    const existingSponsor = await Sponsor.findOne({ email });

    if (existingSponsor) {
      return res.status(400).json({
        success: false,
        message:
          "This email is already registered, Please use a different email",
      });
    }

    // Generate password
    const plainPassword = generateStrongPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const sponsor = await Sponsor.create({
      eventId,
      sponsorName,
      contactPersonName,
      email,
      mobile,
      additionalEmail,
      password: hashedPassword,
      plainPassword,
      gstNumber,
      companyAddress,
      status: status || "Active",
    });

    // Return plain password (for eventAdmin to note or send)
    res.status(201).json({
      success: true,
      message: "Sponsor created successfully",
      data: sponsor,
      plainPassword,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create sponsor",
      error: error.message,
    });
  }
};

// =======================
// Update sponsor (eventAdmin only)
// =======================
export const updateSponsor = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = { ...req.body };

    // ============================
    // Fetch current sponsor
    // ============================
    const sponsor = await Sponsor.findById(id);
    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: "Sponsor not found",
      });
    }

    // ============================
    // Determine final email
    // ============================
    const finalEmail = updatedData.email || sponsor.email;

    // ============================
    // UNIQUE EMAIL CHECK
    // ============================
    const duplicateSponsor = await Sponsor.findOne({
      email: finalEmail,
      _id: { $ne: id }, // exclude current sponsor
    });

    if (duplicateSponsor) {
      return res.status(400).json({
        success: false,
        message: "This email is already registered, Please use a different email",
      });
    }

    // ============================
    // Update sponsor
    // ============================
    const updatedSponsor = await Sponsor.findByIdAndUpdate(
      id,
      updatedData,
      {
        new: true,
        runValidators: true,
      }
    );

    res.json({
      success: true,
      data: updatedSponsor,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update sponsor",
      error: error.message,
    });
  }
};

// =======================
// Delete sponsor (eventAdmin only)
// =======================
export const deleteSponsor = async (req, res) => {
  try {
    const { id } = req.params;

    const sponsor = await Sponsor.findByIdAndDelete(id);

    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: "Sponsor not found",
      });
    }

    res.json({ success: true, message: "Sponsor deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete sponsor",
      error: error.message,
    });
  }
};

// =======================
// GET SUMMARY BY EVENT
// =======================
export const getSponsorSummary = async (req, res) => {
  try {
    const { eventId } = req.params;

    // 🔹 Fetch event name
    const event = await Event.findById(eventId).select("eventName");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // =======================
    // 1. SPONSORS
    // =======================
    const sponsors = await Sponsor.find({ eventId });

    const totalSponsors = sponsors.length;
    const activeSponsors = sponsors.filter((s) => s.status === "Active").length;
    const inactiveSponsors = sponsors.filter(
      (s) => s.status === "Inactive",
    ).length;

    // =======================
    // 2. REGISTRATION QUOTA
    // =======================
    const regQuotas = await SponsorRegistrationQuota.find({ eventId });

    const totalRegQuota = regQuotas.reduce((sum, q) => sum + q.quota, 0);

    // Count ONLY sponsor registrations (valid ones)
    const totalRegUsed = await EventRegistration.countDocuments({
      eventId,
      registrationType: "Sponsor Registration",
      isSuspended: false,
    });

    // Remaining = total quota - used
    const totalRegRemaining = Math.max(totalRegQuota - totalRegUsed, 0);

    // =======================
    // 3. ACCOMODATION QUOTA
    // =======================
    const accQuotas = await SponsorAccomodationQuota.find({ eventId });

    const totalAccQuota = accQuotas.reduce((sum, q) => sum + q.quota, 0);

    // ⚠️ USED logic (you must connect with actual accomodation quota registrations table later)
    const totalAccUsed = 0; // TODO
    const totalAccRemaining = totalAccQuota - totalAccUsed;

    // =======================
    // 4. TRAVEL QUOTA
    // =======================
    const travelQuotas = await SponsorTravelQuota.find({ eventId });

    const totalTravelQuota = travelQuotas.reduce((sum, q) => sum + q.quota, 0);

    // ⚠️ USED logic (you must connect with actual travel quota registrations table later)
    const totalTravelUsed = 0; // TODO
    const totalTravelRemaining = totalTravelQuota - totalTravelUsed;

    // =======================
    // 5. PER SPONSOR DATA
    // =======================
    const sponsorDetails = await Promise.all(
      sponsors.map(async (sponsor) => {
        const reg = await SponsorRegistrationQuota.findOne({
          sponsorId: sponsor._id,
        });

        const acc = await SponsorAccomodationQuota.findOne({
          sponsorId: sponsor._id,
        });

        const travel = await SponsorTravelQuota.findOne({
          sponsorId: sponsor._id,
        });

        return {
          sponsorName: sponsor.sponsorName,

          registrationQuota: reg?.quota || 0,
          registrationUsed: 0, // TODO
          registrationRemaining: reg?.quota || 0,

          accomodationQuota: acc?.quota || 0,
          accomodationUsed: 0,
          accomodationRemaining: acc?.quota || 0,

          travelQuota: travel?.quota || 0,
          travelUsed: 0,
          travelRemaining: travel?.quota || 0,
        };
      }),
    );

    // =======================
    // FINAL RESPONSE
    // =======================
    res.status(200).json({
      success: true,
      data: {
        eventName: event.eventName,
        sponsors: {
          total: totalSponsors,
          active: activeSponsors,
          inactive: inactiveSponsors,
        },

        registrationQuota: {
          total: totalRegQuota,
          used: totalRegUsed,
          remaining: totalRegRemaining,
        },

        accomodationQuota: {
          total: totalAccQuota,
          used: totalAccUsed,
          remaining: totalAccRemaining,
        },

        travelQuota: {
          total: totalTravelQuota,
          used: totalTravelUsed,
          remaining: totalTravelRemaining,
        },

        sponsorBreakdown: sponsorDetails,
      },
    });
  } catch (error) {
    console.error("Summary Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};