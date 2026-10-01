import mongoose from "mongoose";
import EventRegistration from "../models/EventRegistration.js";
import Event from "../models/Event.js";
import RegistrationSlab from "../models/RegistrationSlab.js";
import DynamicRegForm from "../models/DynamicRegForm.js";
import User from "../models/User.js";
import sendEmailWithTemplate from "../utils/sendEmail.js";
import moment from "moment";
import {
  getIndianFormattedDate,
  getIndianFormattedDateTime,
  formatWhatsAppEventDate,
} from "../utils/dateUtils.js";
import { sendAIGRegistrationWhatsApp } from "../utils/aisensyWhatsApp.js";
import EventVisitor from "../models/EventVisitor.js";
import CardProfile from "../models/CardProfile.js";
import { generateRegistrationNumber } from "../utils/eventRegistrationNumber.js";
import {
  generateRegistrationPublicToken,
  ensureRegistrationPublicToken,
  getRegistrationPublicUrl,
} from "../utils/registrationToken.js";
import { getPagination, buildPaginationMeta } from "../utils/pagination.js";
import buildSearchQuery from "../utils/search.js";

// helper function for Conference reminder email
const sendRegistrationSuccessEmail = async (registration, event) => {
  await sendEmailWithTemplate({
    to: registration.email,
    name: registration.name,

    templateKey:
      "2518b.554b0da719bc314.k1.eb0a3fd0-9198-11f1-94bd-ae9c7e0b6a9f.19fd737144d",

    mergeInfo: {
      name: registration.name,
      eventName: event.eventName,
      registrationNumber: registration.regNum,

      startDate: getIndianFormattedDateTime(event.startDateTime),

      endDate: getIndianFormattedDateTime(event.endDateTime),
    },
  });
};

