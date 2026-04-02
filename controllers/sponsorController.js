import Sponsor from "../models/Sponsor.js";
import bcrypt from "bcryptjs";
import { generateStrongPassword } from "../utils/generatePassword.js";
import SponsorRegistrationQuota from "../models/SponsorRegistrationQuota.js";
import SponsorAccomodationQuota from "../models/SponsorAccomodationQuota.js";
import SponsorTravelQuota from "../models/SponsorTravelQuota.js";
import EventRegistration from "../models/EventRegistration.js";

// =======================
// Get all sponsors by Event ID (Public/User)
// =======================
export const getSponsorsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const sponsors = await Sponsor.find({ eventId })
      .sort({ createdAt: -1 })
      .populate("eventId sponsorBooth");

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
      .populate("eventId sponsorBooth");

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
      sponsorBooth,
      sponsorCategory,
      status,
    } = req.body;

    if (
      !eventId ||
      !sponsorName ||
      !contactPersonName ||
      !email ||
      !mobile ||
      !companyAddress ||
      !sponsorBooth ||
      !sponsorCategory
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Required fields: eventId, sponsorName, contactPersonName, email, mobile, companyAddress, sponsorBooth, sponsorCategory",
      });
    }

    // Check if an active sponsor with this email already exists
    const existingActiveSponsor = await Sponsor.findOne({
      email,
      status: "Active",
    });

    if (existingActiveSponsor) {
      return res.status(400).json({
        success: false,
        message:
          "A sponsor with this email is already Active. Please deactivate the existing sponsor before adding a new one.",
      });
    }
    //  Handle sponsor image upload (using multer-s3)
    let sponsorImage = "";
    if (req.file && req.file.location) {
      sponsorImage = req.file.location;
    } else {
      return res.status(400).json({
        success: false,
        message: "Sponsor image is required",
      });
    }
    // Generate password
    const plainPassword = generateStrongPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const sponsor = await Sponsor.create({
      eventId,
      sponsorName,
      sponsorImage,
      contactPersonName,
      email,
      mobile,
      additionalEmail,
      password: hashedPassword,
      plainPassword,
      gstNumber,
      companyAddress,
      sponsorBooth,
      sponsorCategory,
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
    // Update sponsor image if a new one is uploaded

    if (req.file && req.file.location) {
      updatedData.sponsorImage = req.file.location;
    }

    // Fetch current sponsor
    const existingSponsor = await Sponsor.findById(id);
    if (!existingSponsor) {
      return res.status(404).json({
        success: false,
        message: "Sponsor not found",
      });
    }

    // Determine final email & status after update
    const finalEmail = updatedData.email || existingSponsor.email;
    const finalStatus = updatedData.status || existingSponsor.status;

    // Check if same email sponsor already active
    if (finalStatus === "Active") {
      const existingActiveSponsor = await Sponsor.findOne({
        email: finalEmail,
        status: "Active",
        _id: { $ne: id },
      });

      if (existingActiveSponsor) {
        return res.status(400).json({
          success: false,
          message:
            "A sponsor with this email is already Active. Please deactivate the existing sponsor before activating this one.",
        });
      }
    }

    // ============================

    const sponsor = await Sponsor.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: "Sponsor not found",
      });
    }

    res.json({ success: true, data: sponsor });
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
