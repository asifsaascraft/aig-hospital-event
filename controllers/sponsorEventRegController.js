import mongoose from "mongoose";
import EventRegistration from "../models/EventRegistration.js";
import Event from "../models/Event.js";
import SponsorRegistrationQuota from "../models/SponsorRegistrationQuota.js";
import User from "../models/User.js";
import sendEmailWithTemplate from "../utils/sendEmail.js";
import moment from "moment";
import { getIndianFormattedDateTime } from "../utils/dateUtils.js";
import CardProfile from "../models/CardProfile.js";

// =====================================
//  1. CHECK EMAIL EXISTS FOR EVENT REGISTRATION (Protected)
// =====================================
export const checkEmailExists = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { email } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required in the URL",
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // ===============================
    // CHECK EVENT REGISTRATION
    // ===============================
    const existingRegistration = await EventRegistration.findOne({
      eventId,
      email: normalizedEmail,
      isPaid: true,
      isSuspended: false,
    });

    // ===============================
    // CHECK USER
    // ===============================
    const user = await User.findOne({
      email: normalizedEmail,
      role: "user",
    }).select(
      "-password -plainPassword -passwordResetToken -passwordResetExpires -otp -otpExpires"
    );

    // ===============================
    // RESPONSE
    // ===============================
    return res.status(200).json({
      success: true,
      isUserFound: !!user,
      isRegisteredForEvent: !!existingRegistration,
      message: existingRegistration
        ? "User already registered for this event"
        : user
        ? "User found but not registered for this event"
        : "User not found",
      data: user || null,
      registration: existingRegistration || null,
    });
  } catch (error) {
    console.error("Error checking email:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while checking email",
    });
  }
};

// ======================================
//  2. ADD SPONSOR EVENT REGISTRATION (Protected)
// ======================================
export const sponsorRegisterForEvent = async (req, res) => {
  try {
    const sponsorId = req.sponsor._id;
    const { eventId } = req.params;

    const {
      userId,
      prefix,
      cardProfileId,
      name,
      gender,
      email,
      mobile,
      designation,
      affiliation,
      mciNumber,
      mciState,
      department,
      alternateEmail,
      alternateMobile,
      country,
      city,
      state,
      address,
      pincode,
    } = req.body;

    // ===============================
    // Validate Event
    // ===============================
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ===============================
    // Validate Event
    // ===============================
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // ===============================
    // Validate Card Profile
    // ===============================
    if (!cardProfileId) {
      return res.status(400).json({
        success: false,
        message: "cardProfileId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(cardProfileId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cardProfileId",
      });
    }

    const cardProfile = await CardProfile.findOne({
      _id: cardProfileId,
      status: "Active",
    });

    if (!cardProfile) {
      return res.status(404).json({
        success: false,
        message: "Active card profile not found",
      });
    }

    // ===============================
    // Suspended Check
    // ===============================
    const suspendedReg = await EventRegistration.findOne({
      userId,
      eventId,
      isSuspended: true,
    });

    if (suspendedReg) {
      return res.status(403).json({
        success: false,
        message: "Your previous registration for this event is suspended.",
      });
    }

    // ===============================
    // Already Paid Check
    // ===============================
    const existingPaidReg = await EventRegistration.findOne({
      userId,
      eventId,
      isPaid: true,
    });

    if (existingPaidReg) {
      return res.status(400).json({
        success: false,
        message: "User already registered for this event",
      });
    }

    // ===============================
    // Sponsor Quota Validation
    // ===============================
    const quotaRecord = await SponsorRegistrationQuota.findOne({
      sponsorId,
      eventId,
    });

    if (!quotaRecord) {
      return res.status(400).json({
        success: false,
        message: "No registration quota assigned for this sponsor",
      });
    }

    const today = new Date();

    if (quotaRecord.startDateTime && today < quotaRecord.startDateTime) {
      return res.status(400).json({
        success: false,
        message: "Registration has not started yet",
      });
    }

    if (quotaRecord.endDateTime && today > quotaRecord.endDateTime) {
      return res.status(400).json({
        success: false,
        message: "Registration has ended",
      });
    }

    // ===============================
    // Quota Count
    // ===============================
    const usedRegistrations = await EventRegistration.countDocuments({
      sponsorId,
      eventId,
      registrationType: "Sponsor Registration",
      isSuspended: false,
    });

    if (usedRegistrations >= quotaRecord.quota) {
      return res.status(400).json({
        message: `Registration Quota has exceeded`,
      });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      event._id,
      { $inc: { regCounter: 1 } },
      { new: true }
    );

    const generatedRegNum = `${event.eventCode}-${updatedEvent.regCounter}`;

    // ===============================
    // Create Registration
    // ===============================
    const registration = await EventRegistration.create({
      userId,
      sponsorId,
      eventId,
      prefix,
      cardProfileId,
      name,
      gender,
      email,
      mobile,
      designation,
      affiliation,
      mciNumber,
      mciState,
      department,
      alternateEmail,
      alternateMobile,
      country,
      city,
      state,
      address,
      pincode,
      isPaid: true,
      regNumGenerated: true,
      regNum: generatedRegNum,
      registrationType: "Sponsor Registration",
    });

    // -----------------------------
    // SAFE FALLBACKS (IMPORTANT)
    // -----------------------------
    const finalEmail = email || targetUser.email;
    const finalName = name || targetUser.name;

    // ----------------------------------------------------
    //  Send Email Notification to User
    // ----------------------------------------------------
    try {
      await sendEmailWithTemplate({
        to: finalEmail,
        name: finalName,
        templateKey:
          "2518b.554b0da719bc314.k1.84e00a60-c384-11f0-807d-8e9a6c33ddc2.19a90a6be06",
        mergeInfo: {
          eventName: event.eventName,
          registrationNumber: generatedRegNum,

          startDate: getIndianFormattedDateTime(event.startDateTime),

          endDate: getIndianFormattedDateTime(event.endDateTime),

          prefix,
          name,
          email,
          mobile,
          designation,
          affiliation,
          country,
          state,
          city,
          address,
          pincode,
        },
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: registration,
    });
  } catch (error) {
    console.error("Sponsor registration error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ======================================
// 3. GET ALL REGISTRATIONS BY EVENT (Sponsor Only)
// ======================================
export const getAllRegistrationsByEvent = async (req, res) => {
  try {
    const sponsorId = req.sponsor._id;
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required",
      });
    }

    // Check event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Fetch all sponsor registrations for this event
    const registrations = await EventRegistration.find({
      sponsorId,
      eventId,
    })
      .populate({
        path: "eventId",
        select: "eventName startDateTime endDateTime",
      })
      .populate({
        path: "cardProfileId",
        select: "CardProfileName",
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Get All registrations fetched successfully",
      total: registrations.length,
      data: registrations,
    });
  } catch (error) {
    console.error("Get registrations error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching sponsor event registrations",
    });
  }
};

