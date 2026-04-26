import EventRegistration from "../models/EventRegistration.js";
import Event from "../models/Event.js";
import SponsorRegistrationQuota from "../models/SponsorRegistrationQuota.js";
import DynamicRegForm from "../models/DynamicRegForm.js";
import User from "../models/User.js";

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

    //  Check existing registration WITH isPaid = true
    const existing = await EventRegistration.findOne({
      eventId,
      email: normalizedEmail,
      isPaid: true, 
      isSuspended: false,
    }).select("userId name email mobile gender designation affiliation regNum");

    //  IF EXISTS (AND PAID)
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Email already registered and paid for this event",
        data: existing,
      });
    }

    //  NOT FOUND OR NOT PAID
    return res.status(200).json({
      success: false,
      message: "Email not registered",
      data: null,
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

    if (quotaRecord.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Your registration Quota is not active",
      });
    }

    const today = new Date();

    if (quotaRecord.startDate && today < quotaRecord.startDate) {
      return res.status(400).json({
        message: "Registration has not started yet",
      });
    }

    if (quotaRecord.endDate && today > quotaRecord.endDate) {
      return res.status(400).json({
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

    // ===============================
    // FILE MAP (IMPORTANT)
    // ===============================
    const fileMap = {};
    (req.files || []).forEach((file) => {
      fileMap[file.fieldname] = fileMap[file.fieldname] || [];
      fileMap[file.fieldname].push(file);
    });

    // ===============================
    // DYNAMIC FORM VALIDATION
    // ===============================
    const dynamicForm = await DynamicRegForm.findOne({ eventId });

    let validatedDynamicFormAnswers = [];

    if (dynamicForm && dynamicForm.fields.length > 0) {
      let parsedDynamic = [];

      if (typeof req.body.dynamicFormAnswers === "string") {
        try {
          parsedDynamic = JSON.parse(req.body.dynamicFormAnswers);
        } catch {
          return res.status(400).json({
            message: "Invalid JSON format for dynamicFormAnswers",
          });
        }
      } else if (Array.isArray(req.body.dynamicFormAnswers)) {
        parsedDynamic = req.body.dynamicFormAnswers;
      }

      for (const field of dynamicForm.fields) {
        const answered = parsedDynamic.find(
          (a) => String(a.id) === String(field.id),
        );

        const fileKey = `file_dyn_${field.id}`;
        const fileUpload = fileMap?.[fileKey]?.[0];

        // FILE FIELD
        if (field.type === "input" && field.inputTypes === "file") {
          if (field.required && !fileUpload) {
            return res.status(400).json({
              message: `File required: ${field.label}`,
            });
          }

          if (fileUpload && field.maxFileSize) {
            const sizeMB = fileUpload.size / (1024 * 1024);
            if (sizeMB > field.maxFileSize) {
              return res.status(400).json({
                message: `${field.label} must be < ${field.maxFileSize} MB`,
              });
            }
          }

          validatedDynamicFormAnswers.push({
            id: field.id,
            label: field.label,
            type: field.type,
            required: field.required,
            value: null,
            fileUrl: fileUpload ? fileUpload.location : null,
          });

          continue;
        }

        // NORMAL FIELD
        const value = answered?.value;

        if (field.required && (value === undefined || value === "")) {
          return res.status(400).json({
            message: `Value required: ${field.label}`,
          });
        }

        validatedDynamicFormAnswers.push({
          id: field.id,
          label: field.label,
          type: field.type,
          required: field.required,
          value: value ?? null,
          fileUrl: null,
        });
      }
    }

    // ===============================
    // Generate Reg Number
    // ===============================
    const last = await EventRegistration.findOne({
      eventId,
      regNumGenerated: true,
    }).sort({ createdAt: -1 });

    let newNum = last?.regNum
      ? parseInt(last.regNum.split("-").pop()) + 1
      : parseInt(event.regNum || 0) + 1;

    const generatedRegNum = `${event.eventCode}-${newNum}`;

    // ===============================
    // Create Registration
    // ===============================
    const registration = await EventRegistration.create({
      userId,
      sponsorId,
      eventId,
      prefix,
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
      dynamicFormAnswers: validatedDynamicFormAnswers,
      isPaid: true,
      regNumGenerated: true,
      regNum: generatedRegNum,
      registrationType: "Sponsor Registration",
    });

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
        startDate: quotaRecord.startDate,
        endDate: quotaRecord.endDate,
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