/* 
========================================================
  1. Get Prefilled Registration Form (User)
========================================================*/
export const getPrefilledRegistrationForm = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate("venueName", "name"); // Corrected field

    if (!event) return res.status(404).json({ message: "Event not found" });

    const user = await User.findById(userId).select(
      "name prefix gender email mobile designation affiliation mciNumber mciState department country address city state pincode",
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    const slabs = await RegistrationSlab.find({ eventId }).sort({
      createdAt: -1,
    });

    const prefilledData = {
      name: user.name || "",
      prefix: user.prefix || "",
      gender: user.gender || "",
      email: user.email || "",
      mobile: user.mobile || "",
      designation: user.designation || "",
      affiliation: user.affiliation || "",
      mciNumber: user.mciNumber || "",
      mciState: user.mciState || "",
      department: user.department || "",
      country: user.country || "",
      address: user.address || "",
      state: user.state || "",
      city: user.city || "",
      pincode: user.pincode || "",
    };

    res.status(200).json({
      success: true,
      message: "Prefilled registration form data fetched successfully",
      data: { event, slabs, user: prefilledData },
    });
  } catch (error) {
    console.error("Get prefilled registration form error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* 
========================================================
  2. Register for an Event (User)
========================================================*/
export const registerForEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // ===============================
    // Build file map from multer.any()
    // ===============================
    const fileMap = {};
    (req.files || []).forEach((file) => {
      fileMap[file.fieldname] = fileMap[file.fieldname] || [];
      fileMap[file.fieldname].push(file);
    });

    // ===============================
    // Registration Slab ID
    // ===============================
    let { registrationSlabId } = req.body;

    if (!registrationSlabId && req.query.registrationSlabId) {
      registrationSlabId = req.query.registrationSlabId;
    }

    if (!registrationSlabId) {
      return res.status(400).json({
        message: "registrationSlabId is required",
      });
    }

    const {
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
      additionalAnswers,
    } = req.body;

    // ===============================
    // Validate Card Profile
    // ===============================
    if (!cardProfileId) {
      return res.status(400).json({
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
        message: "Active card profile not found",
      });
    }

    // ===============================
    // Validate Slab
    // ===============================
    const slab = await RegistrationSlab.findById(registrationSlabId);

    if (!slab) {
      return res.status(404).json({
        message: "Selected slab does not exist",
      });
    }

    if (slab.eventId.toString() !== eventId) {
      return res.status(400).json({
        message: "This slab does not belong to the selected event",
      });
    }

    // ===============================
    // Validate Slab DateTime
    // ===============================
    const now = moment();

    const slabStart = moment(slab.startDateTime);
    const slabEnd = moment(slab.endDateTime);

    // Safety check
    if (!slabStart.isValid() || !slabEnd.isValid()) {
      return res.status(400).json({
        message: "Invalid slab dateTime configuration",
      });
    }

    // Logical check
    if (slabEnd.isBefore(slabStart)) {
      return res.status(400).json({
        message: "Slab endDateTime must be greater than startDateTime",
      });
    }

    if (now.isBefore(slabStart)) {
      return res.status(400).json({
        message: `Registration will start on ${getIndianFormattedDate(slab.startDateTime)}`,
      });
    }

    if (now.isAfter(slabEnd)) {
      return res.status(400).json({
        message: `Registration ended on ${getIndianFormattedDate(slab.endDateTime)}`,
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
        message: "You have already paid for this event",
      });
    }

    // ===============================
    // Validate Additional Answers
    // ===============================
    let validatedAdditionalAnswers = [];

    if (slab.needAdditionalInfo && slab.additionalFields.length > 0) {
      let parsedAdditional = [];

      if (typeof additionalAnswers === "string") {
        try {
          parsedAdditional = JSON.parse(additionalAnswers);
        } catch {
          return res.status(400).json({
            message: "Invalid JSON format for additionalAnswers",
          });
        }
      } else if (Array.isArray(additionalAnswers)) {
        parsedAdditional = additionalAnswers;
      }

      for (const field of slab.additionalFields) {
        const answered = parsedAdditional.find(
          (a) => Number(a.id) === Number(field.id),
        );

        const fileKey = `file_${field.id}`;
        const fileData = fileMap?.[fileKey]?.[0];

        if (field.type === "upload") {
          if (!fileData) {
            return res.status(400).json({
              message: `File upload required for: ${field.label}`,
            });
          }

          const MAX_FILE_SIZE_MB = 5;
          const fileSizeInMB = fileData.size / (1024 * 1024);

          if (fileSizeInMB > MAX_FILE_SIZE_MB) {
            return res.status(400).json({
              message: `${field.label} file must be less than ${MAX_FILE_SIZE_MB} MB`,
            });
          }

          validatedAdditionalAnswers.push({
            id: field.id,
            label: field.label,
            type: field.type,
            value: null,
            fileUrl: fileData.location,
          });
        } else {
          if (
            !answered ||
            answered.value === undefined ||
            answered.value === ""
          ) {
            return res.status(400).json({
              message: `Value required for: ${field.label}`,
            });
          }

          validatedAdditionalAnswers.push({
            id: field.id,
            label: field.label,
            type: field.type,
            value: answered.value,
            fileUrl: null,
          });
        }
      }
    }

    // ===============================
    // Validate Dynamic Form Answers
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

        if (field.type === "input" && field.inputTypes === "file") {
          if (field.required && !fileUpload) {
            return res.status(400).json({
              message: `File required: ${field.label}`,
            });
          }

          if (fileUpload && field.maxFileSize) {
            const fileSizeInMB = fileUpload.size / (1024 * 1024);

            if (fileSizeInMB > field.maxFileSize) {
              return res.status(400).json({
                message: `${field.label} file must be less than ${field.maxFileSize} MB`,
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
            minLength: field.minLength,
            maxLength: field.maxLength,
            minSelected: field.minSelected,
            maxSelected: field.maxSelected,
          });

          continue;
        }

        const value = answered?.value;

        if (field.required && (value === undefined || value === "")) {
          return res.status(400).json({
            message: `Value required: ${field.label}`,
          });
        }

        if (typeof value === "string") {
          if (field.minLength && value.length < field.minLength) {
            return res.status(400).json({
              message: `${field.label} must be at least ${field.minLength} characters`,
            });
          }

          if (field.maxLength && value.length > field.maxLength) {
            return res.status(400).json({
              message: `${field.label} must be at most ${field.maxLength} characters`,
            });
          }
        }

        if (Array.isArray(value)) {
          if (field.minSelected && value.length < field.minSelected) {
            return res.status(400).json({
              message: `Select at least ${field.minSelected} options for ${field.label}`,
            });
          }

          if (field.maxSelected && value.length > field.maxSelected) {
            return res.status(400).json({
              message: `Select at most ${field.maxSelected} options for ${field.label}`,
            });
          }
        }

        validatedDynamicFormAnswers.push({
          id: field.id,
          label: field.label,
          type: field.type,
          required: field.required,
          value: value ?? null,
          fileUrl: null,
          minLength: field.minLength,
          maxLength: field.maxLength,
          minSelected: field.minSelected,
          maxSelected: field.maxSelected,
        });
      }
    }

    // ======================================================
    // FREE SLAB FLOW (AUTO COMPLETE REGISTRATION)
    // ======================================================
    if (Number(slab.amount) === 0) {
      const session = await mongoose.startSession();

      let registration;

      try {
        await session.withTransaction(async () => {
          // ==========================================
          // Generate registration number INSIDE transaction
          // ==========================================
          const generatedRegNum = await generateRegistrationNumber(
            event._id,
            session,
          );

          // ==========================================
          // Generate permanent public registration token
          // ==========================================
          const publicToken = generateRegistrationPublicToken();

          // ==========================================
          // Create registration INSIDE same transaction
          // ==========================================
          registration = new EventRegistration({
            userId,
            eventId,
            registrationSlabId,
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

            dynamicFormAnswers: validatedDynamicFormAnswers,
            additionalAnswers: validatedAdditionalAnswers,

            spotRegistration: false,
            isPaid: true,
            regNumGenerated: true,
            regNum: generatedRegNum,
            publicToken,
            isSuspended: false,
            registrationType: "Online Registration",
          });

          await registration.save({ session });
        });
      } finally {
        await session.endSession();
      }

      // ==============================================
      // SEND REGISTRATION SUCCESS WHATSAPP
      // ==============================================
      try {
        if (registration.mobile && registration.regNum) {
          const registrationUrl = getRegistrationPublicUrl(
            registration.publicToken,
          );

          await event.populate({
            path: "venueName",
            select: "venueName venueAddress",
          });

          const venueName = event.venueName?.venueName || "N/A";

          const eventDate = formatWhatsAppEventDate(
            event.startDateTime,
            event.endDateTime,
          );

          const otherInformation = "Contact Registration Desk";

          await sendAIGRegistrationWhatsApp({
            phone: registration.mobile,
            delegateName:
              `${registration.prefix || ""} ${registration.name || ""}`.trim(),
            eventName: event.eventName,
            registrationNumber: registration.regNum,
            eventDate,
            venue: venueName,
            otherInformation,
            registrationUrl,
          });

          registration.whatsappRegistrationSent = true;
          registration.whatsappRegistrationSentAt = new Date();
          registration.whatsappRegistrationStatus = "sent";
          registration.whatsappRegistrationError = undefined;

          await registration.save();
        }
      } catch (whatsappErr) {
        console.error("Registration WhatsApp sending failed:", whatsappErr);

        registration.whatsappRegistrationStatus = "failed";

        registration.whatsappRegistrationError = String(
          whatsappErr?.message || "WhatsApp sending failed",
        ).slice(0, 1000);

        await registration.save();
      }

      // ==============================================
      // SEND ONLY REGISTRATION EMAIL (NO PAYMENT EMAIL)
      // ==============================================
      try {
        await sendEmailWithTemplate({
          to: registration.email,
          name: registration.name,
          templateKey:
            "2518b.554b0da719bc314.k1.f7c9f490-a7f1-11f0-8b9c-8e9a6c33ddc2.199dbf3d259",
          mergeInfo: {
            name: registration.name,
            eventName: event.eventName,
            registrationNumber: registration.regNum,

            startDate: getIndianFormattedDateTime(event.startDateTime),

            endDate: getIndianFormattedDateTime(event.endDateTime),

            registrationType: registration.registrationType,
            amount: "Free",
          },
        });
      } catch (emailErr) {
        console.error("Free registration email sending failed:", emailErr);
      }

      return res.status(201).json({
        success: true,
        requiresPayment: false,
        message: "Free event registration completed successfully",
        data: registration,
      });
    }

    // ======================================================
    // PAID SLAB FLOW
    // ======================================================
    const registration = await EventRegistration.create({
      userId,
      eventId,
      registrationSlabId,
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
      dynamicFormAnswers: validatedDynamicFormAnswers,
      additionalAnswers: validatedAdditionalAnswers,

      spotRegistration: false,
      isPaid: false,
      regNumGenerated: false,
      isSuspended: false,
      registrationType: "Online Registration",
    });

    res.status(201).json({
      success: true,
      requiresPayment: true,
      message: "Event registration created successfully (payment pending)",
      data: registration,
    });
  } catch (error) {
    console.error("Event registration error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

/* 
========================================================
  3. Get All Paid Registrations for Logged-in User
========================================================*/
export const getMyRegistrations = async (req, res) => {
  try {
    const userId = req.user._id;

    const registrations = await EventRegistration.find({
      userId,
      isPaid: true,
      isSuspended: false,
    })
      .populate({
        path: "eventId",
        select: "eventName shortName startDateTime endDateTime dynamicStatus",
      })
      .populate({
        path: "registrationSlabId",
        select: "slabName amount",
      })
      .populate({
        path: "cardProfileId",
        select: "CardProfileName",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Paid registrations fetched successfully",
      data: registrations,
    });
  } catch (error) {
    console.error("Get paid registrations error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* 
========================================================
  4. Get Registration By ID
========================================================*/
export const getRegistrationById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { registrationId } = req.params;

    const registration = await EventRegistration.findOne({
      _id: registrationId,
      userId,
      isPaid: true,
      isSuspended: false,
    })
      .populate({
        path: "eventId",
        select: "eventName shortName startDateTime endDateTime dynamicStatus",
      })
      .populate({
        path: "registrationSlabId",
        select: "slabName amount",
      })
      .populate({
        path: "cardProfileId",
        select: "CardProfileName",
      });

    if (!registration) {
      return res
        .status(404)
        .json({ message: "Registration not found or unpaid" });
    }

    res.status(200).json({
      success: true,
      message: "Registration fetched successfully",
      data: registration,
    });
  } catch (error) {
    console.error("Get registration by ID error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/*
========================================================
  Get All Paid Registrations for an Event
  Logged-in User
========================================================
*/
export const getRegistrationsByEventForUser = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Validate event
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Pagination
    const { page, limit, skip } = getPagination(req);

    // Search
    const searchQuery = buildSearchQuery(req, ["name", "email", "mobile"]);

    // Final Query
    const query = {
      eventId,
      isPaid: true,
      ...searchQuery,
    };

    // MongoDB
    const [registrations, total] = await Promise.all([
      EventRegistration.find(query)
        .populate({
          path: "registrationSlabId",
          select: "slabName amount",
        })
        .populate({
          path: "sponsorId",
          select: "sponsorName",
        })
        .populate({
          path: "eventAdminId",
          select: "name",
        })
        .populate({
          path: "cardProfileId",
          select: "CardProfileName",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      EventRegistration.countDocuments(query),
    ]);

    // Pagination
    const pagination = buildPaginationMeta(total, page, limit);

    return res.status(200).json({
      success: true,
      message: "All paid registrations fetched successfully",
      event: {
        id: event._id,
        name: event.eventName,
      },
      totalRegistrations: total,
      data: registrations,
      pagination,
    });
  } catch (error) {
    console.error(
      "Get registrations by event for logged-in user error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/* 
========================================================
  5. Get All Paid Registrations for an Event (Event Admin)
========================================================
*/
export const getAllRegistrationsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Validate event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Fetch all paid registrations for this event
    const registrations = await EventRegistration.find({
      eventId,
      isPaid: true,
    })
      .populate({
        path: "registrationSlabId",
        select: "slabName amount",
      })
      .populate({
        path: "sponsorId",
        select: "sponsorName",
      })
      .populate({
        path: "eventAdminId",
        select: "name",
      })
      .populate({
        path: "cardProfileId",
        select: "CardProfileName",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "All paid registrations fetched successfully",
      event: { id: event._id, name: event.eventName },
      totalRegistrations: registrations.length,
      data: registrations,
    });
  } catch (error) {
    console.error("Get all registrations by event error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* 
========================================================
  6. Update Registration Suspension Status (Event Admin)
========================================================
*/
export const updateRegistrationSuspension = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { isSuspended } = req.body;

    // Validate input
    if (typeof isSuspended !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Invalid value for isSuspended. Must be true or false.",
      });
    }

    // Find and update registration
    const registration = await EventRegistration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Event registration not found",
      });
    }

    registration.isSuspended = isSuspended;
    await registration.save();

    res.status(200).json({
      success: true,
      message: `Registration ${
        isSuspended ? "suspended" : "unsuspended"
      } successfully`,
      data: registration,
    });
  } catch (error) {
    console.error("Update registration suspension error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
/* 
========================================================
  7 Event Admin only :- Register User for an Event (eventId in URL, not body)
========================================================*/

export const registerForEventByEventAdmin = async (req, res) => {
  try {
    const { userId } = req.body;
    const { eventId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required for event admin registration",
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // ===============================
    // Build file map from multer.any()
    // ===============================
    const fileMap = {};
    (req.files || []).forEach((file) => {
      fileMap[file.fieldname] = fileMap[file.fieldname] || [];
      fileMap[file.fieldname].push(file);
    });

    // Get slabId from body OR query
    let { registrationSlabId } = req.body;
    if (!registrationSlabId && req.query.registrationSlabId) {
      registrationSlabId = req.query.registrationSlabId;
    }

    if (!registrationSlabId) {
      return res.status(400).json({
        message: "registrationSlabId is required",
      });
    }

    const {
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
      amount,
      additionalAnswers,
    } = req.body;

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

    const slab = await RegistrationSlab.findById(registrationSlabId);
    if (!slab)
      return res.status(404).json({ message: "Selected slab does not exist" });

    if (slab.eventId.toString() !== eventId)
      return res.status(400).json({
        message: "This slab does not belong to the selected event",
      });

    // ===============================
    // Validate Slab DateTime
    // ===============================
    const now = moment();

    const slabStart = moment(slab.startDateTime);
    const slabEnd = moment(slab.endDateTime);

    if (!slabStart.isValid() || !slabEnd.isValid()) {
      return res.status(400).json({
        message: "Invalid slab dateTime configuration",
      });
    }

    if (slabEnd.isBefore(slabStart)) {
      return res.status(400).json({
        message: "Slab endDateTime must be greater than startDateTime",
      });
    }

    if (now.isBefore(slabStart)) {
      return res.status(400).json({
        message: `Registration will start on ${getIndianFormattedDate(slab.startDateTime)}`,
      });
    }

    if (now.isAfter(slabEnd)) {
      return res.status(400).json({
        message: `Registration ended on ${getIndianFormattedDate(slab.endDateTime)}`,
      });
    }

    // Suspended?
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

    // Already Paid?
    const existingPaidReg = await EventRegistration.findOne({
      userId,
      eventId,
      isPaid: true,
    });

    if (existingPaidReg) {
      return res
        .status(400)
        .json({ message: "User already registered and paid for this event" });
    }

    // ===========================
    // Validate Dynamic Fields for Slab + Uploads
    // ===========================
    let validatedAdditionalAnswers = [];

    if (slab.needAdditionalInfo && slab.additionalFields.length > 0) {
      let parsedAdditional = [];
      if (typeof additionalAnswers === "string") {
        try {
          parsedAdditional = JSON.parse(additionalAnswers);
        } catch (error) {
          return res.status(400).json({
            message: "Invalid JSON format for additionalAnswers",
          });
        }
      } else if (Array.isArray(additionalAnswers)) {
        parsedAdditional = additionalAnswers;
      }

      for (const field of slab.additionalFields) {
        const answered = parsedAdditional.find(
          (a) => Number(a.id) === Number(field.id),
        );
        const fileKey = `file_${field.id}`;
        const fileData = fileMap?.[fileKey]?.[0];

        if (field.type === "upload") {
          if (!fileData) {
            return res.status(400).json({
              message: `File upload required for: ${field.label}`,
            });
          }

          // -------------------------------
          // MAX FILE SIZE VALIDATION (5 MB)
          // -------------------------------
          const MAX_FILE_SIZE_MB = 5;
          const fileSizeInMB = fileData.size / (1024 * 1024);

          if (fileSizeInMB > MAX_FILE_SIZE_MB) {
            return res.status(400).json({
              message: `${field.label} file must be less than ${MAX_FILE_SIZE_MB} MB`,
            });
          }

          validatedAdditionalAnswers.push({
            id: field.id,
            label: field.label,
            type: field.type,
            value: null,
            fileUrl: fileData.location,
          });
        } else {
          if (
            !answered ||
            answered.value === undefined ||
            answered.value === ""
          ) {
            return res.status(400).json({
              message: `Value required for: ${field.label}`,
            });
          }

          validatedAdditionalAnswers.push({
            id: field.id,
            label: field.label,
            type: field.type,
            value: answered.value,
            fileUrl: null,
          });
        }
      }
    }
    // ===============================
    // VALIDATE Dynamic Form
    // ===============================
    const dynamicForm = await DynamicRegForm.findOne({ eventId });
    let validatedDynamicFormAnswers = [];

    if (dynamicForm && dynamicForm.fields.length > 0) {
      let parsedDynamic = [];
      if (typeof req.body.dynamicFormAnswers === "string") {
        try {
          parsedDynamic = JSON.parse(req.body.dynamicFormAnswers);
        } catch {
          return res
            .status(400)
            .json({ message: "Invalid JSON format for dynamicFormAnswers" });
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

        // ===============================
        // FILE TYPE FIELD

        // ===============================
        if (field.type === "input" && field.inputTypes === "file") {
          // required file
          if (field.required && !fileUpload) {
            return res.status(400).json({
              message: `File required: ${field.label}`,
            });
          }

          // maxFileSize validation (ONLY if defined)
          if (fileUpload && field.maxFileSize) {
            const fileSizeInMB = fileUpload.size / (1024 * 1024);
            if (fileSizeInMB > field.maxFileSize) {
              return res.status(400).json({
                message: `${field.label} file must be less than ${field.maxFileSize} MB`,
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
            minLength: field.minLength,
            maxLength: field.maxLength,
            minSelected: field.minSelected,
            maxSelected: field.maxSelected,
          });

          continue;
        }

        // ===============================
        // NON-FILE FIELD
        // ===============================
        const value = answered?.value;

        // required validation
        if (field.required && (value === undefined || value === "")) {
          return res.status(400).json({
            message: `Value required: ${field.label}`,
          });
        }

        // -------------------------------
        // STRING LENGTH VALIDATION
        // -------------------------------
        if (typeof value === "string") {
          if (field.minLength && value.length < field.minLength) {
            return res.status(400).json({
              message: `${field.label} must be at least ${field.minLength} characters`,
            });
          }

          if (field.maxLength && value.length > field.maxLength) {
            return res.status(400).json({
              message: `${field.label} must be at most ${field.maxLength} characters`,
            });
          }
        }

        // -------------------------------
        // CHECKBOX / MULTI-SELECT
        // -------------------------------
        if (Array.isArray(value)) {
          if (field.minSelected && value.length < field.minSelected) {
            return res.status(400).json({
              message: `Select at least ${field.minSelected} options for ${field.label}`,
            });
          }

          if (field.maxSelected && value.length > field.maxSelected) {
            return res.status(400).json({
              message: `Select at most ${field.maxSelected} options for ${field.label}`,
            });
          }
        }

        validatedDynamicFormAnswers.push({
          id: field.id,
          label: field.label,
          type: field.type,
          required: field.required,
          value: value ?? null,
          fileUrl: null,
          minLength: field.minLength,
          maxLength: field.maxLength,
          minSelected: field.minSelected,
          maxSelected: field.maxSelected,
        });
      }
    }

    const session = await mongoose.startSession();

    let registration;
    let generatedRegNum;

    try {
      await session.withTransaction(async () => {
        generatedRegNum = await generateRegistrationNumber(event._id, session);

        // ==========================================
        // Generate permanent public registration token
        // ==========================================
        const publicToken = generateRegistrationPublicToken();

        registration = new EventRegistration({
          eventAdminId: req.user._id,
          userId,
          eventId,
          registrationSlabId,
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
          amount,
          additionalAnswers,

          isPaid: true,
          regNumGenerated: true,
          regNum: generatedRegNum,
          publicToken,
          isSuspended: false,
          registrationType: "Offline Registration",
        });

        await registration.save({ session });
      });
    } finally {
      await session.endSession();
    }

    // ----------------------------------------------------
    // Send WhatsApp Notification to User
    // ----------------------------------------------------
    try {
      if (!registration.mobile || !registration.regNum) {
        throw new Error(
          "Registration mobile number or registration number is missing",
        );
      }

      if (!registration.publicToken) {
        throw new Error("Registration public token is missing");
      }

      const whatsappEvent = await Event.findById(eventId).populate({
        path: "venueName",
        select: "venueName venueAddress",
      });

      if (!whatsappEvent) {
        throw new Error("Event not found");
      }

      const registrationUrl = getRegistrationPublicUrl(
        registration.publicToken,
      );

      const venueName = whatsappEvent.venueName?.venueName || "N/A";

      const eventDate = formatWhatsAppEventDate(
        whatsappEvent.startDateTime,
        whatsappEvent.endDateTime,
      );

      const otherInformation = "Contact Registration Desk";

      await sendAIGRegistrationWhatsApp({
        phone: registration.mobile,
        delegateName:
          `${registration.prefix || ""} ${registration.name || ""}`.trim(),
        eventName: whatsappEvent.eventName,
        registrationNumber: registration.regNum,
        eventDate,
        venue: venueName,
        otherInformation,
        registrationUrl,
      });

      registration.whatsappRegistrationSent = true;
      registration.whatsappRegistrationSentAt = new Date();
      registration.whatsappRegistrationStatus = "sent";
      registration.whatsappRegistrationError = undefined;

      await registration.save();

      console.log(
        "Event admin registration WhatsApp sent successfully:",
        registration.regNum,
      );
    } catch (whatsappError) {
      console.error(
        "Event admin registration WhatsApp sending failed:",
        whatsappError,
      );

      try {
        registration.whatsappRegistrationStatus = "failed";

        registration.whatsappRegistrationError = String(
          whatsappError?.message || "WhatsApp sending failed",
        ).slice(0, 1000);

        await registration.save();
      } catch (trackingError) {
        console.error("Failed to save WhatsApp failure status:", trackingError);
      }
    }

    // -----------------------------
    // SAFE FALLBACKS (IMPORTANT)
    // -----------------------------
    const finalEmail = email || targetUser.email;
    const finalName = name || targetUser.name;

    // ----------------------------------------------------
    // Send Registration Confirmation Email to User
    // ----------------------------------------------------
    try {
      await sendEmailWithTemplate({
        to: finalEmail,
        name: finalName,
        templateKey:
          "2518b.554b0da719bc314.k1.f7c9f490-a7f1-11f0-8b9c-8e9a6c33ddc2.199dbf3d259",

        mergeInfo: {
          name: finalName,

          eventName: event.eventName,

          startDate: getIndianFormattedDateTime(event.startDateTime),

          endDate: getIndianFormattedDateTime(event.endDateTime),

          registrationNumber: generatedRegNum,

          registrationType: registration.registrationType,

          amount: amount || "Free",
        },
      });
    } catch (emailError) {
      console.error(
        "Event admin registration email sending failed:",
        emailError,
      );
    }

    res.status(201).json({
      success: true,
      message: "Event registration created successfully by event admin",
      data: registration,
    });
  } catch (error) {
    console.error("Event registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// =====================================
//  8. CHECK EMAIL EXISTS FOR EVENT REGISTRATION (Protected) (for bulk registration)
// =====================================
export const checkEmailRegister = async (req, res) => {
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
    // 1️ CHECK EVENT REGISTRATION (PAID)
    // ===============================
    const existingRegistration = await EventRegistration.findOne({
      eventId,
      email: normalizedEmail,
      isPaid: true,
      isSuspended: false,
    });

    if (existingRegistration) {
      return res.status(200).json({
        success: false,
        message: "This email is already registered for this event",
      });
    }

    // ===============================
    // 2️ CHECK USER MODEL
    // ===============================
    const user = await User.findOne({
      email: normalizedEmail,
      role: "user",
    }).select(
      "-password -plainPassword -passwordResetToken -passwordResetExpires -otp -otpExpires",
    );

    // ===============================
    // 3️ RESPONSE
    // ===============================
    return res.status(200).json({
      success: true,
      message: user
        ? "User exist but not registered for this event"
        : "User not found",
      data: user || null,
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
//  9. ADD EVENT REGISTRATION (Protected) (Bulk registration)
// ======================================
export const bulkRegisterForEventByEventAdmin = async (req, res) => {
  try {
    const eventAdminId = req.user._id;
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

    const session = await mongoose.startSession();

    let registration;
    let generatedRegNum;

    try {
      await session.withTransaction(async () => {
        generatedRegNum = await generateRegistrationNumber(event._id, session);

        // ==========================================
        // Generate permanent public registration token
        // ==========================================
        const publicToken = generateRegistrationPublicToken();

        registration = new EventRegistration({
          eventAdminId,
          userId,
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
          publicToken,
          registrationType: "Offline Registration",
        });

        await registration.save({ session });
      });
    } finally {
      await session.endSession();
    }

    // ----------------------------------------------------
    // Send WhatsApp Notification to User
    // ----------------------------------------------------
    try {
      if (!registration.mobile || !registration.regNum) {
        throw new Error(
          "Registration mobile number or registration number is missing",
        );
      }

      if (!registration.publicToken) {
        throw new Error("Registration public token is missing");
      }

      const whatsappEvent = await Event.findById(eventId).populate({
        path: "venueName",
        select: "venueName venueAddress",
      });

      if (!whatsappEvent) {
        throw new Error("Event not found");
      }

      const registrationUrl = getRegistrationPublicUrl(
        registration.publicToken,
      );

      const venueName = whatsappEvent.venueName?.venueName || "N/A";

      const eventDate = formatWhatsAppEventDate(
        whatsappEvent.startDateTime,
        whatsappEvent.endDateTime,
      );

      const otherInformation = "Contact Registration Desk";

      await sendAIGRegistrationWhatsApp({
        phone: registration.mobile,
        delegateName:
          `${registration.prefix || ""} ${registration.name || ""}`.trim(),
        eventName: whatsappEvent.eventName,
        registrationNumber: registration.regNum,
        eventDate,
        venue: venueName,
        otherInformation,
        registrationUrl,
      });

      registration.whatsappRegistrationSent = true;
      registration.whatsappRegistrationSentAt = new Date();
      registration.whatsappRegistrationStatus = "sent";
      registration.whatsappRegistrationError = undefined;

      await registration.save();

      console.log(
        "Bulk admin registration WhatsApp sent successfully:",
        registration.regNum,
      );
    } catch (whatsappError) {
      console.error(
        "Bulk admin registration WhatsApp sending failed:",
        whatsappError,
      );

      try {
        registration.whatsappRegistrationStatus = "failed";

        registration.whatsappRegistrationError = String(
          whatsappError?.message || "WhatsApp sending failed",
        ).slice(0, 1000);

        await registration.save();
      } catch (trackingError) {
        console.error("Failed to save WhatsApp failure status:", trackingError);
      }
    }

    // -----------------------------
    // SAFE FALLBACKS (IMPORTANT)
    // -----------------------------
    const finalEmail = email || targetUser.email;
    const finalName = name || targetUser.name;

    // ----------------------------------------------------
    // Send Registration Confirmation Email to User
    // ----------------------------------------------------
    try {
      await sendEmailWithTemplate({
        to: finalEmail,
        name: finalName,
        templateKey:
          "2518b.554b0da719bc314.k1.f7c9f490-a7f1-11f0-8b9c-8e9a6c33ddc2.199dbf3d259",

        mergeInfo: {
          name: finalName,
          eventName: event.eventName,

          startDate: getIndianFormattedDateTime(event.startDateTime),

          endDate: getIndianFormattedDateTime(event.endDateTime),

          registrationNumber: generatedRegNum,
          registrationType: registration.registrationType,
          amount: "Free",
        },
      });
    } catch (emailError) {
      console.error(
        "Bulk admin registration email sending failed:",
        emailError,
      );
    }

    return res.status(201).json({
      success: true,
      message: "Event registration created successfully by event admin",
      data: registration,
    });
  } catch (error) {
    console.error("Sponsor registration error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ======================================
//  10. ADD EVENT REGISTRATION (Protected) (On-Spot registration)
// ======================================
export const onSpotRegisterForEventByEventAdmin = async (req, res) => {
  try {
    const eventAdminId = req.user._id;
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

    const session = await mongoose.startSession();

    let registration;
    let generatedRegNum;

    try {
      await session.withTransaction(async () => {
        generatedRegNum = await generateRegistrationNumber(event._id, session);

        // ==========================================
        // Generate permanent public registration token
        // ==========================================
        const publicToken = generateRegistrationPublicToken();

        registration = new EventRegistration({
          eventAdminId,
          userId,
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
          isSuspended: false,
          publicToken,
          registrationType: "On-Spot Registration",
        });

        await registration.save({ session });
      });
    } finally {
      await session.endSession();
    }

    // ----------------------------------------------------
    // Send Registration Success WhatsApp
    // ----------------------------------------------------
    try {
      if (!registration.mobile || !registration.regNum) {
        throw new Error(
          "Registration mobile number or registration number is missing",
        );
      }

      if (!registration.publicToken) {
        throw new Error("Registration public token is missing");
      }

      const registrationUrl = getRegistrationPublicUrl(
        registration.publicToken,
      );

      const venueName = event.venueName?.venueName || "N/A";

      const eventDate = formatWhatsAppEventDate(
        event.startDateTime,
        event.endDateTime,
      );

      const otherInformation = "Contact Registration Desk";

      await sendAIGRegistrationWhatsApp({
        phone: registration.mobile,
        delegateName:
          `${registration.prefix || ""} ${registration.name || ""}`.trim(),
        eventName: event.eventName,
        registrationNumber: registration.regNum,
        eventDate,
        venue: venueName,
        otherInformation,
        registrationUrl,
      });

      registration.whatsappRegistrationSent = true;
      registration.whatsappRegistrationSentAt = new Date();
      registration.whatsappRegistrationStatus = "sent";
      registration.whatsappRegistrationError = undefined;

      await registration.save();

      console.log(
        "On-spot registration WhatsApp sent successfully:",
        registration.regNum,
      );
    } catch (whatsappError) {
      console.error(
        "On-spot registration WhatsApp sending failed:",
        whatsappError,
      );

      try {
        registration.whatsappRegistrationStatus = "failed";
        registration.whatsappRegistrationError = String(
          whatsappError?.message || "WhatsApp sending failed",
        ).slice(0, 1000);

        await registration.save();
      } catch (trackingError) {
        console.error("Failed to save WhatsApp failure status:", trackingError);
      }
    }

    // -----------------------------
    // SAFE FALLBACKS (IMPORTANT)
    // -----------------------------
    const finalEmail = email || targetUser.email;
    const finalName = name || targetUser.name;

    // ----------------------------------------------------
    // Send Registration Confirmation Email to User
    // ----------------------------------------------------
    try {
      await sendEmailWithTemplate({
        to: finalEmail,
        name: finalName,
        templateKey:
          "2518b.554b0da719bc314.k1.f7c9f490-a7f1-11f0-8b9c-8e9a6c33ddc2.199dbf3d259",

        mergeInfo: {
          name: finalName,

          eventName: event.eventName,

          startDate: getIndianFormattedDateTime(event.startDateTime),

          endDate: getIndianFormattedDateTime(event.endDateTime),

          registrationNumber: generatedRegNum,

          registrationType: registration.registrationType,

          amount: "Free",
        },
      });
    } catch (emailError) {
      console.error("On-spot registration email sending failed:", emailError);
    }

    return res.status(201).json({
      success: true,
      message: "On-Spot Registration successfull by event admin",
      data: registration,
    });
  } catch (error) {
    console.error("Sponsor registration error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* 
========================================================
  11. Get All Registrations for an Event per eventAdmin (Event Admin)
========================================================
*/
export const getMyEventAdminRegistrations = async (req, res) => {
  try {
    const eventAdminId = req.user._id;
    const { eventId } = req.params;

    const registrations = await EventRegistration.find({
      eventAdminId,
      eventId,
    })
      .populate({
        path: "cardProfileId",
        select: "CardProfileName",
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      total: registrations.length,
      data: registrations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
========================================================
  Get All Spot Registrations By Event (Event Admin)
========================================================
*/
export const getAllSpotRegistrationsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const registrations = await EventRegistration.find({
      eventId,
      registrationType: "On-Spot Registration",
      isPaid: true,
    })
      .populate({
        path: "cardProfileId",
        select: "CardProfileName",
      })
      .populate({
        path: "eventAdminId",
        select: "name",
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Spot registrations fetched successfully",
      event: {
        id: event._id,
        name: event.eventName,
      },
      totalRegistrations: registrations.length,
      data: registrations,
    });
  } catch (error) {
    console.error("Get spot registrations error:", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

/* 
========================================================
  12. Update Registrations By eventAdmin (Event Admin)
========================================================
*/
export const updateEventRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const restrictedFields = [
      "email",
      "regNum",
      "isPaid",
      "regNumGenerated",
      "registrationType",
    ];

    // Remove restricted fields
    const updateData = { ...req.body };

    restrictedFields.forEach((field) => delete updateData[field]);

    // ==========================================
    // Parse JSON fields from multipart/form-data
    // ==========================================
    if (typeof updateData.dynamicFormAnswers === "string") {
      updateData.dynamicFormAnswers = JSON.parse(updateData.dynamicFormAnswers);
    }

    if (typeof updateData.additionalAnswers === "string") {
      updateData.additionalAnswers = JSON.parse(updateData.additionalAnswers);
    }

    const registration = await EventRegistration.findById(registrationId);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // ===============================
    // Validate cardProfileId
    // ===============================
    if (updateData.cardProfileId) {
      if (!mongoose.Types.ObjectId.isValid(updateData.cardProfileId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid cardProfileId",
        });
      }

      const cardProfile = await CardProfile.findOne({
        _id: updateData.cardProfileId,
        status: "Active",
      });

      if (!cardProfile) {
        return res.status(404).json({
          success: false,
          message: "Active card profile not found",
        });
      }
    }

    Object.assign(registration, updateData);

    await registration.save();

    return res.status(200).json({
      success: true,
      message: "Registration updated successfully",
      data: registration,
    });
  } catch (error) {
    console.error("=================================");
    console.error("UPDATE ERROR");
    console.error(error);
    console.error("MESSAGE:", error?.message);
    console.error("STACK:", error?.stack);
    console.error("=================================");

    return res.status(500).json({
      success: false,
      message: error?.message || "Server error",
    });
  }
};

/* 
========================================================
  13. Update Card Profile of Registration (Event Admin)
========================================================
*/
export const updateRegistrationCardProfile = async (req, res) => {
  try {
    const { eventId } = req.params;

    const { eventRegistrationIds, cardProfileId } = req.body;

    // ===============================
    // Validate all eventRegistrationIds
    // ===============================
    if (
      !Array.isArray(eventRegistrationIds) ||
      eventRegistrationIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "eventRegistrationIds is required",
      });
    }

    const invalidIds = eventRegistrationIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id),
    );

    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: "One or more eventRegistrationIds are invalid",
      });
    }
    // ===============================
    // Validate cardProfileId
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

    const registrations = await EventRegistration.find({
      _id: { $in: eventRegistrationIds },
      eventId,
    });

    if (registrations.length !== eventRegistrationIds.length) {
      return res.status(404).json({
        success: false,
        message:
          "One or more registrations not found or do not belong to this event",
      });
    }

    // ===============================
    // Update Card Profile
    // ===============================
    const result = await EventRegistration.updateMany(
      {
        _id: { $in: eventRegistrationIds },
        eventId,
      },
      {
        $set: {
          cardProfileId,
          cardProfileUpdated: true,
        },
      },
    );

    const updatedRegistrations = await EventRegistration.find({
      _id: { $in: eventRegistrationIds },
      eventId,
    }).populate({
      path: "cardProfileId",
      select: "CardProfileName",
    });

    return res.status(200).json({
      success: true,
      message: "Card profile updated successfully",
      totalUpdated: result.modifiedCount,
      data: updatedRegistrations,
    });
  } catch (error) {
    console.error("Update card profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
========================================================
  14. Get Event Visitors Not Registered
========================================================
*/
export const getEventVisitorsNotRegistered = async (req, res) => {
  try {
    const { eventId } = req.params;

    // event exists?
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // all visitors
    const visitors = await EventVisitor.find({
      eventId,
    }).populate({
      path: "userId",
      select:
        "prefix name email mobile designation affiliation department city state country",
    });

    // registered users
    const registrations = await EventRegistration.find({
      eventId,
      isPaid: true,
      isSuspended: false,
    }).select("userId");

    const registeredUserIds = registrations.map((r) => r.userId.toString());

    // filter non registered users
    const nonRegisteredVisitors = visitors.filter(
      (visitor) => !registeredUserIds.includes(visitor.userId._id.toString()),
    );

    return res.status(200).json({
      success: true,
      total: nonRegisteredVisitors.length,
      data: nonRegisteredVisitors,
    });
  } catch (error) {
    console.error("Get visitors error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
========================================================
  15. Send Reminder Emails
========================================================
*/

export const sendReminderEmails = async (req, res) => {
  try {
    const { eventId } = req.params;

    // event
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // visitors
    const visitors = await EventVisitor.find({
      eventId,
    }).populate("userId");

    // registrations
    const registrations = await EventRegistration.find({
      eventId,
      isPaid: true,
      isSuspended: false,
    }).select("userId");

    const registeredUserIds = registrations.map((r) => r.userId.toString());

    // filter only not registered
    const pendingVisitors = visitors.filter(
      (visitor) => !registeredUserIds.includes(visitor.userId._id.toString()),
    );

    let totalSent = 0;

    for (const visitor of pendingVisitors) {
      const user = visitor.userId;

      if (!user?.email) continue;

      try {
        await sendEmailWithTemplate({
          to: user.email,
          name: user.name,
          templateKey:
            "2518b.554b0da719bc314.k1.e0feee90-5116-11f1-a7f9-fa912d477de9.19e3074abf9",
          mergeInfo: {
            name: user.name,
            eventId: event._id.toString(),
            eventName: event.eventName,
            startDate: getIndianFormattedDateTime(event.startDateTime),
            endDate: getIndianFormattedDateTime(event.endDateTime),
          },
        });

        // =========================
        // UPDATE REMINDER STATUS
        // =========================
        visitor.reminderEmailSent = true;

        await visitor.save();

        totalSent++;
      } catch (emailError) {
        console.error(`Email failed for ${user.email}`, emailError);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Reminder emails sent successfully",
      totalSent,
    });
  } catch (error) {
    console.error("Reminder email error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
========================================================
 16. Send Reminder Email To Single User
========================================================
*/
export const sendReminderEmailToSingleUser = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    // =========================
    // EVENT
    // =========================
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // =========================
    // USER
    // =========================
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =========================
    // CHECK VISITOR EXISTS
    // =========================
    const visitor = await EventVisitor.findOne({
      eventId,
      userId,
    });

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "User did not visit this event",
      });
    }

    // =========================
    // CHECK ALREADY REGISTERED
    // =========================
    const registration = await EventRegistration.findOne({
      eventId,
      userId,
      isPaid: true,
      isSuspended: false,
    });

    if (registration) {
      return res.status(400).json({
        success: false,
        message: "User already registered for this event",
      });
    }

    // =========================
    // SEND EMAIL
    // =========================
    await sendEmailWithTemplate({
      to: user.email,
      name: user.name,

      templateKey:
        "2518b.554b0da719bc314.k1.e0feee90-5116-11f1-a7f9-fa912d477de9.19e3074abf9",

      mergeInfo: {
        name: user.name,
        eventId: event._id.toString(),
        eventName: event.eventName,
        startDate: getIndianFormattedDateTime(event.startDateTime),
        endDate: getIndianFormattedDateTime(event.endDateTime),
      },
    });

    // =========================
    // UPDATE REMINDER STATUS
    // =========================
    visitor.reminderEmailSent = true;

    await visitor.save();

    return res.status(200).json({
      success: true,
      message: "Reminder email sent successfully",
    });
  } catch (error) {
    console.error("Single reminder email error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* 
========================================================
  17. Get All Card Profile Updated Registrations
========================================================
*/
export const getCardProfileUpdatedRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;

    const registrations = await EventRegistration.find({
      eventId,
      cardProfileUpdated: true,
    })
      .populate({
        path: "cardProfileId",
        select: "CardProfileName",
      })
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      total: registrations.length,
      data: registrations,
    });
  } catch (error) {
    console.error("Get card profile updated registrations error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =====================================
//  18. Send Conference reminder email to single user
// =====================================
export const sendRegistrationEmailToSingleUser = async (req, res) => {
  try {
    const { eventId, registrationId } = req.params;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const registration = await EventRegistration.findOne({
      _id: registrationId,
      eventId,
      isPaid: true,
    });
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }
    await sendRegistrationSuccessEmail(registration, event);
    return res.status(200).json({
      success: true,
      message: "Registration success email sent successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =====================================
//  19. Send Registration Conference reminder Email (Bulk)
// =====================================
export const sendBulkRegistrationSuccessEmails = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if all paid registrations already received bulk email
    const pendingCount = await EventRegistration.countDocuments({
      eventId,
      isPaid: true,
      registrationSuccessEmailSentByAdmin: true,
    });

    if (pendingCount) {
      return res.status(400).json({
        success: false,
        message:
          "Registration success email has already been sent to all registrations for this event.",
      });
    }

    const registrations = await EventRegistration.find({
      eventId,
      isPaid: true,
    });

    let success = 0;
    let failed = 0;

    for (const registration of registrations) {
      try {
        await sendRegistrationSuccessEmail(registration, event);

        registration.registrationSuccessEmailSentByAdmin = true;
        registration.registrationSuccessEmailSentAt = new Date();

        await registration.save();

        success++;
      } catch (err) {
        failed++;
        console.error(`Failed to send email to ${registration.email}:`, err);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Registration success emails sent successfully.",
      total: registrations.length,
      successCount: success,
      failedCount: failed,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/* ============================================
   Send Registration Success WhatsApp Single User
============================================ */
export const sendSingleRegistrationSuccessWhatsApp = async (req, res) => {
  try {
    const { eventId, registrationId } = req.params;

    const registration = await EventRegistration.findOne({
      _id: registrationId,
      eventId,
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    if (!registration.isPaid) {
      return res.status(400).json({
        success: false,
        message: "WhatsApp can only be sent for paid registrations",
      });
    }

    if (registration.isSuspended) {
      return res.status(400).json({
        success: false,
        message: "Cannot send WhatsApp for a suspended registration",
      });
    }

    const event = await Event.findById(eventId).populate({
      path: "venueName",
      select: "venueName venueAddress",
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (!registration.mobile) {
      return res.status(400).json({
        success: false,
        message: "Delegate mobile number is missing",
      });
    }

    if (!registration.regNum) {
      return res.status(400).json({
        success: false,
        message: "Registration number is missing",
      });
    }

    /*
     * Reuse the existing public token.
     *
     * For old registrations created before the public-pass feature,
     * generate the token once and persist it.
     */
    const publicToken = await ensureRegistrationPublicToken(registration);

    const registrationUrl = getRegistrationPublicUrl(publicToken);

    const venueName = event.venueName?.venueName || "N/A";

    const eventDate = formatWhatsAppEventDate(
      event.startDateTime,
      event.endDateTime,
    );

    const otherInformation = "Contact Registration Desk";

    const aisensyResponse = await sendAIGRegistrationWhatsApp({
      phone: registration.mobile,
      delegateName:
        `${registration.prefix || ""} ${registration.name || ""}`.trim(),
      eventName: event.eventName,
      registrationNumber: registration.regNum,
      eventDate,
      venue: venueName,
      otherInformation,
      registrationUrl,
    });

    registration.whatsappRegistrationSent = true;
    registration.whatsappRegistrationSentAt = new Date();
    registration.whatsappRegistrationStatus = "sent";
    registration.whatsappRegistrationError = undefined;

    await registration.save();

    return res.status(200).json({
      success: true,
      message: "Registration WhatsApp sent successfully",
      data: {
        registrationId: registration._id,
        registrationNumber: registration.regNum,
        registrationUrl,
        whatsappResponse: aisensyResponse,
      },
    });
  } catch (error) {
    console.error("Send single registration WhatsApp error:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to send registration WhatsApp",
    });
  }
};

/* ============================================
   Send Registration Success WhatsApp (Bulk)
============================================ */
export const sendBulkRegistrationSuccessWhatsApps = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate({
      path: "venueName",
      select: "venueName venueAddress",
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const registrations = await EventRegistration.find({
      eventId,
      isPaid: true,
      isSuspended: false,
    });

    if (!registrations.length) {
      return res.status(200).json({
        success: true,
        message: "No registrations available for bulk WhatsApp",
        data: {
          total: 0,
          sent: 0,
          failed: 0,
          skipped: 0,
        },
      });
    }

    const venueName = event.venueName?.venueName || "N/A";

    const eventDate = formatWhatsAppEventDate(
      event.startDateTime,
      event.endDateTime,
    );

    const otherInformation = "Contact Registration Desk";

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const registration of registrations) {
      try {
        if (!registration.mobile || !registration.regNum) {
          skipped += 1;
          continue;
        }

        /*
         * Reuse the existing public token.
         *
         * For legacy registrations without a token,
         * create and persist one exactly once.
         */
        const publicToken = await ensureRegistrationPublicToken(registration);

        const registrationUrl = getRegistrationPublicUrl(publicToken);

        const aisensyResponse = await sendAIGRegistrationWhatsApp({
          phone: registration.mobile,
          delegateName:
            `${registration.prefix || ""} ${registration.name || ""}`.trim(),
          eventName: event.eventName,
          registrationNumber: registration.regNum,
          eventDate,
          venue: venueName,
          otherInformation,
          registrationUrl,
        });

        registration.whatsappRegistrationSent = true;
        registration.whatsappRegistrationSentAt = new Date();
        registration.whatsappRegistrationStatus = "sent";
        registration.whatsappRegistrationError = undefined;

        registration.whatsappBulkSent = true;
        registration.whatsappBulkSentAt = new Date();

        await registration.save();

        sent += 1;

        console.log(
          `Registration WhatsApp sent successfully: ${registration.regNum}`,
        );

        /*
         * Keep the response from AiSensy available for debugging
         * without changing the registration response structure.
         */
        void aisensyResponse;
      } catch (error) {
        failed += 1;

        registration.whatsappRegistrationStatus = "failed";

        registration.whatsappRegistrationError =
          error?.message || "Failed to send WhatsApp";

        await registration.save();

        console.error(
          `Bulk WhatsApp failed for registration ${registration._id}:`,
          error,
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Bulk registration WhatsApp process completed",
      data: {
        total: registrations.length,
        sent,
        failed,
        skipped,
      },
    });
  } catch (error) {
    console.error("Send bulk registration WhatsApps error:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to send bulk registration WhatsApps",
    });
  }
};

// ============================================
// Public Registration Pass
// GET /registrations/public/:publicToken
// ============================================
export const getPublicRegistrationByToken = async (req, res) => {
  try {
    const { publicToken } = req.params;

    if (!publicToken) {
      return res.status(400).json({
        success: false,
        message: "Public registration token is required",
      });
    }

    // ==========================================
    // Find only a valid successful registration
    // ==========================================
    const registration = await EventRegistration.findOne({
      publicToken,
      isPaid: true,
      regNumGenerated: true,
      isSuspended: false,
    })
      .select(
        [
          "publicToken",
          "regNum",
          "prefix",
          "name",
          "email",
          "mobile",
          "designation",
          "affiliation",
          "country",
          "city",
          "state",
          "cardProfileId",
          "registrationSlabId",
          "registrationType",
          "createdAt",
          "eventId",
        ].join(" "),
      )
      .populate({
        path: "eventId",
        select:
          "eventName shortName eventCode startDateTime endDateTime venueName",
        populate: {
          path: "venueName",
          select: "venueName venueAddress",
        },
      })
      .populate({
        path: "registrationSlabId",
        select: "slabName amount",
      })
      .populate({
        path: "cardProfileId",
        select: "CardProfileName",
      })
      .lean();

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration pass not found",
      });
    }

    // ==========================================
    // Return only public-safe registration data
    // ==========================================
    return res.status(200).json({
      success: true,
      message: "Registration pass fetched successfully",
      data: {
        registration: {
          publicToken: registration.publicToken,
          registrationNumber: registration.regNum,
          prefix: registration.prefix || "",
          name: registration.name,
          designation: registration.designation,
          affiliation: registration.affiliation,
          registrationType: registration.registrationType,
          registeredAt: registration.createdAt,
          registrationSlab: registration.registrationSlabId
            ? {
                id: registration.registrationSlabId._id,
                name: registration.registrationSlabId.slabName,
                amount: registration.registrationSlabId.amount,
              }
            : null,
          cardProfile: registration.cardProfileId
            ? {
                id: registration.cardProfileId._id,
                name: registration.cardProfileId.CardProfileName,
              }
            : null,
        },

        event: registration.eventId
          ? {
              id: registration.eventId._id,
              eventName: registration.eventId.eventName,
              shortName: registration.eventId.shortName,
              eventCode: registration.eventId.eventCode,
              startDateTime: registration.eventId.startDateTime,
              endDateTime: registration.eventId.endDateTime,
              venue: registration.eventId.venueName
                ? {
                    name: registration.eventId.venueName.venueName,
                    address: registration.eventId.venueName.venueAddress,
                  }
                : null,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Get public registration pass error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