// ======================================
// 4. GET SPONSOR QUOTA SUMMARY (Protected)
// ======================================
export const getSponsorQuotaSummary = async (req, res) => {
  try {
    const sponsorId = req.sponsor._id;
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required",
      });
    }

    // Step 1: Fetch quota record
    const quotaRecord = await SponsorRegistrationQuota.findOne({
      sponsorId,
      eventId,
    });

    if (!quotaRecord) {
      return res.status(404).json({
        success: false,
        message: "No quota assigned for this sponsor",
      });
    }

    // Step 2: Count used registrations
    const usedRegistrations = await EventRegistration.countDocuments({
      sponsorId,
      eventId,
      registrationType: "Sponsor Registration",
      isSuspended: false, // Only active registrations
    });

    // Step 3: Calculate remaining
    const remaining = Math.max(quotaRecord.quota - usedRegistrations, 0);

    return res.status(200).json({
      success: true,
      message: "Sponsor quota summary fetched successfully",
      data: {
        sponsorId,
        eventId,
        totalQuota: quotaRecord.quota,
        usedRegistrations,
        remainingQuota: remaining,
        startDateTime: quotaRecord.startDateTime,
        endDateTime: quotaRecord.endDateTime,
        status: quotaRecord.status,
      },
    });
  } catch (error) {
    console.error("Get Sponsor Quota Summary error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching quota summary",
    });
  }
};

// ======================================
// 5. UPDATE SPONSOR EVENT REGISTRATION
// ======================================
export const updateSponsorEventRegistration = async (req, res) => {
  try {
    const sponsorId = req.sponsor._id;
    const { eventId, registrationId } = req.params;

    // Step 1: Validate event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Step 2: Check registration belongs to this sponsor
    const registration = await EventRegistration.findOne({
      _id: registrationId,
      eventId,
      sponsorId,
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found or not authorized",
      });
    }

    // Step 3: Remove non-editable fields from request
    const notAllowed = [
      "email",
      "regNum",
      "regNumGenerated",
      "isPaid",
      "isSuspended",
    ];

    notAllowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        delete req.body[field];
      }
    });

    // ===============================
    // Validate cardProfileId
    // ===============================
    if (req.body.cardProfileId) {

      if (!mongoose.Types.ObjectId.isValid(req.body.cardProfileId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid cardProfileId",
        });
      }

      const cardProfile = await CardProfile.findOne({
        _id: req.body.cardProfileId,
        status: "Active",
      });

      if (!cardProfile) {
        return res.status(404).json({
          success: false,
          message: "Active card profile not found",
        });
      }
    }

    // Step 4: Update registration
    const updatedRegistration = await EventRegistration.findByIdAndUpdate(
      registrationId,
      req.body,
      { new: true },
    );

    res.status(200).json({
      success: true,
      message: "Registration updated successfully",
      data: updatedRegistration,
    });
  } catch (error) {
    console.error("Update registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating registration",
    });
  }
};
