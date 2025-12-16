import EventRegistration from "../models/EventRegistration.js";
import Event from "../models/Event.js";
import RegistrationSlab from "../models/RegistrationSlab.js";
import DynamicRegForm from "../models/DynamicRegForm.js";
import User from "../models/User.js";
import sendEmailWithTemplate from "../utils/sendEmail.js";
import moment from "moment";

/* 
========================================================
  1. Get Prefilled Registration Form (User or EventAdmin)
========================================================*/
export const getPrefilledRegistrationForm = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate("venueName", "name"); // Corrected field

    if (!event) return res.status(404).json({ message: "Event not found" });

    const user = await User.findById(userId).select(
      "name prefix gender email mobile designation affiliation mealPreference country city state pincode"
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
      country: user.country || "",
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
      name,
      gender,
      email,
      mobile,
      designation,
      affiliation,
      mealPreference,
      country,
      city,
      state,
      address,
      pincode,
      additionalAnswers,
    } = req.body;

    const slab = await RegistrationSlab.findById(registrationSlabId);
    if (!slab)
      return res.status(404).json({ message: "Selected slab does not exist" });

    if (slab.eventId.toString() !== eventId)
      return res.status(400).json({
        message: "This slab does not belong to the selected event",
      });

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
        .json({ message: "You have already paid for this event" });
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
          (a) => Number(a.id) === Number(field.id)
        );
        const fileKey = `file_${field.id}`;
        const fileData = fileMap?.[fileKey]?.[0];

        if (field.type === "upload") {
          if (!fileData) {
            return res.status(400).json({
              message: `File upload required for: ${field.label}`,
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
          (a) => String(a.id) === String(field.id)
        );
        const fileKey = `file_dyn_${field.id}`;
        const fileUpload = fileMap?.[fileKey]?.[0];

        // ===============================
        // FILE TYPE FIELD
        // ===============================
        if (field.type === "file") {

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
            fileUrl: fileUpload ? fileUpload.location : undefined, 
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

    // Create Registration
    const registration = await EventRegistration.create({
      userId,
      eventId,
      registrationSlabId,
      prefix,
      name,
      gender,
      email,
      mobile,
      designation,
      affiliation,
      mealPreference,
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
    });

    res.status(201).json({
      success: true,
      message: "Event registration created successfully (unpaid)",
      data: registration,
    });
  } catch (error) {
    console.error("Event registration error:", error);
    res.status(500).json({ message: "Internal server error" });
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
        select: "eventName shortName startDate endDate dynamicStatus",
      })
      .populate({
        path: "registrationSlabId",
        select: "slabName amount", // Include more fields if needed
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
        select: "eventName shortName startDate endDate dynamicStatus",
      })
      .populate({
        path: "registrationSlabId",
        select: "slabName amount",
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
      message: `Registration ${isSuspended ? "suspended" : "unsuspended"
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
      name,
      gender,
      email,
      mobile,
      designation,
      affiliation,
      mealPreference,
      country,
      city,
      state,
      address,
      pincode,
      amount,
      additionalAnswers,
    } = req.body;

    const slab = await RegistrationSlab.findById(registrationSlabId);
    if (!slab)
      return res.status(404).json({ message: "Selected slab does not exist" });

    if (slab.eventId.toString() !== eventId)
      return res.status(400).json({
        message: "This slab does not belong to the selected event",
      });

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
        .json({ message: "You have already paid for this event" });
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
          (a) => Number(a.id) === Number(field.id)
        );
        const fileKey = `file_${field.id}`;
        const fileData = fileMap?.[fileKey]?.[0];

        if (field.type === "upload") {
          if (!fileData) {
            return res.status(400).json({
              message: `File upload required for: ${field.label}`,
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
          (a) => String(a.id) === String(field.id)
        );
        const fileKey = `file_dyn_${field.id}`;
        const fileUpload = fileMap?.[fileKey]?.[0];

        // ===============================
        // FILE TYPE FIELD

        // ===============================
        if (field.type === "file") {

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
            fileUrl: fileUpload ? fileUpload.location : undefined, 
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

    // ----------------------------------------------------
    //  Generate Registration Number
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

    // Create Registration
    const registration = await EventRegistration.create({
      userId,
      eventId,
      registrationSlabId,
      prefix,
      name,
      gender,
      email,
      mobile,
      designation,
      affiliation,
      mealPreference,
      country,
      city,
      state,
      address,
      pincode,
      amount,
      dynamicFormAnswers: validatedDynamicFormAnswers,
      additionalAnswers: validatedAdditionalAnswers,
      spotRegistration: true,
      isPaid: true,
      regNumGenerated: true,
      isSuspended: false,
      regNum: generatedRegNum,
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
        templateKey: "2518b.554b0da719bc314.k1.6e017640-d986-11f0-8c89-62d0161cbd93.19b20e123a4",
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
      message: "Event registration created successfully by event admin",
      data: registration,
    });
  } catch (error) {
    console.error("Event registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};