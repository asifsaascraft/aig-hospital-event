import EventRegistration from "../models/EventRegistration.js";
import Event from "../models/Event.js";
import moment from "moment";
import Sponsor from "../models/Sponsor.js";
import SponsorRegistrationQuota from "../models/SponsorRegistrationQuota.js";
import sendEmailWithTemplate from "../utils/sendEmail.js";


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

    // Check if email already exists for this event
    const existing = await EventRegistration.findOne({
      eventId,
      email: normalizedEmail,
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Email already registered for this event",
      });
    }

    return res.status(200).json({
      success: false,
      message: "Email not registered for this event",
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
      prefix,
      name,
      gender,
      email,
      mobile,
      designation,
      affiliation,
      medicalCouncilState,
      medicalCouncilRegistration,
      mealPreference,
      country,
      city,
      state,
      address,
      pincode,
    } = req.body;

    // Step 1: Validate Event
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Step 2: Check Suspended Registration
    const suspendedReg = await EventRegistration.findOne({
      sponsorId,
      eventId,
      isSuspended: true,
    });

    if (suspendedReg) {
      return res.status(403).json({
        success: false,
        message:
          "Your previous registration for this event is suspended. Please contact the Event Admin.",
      });
    }

    // ----------------------------------------------------
    //  Step 3: FETCH SPONSOR QUOTA (IMPORTANT)
    // ----------------------------------------------------
    const quotaRecord = await SponsorRegistrationQuota.findOne({ sponsorId, eventId });

    if (!quotaRecord) {
      return res.status(400).json({
        success: false,
        message: "No registration quota assigned for this sponsor.",
      });
    }

    if (quotaRecord.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Your sponsor quota is not Active.",
      });
    }

    // ----------------------------------------------------
    //  Step 4: COUNT HOW MANY REGISTRATIONS ARE USED
    // ----------------------------------------------------
    const usedRegistrations = await EventRegistration.countDocuments({
      sponsorId,
      eventId,
      isSuspended: false, // Only count valid ones
    });

    // Step 5: Check if quota exceeded
    if (usedRegistrations >= quotaRecord.quota) {
      return res.status(400).json({
        success: false,
        message: `Quota exceeded. Allowed: ${quotaRecord.quota}, Used: ${usedRegistrations}`,
      });
    }

    // ----------------------------------------------------
    //  Step 6: Generate Registration Number
    // ----------------------------------------------------
    const lastPaidRegistration = await EventRegistration.findOne({
      eventId,
      regNumGenerated: true,
    })
      .sort({ createdAt: -1 })
      .limit(1);

    let newRegNumInt;
    if (lastPaidRegistration && lastPaidRegistration.regNum) {
      const lastNum = parseInt(lastPaidRegistration.regNum.split("-").pop());
      newRegNumInt = lastNum + 1;
    } else {
      const baseNum = parseInt(event.regNum || 0);
      newRegNumInt = baseNum + 1;
    }

    const generatedRegNum = `${event.eventCode}-${newRegNumInt}`;

    // ----------------------------------------------------
    //  Step 7: Create the Registration
    // ----------------------------------------------------
    const registration = await EventRegistration.create({
      sponsorId,
      eventId,
      prefix,
      name,
      gender,
      email,
      mobile,
      designation,
      affiliation,
      medicalCouncilState,
      medicalCouncilRegistration,
      mealPreference,
      country,
      city,
      state,
      address,
      pincode,
      isPaid: true,
      regNumGenerated: true,
      isSuspended: false,
      regNum: generatedRegNum,
    });

    // ----------------------------------------------------
    //  Step 8: Send Email Notification to Sponsor
    // ----------------------------------------------------
    try {
      await sendEmailWithTemplate({
        to: email,
        name: name,
        templateKey: "2518b.554b0da719bc314.k1.84e00a60-c384-11f0-807d-8e9a6c33ddc2.19a90a6be06", 
        mergeInfo: {
          eventName: event.eventName,
          registrationNumber: generatedRegNum,
          startDate: event.startDate
              ? moment(event.startDate, "DD/MM/YYYY").format("DD MMM YYYY")
              : "N/A",
            endDate: event.endDate
              ? moment(event.endDate, "DD/MM/YYYY").format("DD MMM YYYY")
              : "N/A",
          prefix,
          name,
          email,
          mobile,
          designation,
          affiliation,
          mealPreference,
          medicalCouncilRegistration,
          medicalCouncilState,
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

    res.status(201).json({
      success: true,
      message: "Event registration created successfully",
      data: registration,
    });
  } catch (error) {
    console.error("Event registration error:", error);
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
    }).sort({ createdAt: -1 });

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
