import axios from "axios";
import mongoose from "mongoose";
import XLSX from "xlsx";
import OnsiteBadge from "../models/OnsiteBadge.js";
import CardProfile from "../models/CardProfile.js";
import QRCode from "qrcode";
import Event from "../models/Event.js";
import sendEmailWithTemplate from "../utils/sendEmail.js";
import {
  getIndianFormattedDateTime,
  formatWhatsAppEventDate,
} from "../utils/dateUtils.js";
import {
  generateRegistrationPublicToken,
  ensureRegistrationPublicToken,
  getRegistrationPublicUrl,
} from "../utils/registrationToken.js";

import { sendAIGRegistrationWhatsApp } from "../utils/aisensyWhatsApp.js";

export const importRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event id",
      });
    }

    // FETCH REGISTRATIONS
    const registrationResponse = await axios.get(
      `${process.env.BASE_URL}/api/event-admin/events/${eventId}/registrations`,
      {
        headers: {
          Authorization: req.headers.authorization,
        },
      },
    );

    const registrations = registrationResponse?.data?.data || [];

    if (!registrations.length) {
      return res.status(404).json({
        success: false,
        message: "No registrations found",
      });
    }

    const operations = [];

    let importedCount = 0;
    let updatedCount = 0;

    for (const registration of registrations) {
      let badgeProfileId = null;
      let badgeProfileName = "Delegate";

      // POPULATED OBJECT
      if (
        registration?.cardProfileId &&
        typeof registration.cardProfileId === "object" &&
        registration.cardProfileId?.CardProfileName
      ) {
        badgeProfileId = registration.cardProfileId._id || null;
        badgeProfileName =
          registration.cardProfileId.CardProfileName || "Delegate";
      } else if (registration?.cardProfileId) {
        // RAW OBJECT ID
        const badgeProfile = await CardProfile.findById(
          registration.cardProfileId,
        ).select("_id CardProfileName");

        if (badgeProfile) {
          badgeProfileId = badgeProfile._id;
          badgeProfileName = badgeProfile.CardProfileName || "Delegate";
        }
      }

      // UNIQUE KEY
      const uniqueCompositeKey = `${eventId}-registration-${registration._id}`;

      // TRANSFORM DATA
      const transformedData = {
        eventId,
        sourceType: "registration",
        sourceId: registration._id,
        prefix: registration.prefix || "",
        name: registration.name || "",
        gender: registration.gender || "",
        email: registration.email || "",
        mobile: registration.mobile || "",
        designation: registration.designation || "",
        affiliation: registration.affiliation || "",
        department: registration.department || "",
        city: registration.city || "",
        state: registration.state || "",
        country: registration.country || "",
        address: registration.address || "",
        pincode: registration.pincode || "",
        mciNumber: registration.mciNumber || "",
        mciState: registration.mciState || "",
        regNum: registration.regNum || "",
        publicToken: registration.publicToken || "",
        registrationType: registration.registrationType || "",

        badgeProfileId,
        badgeProfileName,
        sponsorId: registration?.sponsorId?._id || null,
        sponsorName: registration?.sponsorId?.sponsorName || "",
        parentRegistrationId: registration._id,
        isPaid: registration.isPaid || false,
        isSuspended: registration.isSuspended || false,
        uniqueCompositeKey,
      };

      // CHECK EXISTING
      const alreadyExists = await OnsiteBadge.findOne({
        uniqueCompositeKey,
      }).select("_id");

      if (alreadyExists) {
        updatedCount++;
      } else {
        importedCount++;
      }

      // UPSERT
      operations.push({
        updateOne: {
          filter: {
            uniqueCompositeKey,
          },
          update: {
            $set: transformedData,
          },
          upsert: true,
        },
      });
    }

    // BULK WRITE
    if (operations.length > 0) {
      await OnsiteBadge.bulkWrite(operations);
    }

    return res.status(200).json({
      success: true,
      message: "Registrations imported successfully",
      stats: {
        totalFetched: registrations.length,
        imported: importedCount,
        updated: updatedCount,
      },
    });
  } catch (error) {
    console.error("IMPORT REGISTRATIONS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to import registrations",
      error: error.message,
    });
  }
};

// ===========fetch Accompany ============
export const importAccompanies = async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event id",
      });
    }

    // FETCH ACCOMPANIES API
    const accompanyResponse = await axios.get(
      `${process.env.BASE_URL}/api/accompanies/event-admin/events/${eventId}/paid`,
      {
        headers: {
          Authorization: req.headers.authorization,
        },
      },
    );

    const accompanyData = accompanyResponse?.data?.data || [];
    if (!accompanyData.length) {
      return res.status(404).json({
        success: false,
        message: "No accompanies found",
      });
    }
    const operations = [];

    let importedCount = 0;
    let updatedCount = 0;
    let totalAccompanies = 0;

    for (const item of accompanyData) {
      const registration = item?.registration || {};
      const paidAccompanies = item?.paidAccompanies || [];

      for (const accompany of paidAccompanies) {
        let badgeProfileId = null;
        let badgeProfileName = "Accompany";

        if (accompany.cardProfileId) {
          const badgeProfile = await CardProfile.findById(
            accompany.cardProfileId,
          ).select("_id CardProfileName");

          if (badgeProfile) {
            badgeProfileId = badgeProfile._id;
            badgeProfileName = badgeProfile.CardProfileName || "Accompany";
          }
        }

        totalAccompanies++;
        const uniqueCompositeKey = `${eventId}-accompany-${accompany._id}`;

        // CHECK EXISTING
        const alreadyExists = await OnsiteBadge.findOne({
          uniqueCompositeKey,
        }).select("_id publicToken");

        // REUSE EXISTING TOKEN OR GENERATE NEW TOKEN
        const publicToken =
          alreadyExists?.publicToken || generateRegistrationPublicToken();

        const transformedData = {
          eventId,
          sourceType: "accompany",
          sourceId: accompany._id,
          prefix: accompany.prefix || "",
          name: accompany.fullName || accompany.name || "",
          gender: accompany.gender || "",
          email: accompany.email || "",
          mobile: accompany.mobile || "",
          designation: accompany.designation || "",
          affiliation: registration.affiliation || "",
          department: registration.department || "",
          city: registration.city || "",
          state: registration.state || "",
          country: registration.country || "",
          address: registration.address || "",
          pincode: registration.pincode || "",
          regNum: accompany.regNum || "",
          publicToken,
          registrationType: "Accompany",
          badgeProfileId,
          badgeProfileName,
          sponsorId: registration?.sponsorId?._id || null,
          sponsorName: registration?.sponsorId?.sponsorName || "",
          parentRegistrationId: registration._id,
          isPaid: true,
          isSuspended: false,
          uniqueCompositeKey,
        };

        // CHECK EXISTING
        if (alreadyExists) {
          updatedCount++;
        } else {
          importedCount++;
        }

        // UPSERT
        operations.push({
          updateOne: {
            filter: {
              uniqueCompositeKey,
            },
            update: {
              $set: transformedData,
            },
            upsert: true,
          },
        });
      }
    }

    if (operations.length > 0) {
      await OnsiteBadge.bulkWrite(operations);
    }

    return res.status(200).json({
      success: true,
      message: "Accompanies imported successfully",
      stats: {
        totalFetched: totalAccompanies,
        imported: importedCount,
        updated: updatedCount,
      },
    });
  } catch (error) {
    console.error(
      "IMPORT ACCOMPANIES ERROR:",
      error?.response?.data || error.message,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to import accompanies",
      error: error?.response?.data || error.message,
    });
  }
};

//====== Sponsor CSV / Excel Import ======
export const importSponsorExcel = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { badgeProfileId } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required",
      });
    }

    if (!badgeProfileId) {
      return res.status(400).json({
        success: false,
        message: "Badge profile is required",
      });
    }

    const selectedBadgeProfile = await CardProfile.findById(
      badgeProfileId,
    ).select("_id CardProfileName");

    if (!selectedBadgeProfile) {
      return res.status(404).json({
        success: false,
        message: "Selected badge profile not found",
      });
    }

    // READ FILE FROM S3
    const response = await axios.get(req.file.location, {
      responseType: "arraybuffer",
    });

    // PARSE EXCEL
    const workbook = XLSX.read(response.data, {
      type: "buffer",
    });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
    });

    // EMPTY FILE CHECK
    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty",
      });
    }

    // IMPORT BATCH ID
    const importBatchId = `SPONSOR-${Date.now()}`;

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    const duplicates = [];
    const invalidRows = [];
    const operations = [];

    const localDuplicateSet = new Set();

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const name = String(row.name || "").trim();
      const email = String(row.email || "")
        .trim()
        .toLowerCase();
      const mobile = String(row.mobile || "").trim();
      const designation = String(row.designation || "").trim();
      const affiliation = String(row.affiliation || "").trim();
      const department = String(row.department || "").trim();
      const city = String(row.city || "").trim();
      const state = String(row.state || "").trim();
      const country = String(row.country || "").trim();
      const regNum = String(row.regNum || "").trim();

      if (!name) {
        invalidRows.push({
          row: index + 2,
          reason: "Name is required",
        });
        skipped++;
        continue;
      }

      if (!email && !mobile) {
        invalidRows.push({
          row: index + 2,
          reason: "Email or mobile is required",
        });
        skipped++;
        continue;
      }

      if (!regNum) {
        invalidRows.push({
          row: index + 2,
          reason: "Reg number is required",
        });

        skipped++;
        continue;
      }

      const duplicateKey = `${eventId}-${email}-${mobile}`;
      if (localDuplicateSet.has(duplicateKey)) {
        duplicates.push({
          row: index + 2,
          reason: "Duplicate inside uploaded file",
        });
        skipped++;
        continue;
      }

      localDuplicateSet.add(duplicateKey);

      const existingRecord = await OnsiteBadge.findOne({
        eventId,
        isDeleted: false,
        $or: [...(email ? [{ email }] : []), ...(mobile ? [{ mobile }] : [])],
      }).select("_id regNum publicToken");

      const uniqueCompositeKey = `${eventId}-sponsor_csv-${email}-${mobile}`;

      const publicToken =
        existingRecord?.publicToken || generateRegistrationPublicToken();

      const transformedData = {
        eventId,
        sourceType: "sponsor_csv",
        sourceId: uniqueCompositeKey,
        name,
        email,
        mobile,
        // REG NUM FROM EXCEL
        regNum,
        publicToken,
        designation,
        affiliation,
        department,
        city,
        state,
        country,
        badgeProfileId: selectedBadgeProfile._id,
        badgeProfileName: selectedBadgeProfile.CardProfileName,
        badgePrinted: false,
        printCount: 0,
        isPaid: true,
        isSuspended: false,
        importBatchId,
        uniqueCompositeKey,
      };

      if (existingRecord) {
        updated++;
      } else {
        imported++;
      }

      operations.push({
        updateOne: {
          filter: existingRecord
            ? { _id: existingRecord._id }
            : { uniqueCompositeKey },
          update: {
            $set: transformedData,
          },
          upsert: true,
        },
      });
    }

    if (operations.length > 0) {
      await OnsiteBadge.bulkWrite(operations);
    }

    return res.status(200).json({
      success: true,
      message: "Sponsor excel imported successfully",
      fileUrl: req.file.location,
      badgeProfile: {
        id: selectedBadgeProfile._id,
        name: selectedBadgeProfile.CardProfileName,
      },
      stats: {
        totalRows: rows.length,
        imported,
        updated,
        skipped,
        duplicates,
        invalidRows,
      },
    });
  } catch (error) {
    console.error("SPONSOR IMPORT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to import sponsor excel",
      error: error.message,
    });
  }
};

//==== Add Manual Badge Functionality ====
export const createManualBadge = async (req, res) => {
  try {
    const { eventId } = req.params;

    const { prefix, name, gender, cardProfileId, email, mobile } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!email && !mobile) {
      return res.status(400).json({
        success: false,
        message: "Email or mobile is required",
      });
    }

    // =====================================
    // FETCH EVENT
    // =====================================

    const event = await Event.findById(eventId).select("_id eventCode");

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (!event.eventCode) {
      return res.status(400).json({
        success: false,
        message: "Event code is not configured for this event",
      });
    }

    // =====================================
    // BADGE PROFILE
    // =====================================

    let badgeProfile = await CardProfile.findById(cardProfileId).select(
      "_id CardProfileName",
    );

    if (!badgeProfile) {
      badgeProfile = await CardProfile.findOne({
        CardProfileName: "Delegate",
      }).select("_id CardProfileName");
    }

    // =====================================
    // CHECK DUPLICATE EMAIL / MOBILE
    // =====================================

    const existingRecord = await OnsiteBadge.findOne({
      eventId,
      $or: [...(email ? [{ email }] : []), ...(mobile ? [{ mobile }] : [])],
    });

    if (existingRecord) {
      return res.status(409).json({
        success: false,
        message: "Badge already exists with same email or mobile",
      });
    }

    // =====================================
    // UNIQUE COMPOSITE KEY
    // =====================================

    const uniqueCompositeKey = `${eventId}-manual-${email || ""}-${mobile || ""}`;

    // =====================================
    // GENERATE MANUAL REG NUM
    //
    // FORMAT:
    // EVENTCODE-SPOT-001
    // EVENTCODE-SPOT-002
    // EVENTCODE-SPOT-003
    // =====================================

    const eventCode = event.eventCode.trim();

    const escapedEventCode = eventCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const lastSpotBadge = await OnsiteBadge.findOne({
      eventId,
      sourceType: "manual",
      regNum: {
        $regex: `^${escapedEventCode}-SPOT-\\d+$`,
      },
    })
      .sort({ createdAt: -1 })
      .select("regNum");

    let nextNumber = 1;

    if (lastSpotBadge?.regNum) {
      const match = lastSpotBadge.regNum.match(/(\d+)$/);

      if (match?.[1]) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const regNum = `${eventCode}-SPOT-${String(nextNumber).padStart(3, "0")}`;

    const publicToken = generateRegistrationPublicToken();

    // =====================================
    // CREATE BADGE
    // =====================================

    const newBadge = await OnsiteBadge.create({
      eventId,

      sourceType: "manual",
      sourceId: uniqueCompositeKey,

      prefix: prefix || "Dr",

      name,
      gender,

      email: email || "",
      mobile: mobile || "",

      // NEW FORMAT
      regNum,

      publicToken,

      badgeProfileId: badgeProfile?._id || null,
      badgeProfileName: badgeProfile?.CardProfileName || "Delegate",

      badgePrinted: false,
      printCount: 0,

      isPaid: true,
      isSuspended: false,

      uniqueCompositeKey,
    });

    return res.status(201).json({
      success: true,
      message: "Manual badge created successfully",
      data: newBadge,
    });
  } catch (error) {
    console.error("CREATE MANUAL BADGE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create manual badge",
      error: error.message,
    });
  }
};

//=== Update Manual Badge Functionality ===
export const updateOnsiteBadge = async (req, res) => {
  try {
    const { badgeId } = req.params;
    const { prefix, name, gender, cardProfileId, email, mobile } = req.body;

    const existingBadge = await OnsiteBadge.findById(badgeId);

    if (!existingBadge) {
      return res.status(404).json({
        success: false,
        message: "Badge not found",
      });
    }

    let badgeProfile = await CardProfile.findById(cardProfileId).select(
      "_id CardProfileName",
    );

    if (!badgeProfile) {
      badgeProfile = await CardProfile.findOne({
        CardProfileName: "Delegate",
      }).select("_id CardProfileName");
    }

    const duplicateBadge = await OnsiteBadge.findOne({
      _id: { $ne: badgeId },
      eventId: existingBadge.eventId,
      $or: [...(email ? [{ email }] : []), ...(mobile ? [{ mobile }] : [])],
    });

    if (duplicateBadge) {
      return res.status(409).json({
        success: false,
        message: "Another badge already exists with same email or mobile",
      });
    }

    existingBadge.prefix = prefix || "Dr";
    existingBadge.name = name;
    existingBadge.gender = gender;
    existingBadge.email = email || "";
    existingBadge.mobile = mobile || "";
    existingBadge.badgeProfileId = badgeProfile?._id || null;
    existingBadge.badgeProfileName =
      badgeProfile?.CardProfileName || "Delegate";

    await existingBadge.save();

    return res.status(200).json({
      success: true,
      message: "Badge updated successfully",
      data: existingBadge,
    });
  } catch (error) {
    console.error("UPDATE ONSITE BADGE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update badge",
      error: error.message,
    });
  }
};

//==== Get All Onsite Badges ====
export const getAllOnsiteBadges = async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      search = "",
      sourceType,
      badgePrinted,
      badgeProfileName,
    } = req.query;

    const filter = {
      eventId,
      isDeleted: false,
    };

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
        {
          mobile: {
            $regex: search,
            $options: "i",
          },
        },
        {
          regNum: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    if (sourceType) {
      filter.sourceType = sourceType;
    }
    if (badgePrinted !== undefined) {
      filter.badgePrinted = badgePrinted === "true";
    }
    if (badgeProfileName) {
      filter.badgeProfileName = badgeProfileName;
    }
    const badges = await OnsiteBadge.find(filter).sort({
      createdAt: -1,
    });
    const total = badges.length;
    return res.status(200).json({
      success: true,
      total,
      data: badges,
    });
  } catch (error) {
    console.error("GET ALL ONSITE BADGES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch onsite badges",
      error: error.message,
    });
  }
};

//====================================
// SEND BULK BADGE EMAILS
//====================================
export const sendBulkBadgeEmails = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const badges = await OnsiteBadge.find({
      eventId,
      isDeleted: false,
      isSuspended: false,
      email: {
        $ne: "",
      },
      bulkEmailSent: false,
    });

    if (!badges.length) {
      return res.status(400).json({
        success: false,
        message: "All badge emails already sent",
      });
    }

    let totalSent = 0;
    let failedEmails = [];

    for (const badge of badges) {
      try {
        // const qrCode = await QRCode.toDataURL(badge.regNum) // OLD - USING QR CODE LIBRARY
        const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
          badge.regNum,
        )}`;

        await sendEmailWithTemplate({
          to: badge.email,
          name: badge.name,
          templateKey:
            "2518b.554b0da719bc314.k1.13012a80-54ea-11f1-9ef1-d2cf08f4ca8c.19e4985ed28",

          mergeInfo: {
            name: badge.name,
            regNum: badge.regNum,
            eventName: event.eventName,
            startDateTime: getIndianFormattedDateTime(event.startDateTime),
            endDateTime: getIndianFormattedDateTime(event.endDateTime),
            qrCode,
          },
        });

        badge.bulkEmailSent = true;
        badge.bulkEmailSentAt = new Date();
        await badge.save();
        totalSent++;
      } catch (emailError) {
        console.error(`Badge email failed for ${badge.email}`, emailError);
        failedEmails.push({
          email: badge.email,
          reason: emailError.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Bulk badge emails sent successfully",
      totalSent,
      totalFailed: failedEmails.length,
      failedEmails,
    });
  } catch (error) {
    console.error("SEND BULK BADGE EMAIL ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send bulk badge emails",
      error: error.message,
    });
  }
};

//=======================================
// SEND SINGLE BADGE EMAIL
//=======================================
export const sendSingleBadgeEmail = async (req, res) => {
  try {
    const { badgeId } = req.params;

    const badge = await OnsiteBadge.findById(badgeId);
    if (!badge) {
      return res.status(404).json({
        success: false,
        message: "Badge not found",
      });
    }

    const event = await Event.findById(badge.eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (!badge.email) {
      return res.status(400).json({
        success: false,
        message: "Badge email not found",
      });
    }

    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      badge.regNum,
    )}`;

    await sendEmailWithTemplate({
      to: badge.email,
      name: badge.name,
      templateKey:
        "2518b.554b0da719bc314.k1.13012a80-54ea-11f1-9ef1-d2cf08f4ca8c.19e4985ed28",
      mergeInfo: {
        name: badge.name,
        regNum: badge.regNum,
        eventName: event.eventName,
        startDateTime: getIndianFormattedDateTime(event.startDateTime),
        endDateTime: getIndianFormattedDateTime(event.endDateTime),
        qrCode,
      },
    });

    badge.singleEmailSent = true;
    badge.singleEmailSentAt = new Date();

    await badge.save();

    return res.status(200).json({
      success: true,
      message: "Badge email sent successfully",
    });
  } catch (error) {
    console.error("SEND SINGLE BADGE EMAIL ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send badge email",
      error: error.message,
    });
  }
};

// ======================================================
// SEARCH BADGES
// ======================================================
export const searchOnsiteBadges = async (req, res) => {
  try {
    const { search } = req.query;

    const eventId = req.onsite.eventId;
    if (!search || !search.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search value is required",
      });
    }

    const regex = new RegExp(search.trim(), "i");

    const badges = await OnsiteBadge.find({
      eventId,
      isDeleted: false,
      $or: [
        { name: regex },
        { email: regex },
        { mobile: regex },
        { regNum: regex },
      ],
    })
      .select("-printLogs")
      .limit(50)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: badges.length,
      data: badges,
    });
  } catch (error) {
    console.error("SEARCH BADGE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search badges",
    });
  }
};

// ======================================================
// PRINT BADGE
// ======================================================
export const printBadge = async (req, res) => {
  try {
    const { id } = req.params;

    const eventId = req.onsite.eventId;

    const badge = await OnsiteBadge.findOne({
      _id: id,
      eventId,
      isDeleted: false,
    });

    if (!badge) {
      return res.status(404).json({
        success: false,
        message: "Badge not found",
      });
    }

    badge.badgePrinted = true;
    badge.printCount = (badge.printCount || 0) + 1;
    badge.lastPrintedAt = new Date();
    badge.printLogs.push({
      printedAt: new Date(),
      reason: "Badge Printed",
    });

    await badge.save();

    return res.status(200).json({
      success: true,
      message: "Badge printed successfully",
      data: badge,
    });
  } catch (error) {
    console.error("PRINT BADGE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to print badge",
    });
  }
};

// ============================================
// Send Onsite Badge WhatsApp - Single
// ============================================
export const sendSingleOnsiteBadgeWhatsApp = async (req, res) => {
  try {
    const { eventId, badgeId } = req.params;

    // ==========================================
    // FIND BADGE
    // ==========================================
    const badge = await OnsiteBadge.findOne({
      _id: badgeId,
      eventId,
      isDeleted: false,
    });

    if (!badge) {
      return res.status(404).json({
        success: false,
        message: "Onsite badge not found",
      });
    }

    // ==========================================
    // SUSPENDED CHECK
    // ==========================================
    if (badge.isSuspended) {
      return res.status(400).json({
        success: false,
        message: "Cannot send WhatsApp for a suspended badge",
      });
    }

    // ==========================================
    // MOBILE CHECK
    // ==========================================
    if (!badge.mobile) {
      return res.status(400).json({
        success: false,
        message: "Delegate mobile number is missing",
      });
    }

    // ==========================================
    // REGISTRATION NUMBER CHECK
    // ==========================================
    if (!badge.regNum) {
      return res.status(400).json({
        success: false,
        message: "Registration number is missing",
      });
    }

    // ==========================================
    // PUBLIC TOKEN
    // ==========================================
    let publicToken = badge.publicToken;

    // For old onsite badges without token,
    // generate one and save it.
    if (!publicToken) {
      publicToken = generateRegistrationPublicToken();
      badge.publicToken = publicToken;
      await badge.save();
    }

    // ==========================================
    // PUBLIC REGISTRATION URL
    // ==========================================
    const registrationUrl = getRegistrationPublicUrl(publicToken);

    // ==========================================
    // FETCH EVENT
    // ==========================================
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

    // ==========================================
    // WHATSAPP DATA
    // ==========================================
    const venueName = event.venueName?.venueName || "N/A";

    const eventDate = formatWhatsAppEventDate(
      event.startDateTime,
      event.endDateTime,
    );

    const otherInformation = "Contact Registration Desk";

    // ==========================================
    // SEND WHATSAPP
    // ==========================================
    const aisensyResponse = await sendAIGRegistrationWhatsApp({
      phone: badge.mobile,

      delegateName:
        `${badge.prefix || ""} ${badge.name || ""}`.trim(),

      eventName: event.eventName,

      registrationNumber: badge.regNum,

      eventDate,

      venue: venueName,

      otherInformation,

      registrationUrl,
    });

    // ==========================================
    // UPDATE WHATSAPP STATUS
    // ==========================================
    badge.whatsappSent = true;
    badge.whatsappSentAt = new Date();
    badge.whatsappStatus = "sent";
    badge.whatsappError = null;

    await badge.save();

    return res.status(200).json({
      success: true,
      message: "Onsite badge WhatsApp sent successfully",

      data: {
        badgeId: badge._id,
        registrationNumber: badge.regNum,
        registrationUrl,
        whatsappResponse: aisensyResponse,
      },
    });
  } catch (error) {
    console.error(
      "SEND SINGLE ONSITE BADGE WHATSAPP ERROR:",
      error,
    );

    // Try to save failure status
    try {
      const { badgeId } = req.params;

      const badge = await OnsiteBadge.findById(badgeId);

      if (badge) {
        badge.whatsappStatus = "failed";
        badge.whatsappError = String(
          error?.message || "WhatsApp sending failed",
        ).slice(0, 1000);

        await badge.save();
      }
    } catch (trackingError) {
      console.error(
        "Failed to save onsite WhatsApp failure status:",
        trackingError,
      );
    }

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Failed to send onsite badge WhatsApp",
    });
  }
};


// ============================================
// Send Onsite Badge WhatsApp - Bulk
// ============================================
export const sendBulkOnsiteBadgeWhatsApps = async (req, res) => {
  try {
    const { eventId } = req.params;

    // ==========================================
    // FETCH EVENT
    // ==========================================
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

    // ==========================================
    // FETCH PENDING BADGES
    // ==========================================
    const badges = await OnsiteBadge.find({
      eventId,
      isDeleted: false,
      isSuspended: false,
    });

    if (!badges.length) {
      return res.status(200).json({
        success: true,
        message: "No onsite badges available for bulk WhatsApp",
        data: {
          total: 0,
          sent: 0,
          failed: 0,
          skipped: 0,
        },
      });
    }

    // ==========================================
    // COMMON EVENT DATA
    // ==========================================
    const venueName = event.venueName?.venueName || "N/A";

    const eventDate = formatWhatsAppEventDate(
      event.startDateTime,
      event.endDateTime,
    );

    const otherInformation = "Contact Registration Desk";

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    // ==========================================
    // SEND ONE BY ONE
    // ==========================================
    for (const badge of badges) {
      try {
        // ----------------------------------------
        // VALIDATION
        // ----------------------------------------
        if (!badge.mobile || !badge.regNum) {
          skipped++;
          continue;
        }

        // ----------------------------------------
        // PUBLIC TOKEN
        // ----------------------------------------
        let publicToken = badge.publicToken;

        if (!publicToken) {
          publicToken = generateRegistrationPublicToken();

          badge.publicToken = publicToken;

          await badge.save();
        }

        // ----------------------------------------
        // PUBLIC URL
        // ----------------------------------------
        const registrationUrl =
          getRegistrationPublicUrl(publicToken);

        // ----------------------------------------
        // SEND WHATSAPP
        // ----------------------------------------
        await sendAIGRegistrationWhatsApp({
          phone: badge.mobile,

          delegateName:
            `${badge.prefix || ""} ${badge.name || ""}`.trim(),

          eventName: event.eventName,

          registrationNumber: badge.regNum,

          eventDate,

          venue: venueName,

          otherInformation,

          registrationUrl,
        });

        // ----------------------------------------
        // SUCCESS
        // ----------------------------------------
        badge.whatsappSent = true;
        badge.whatsappSentAt = new Date();
        badge.whatsappStatus = "sent";
        badge.whatsappError = null;

        await badge.save();

        sent++;
      } catch (whatsappError) {
        failed++;

        console.error(
          `Onsite WhatsApp failed for ${badge.mobile}:`,
          whatsappError,
        );

        badge.whatsappStatus = "failed";
        badge.whatsappError = String(
          whatsappError?.message ||
            "WhatsApp sending failed",
        ).slice(0, 1000);

        await badge.save();
      }
    }

    // ==========================================
    // RESPONSE
    // ==========================================
    return res.status(200).json({
      success: true,
      message: "Onsite badge WhatsApp bulk process completed",

      data: {
        total: badges.length,
        sent,
        failed,
        skipped,
      },
    });
  } catch (error) {
    console.error(
      "SEND BULK ONSITE BADGE WHATSAPP ERROR:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Failed to send onsite badge WhatsApp",
    });
  }
};


// ============================================
// Public Onsite Badge Pass
// GET /onsite/badges/public/:publicToken
// ============================================
export const getPublicOnsiteBadgeByToken = async (req, res) => {
  try {
    const { publicToken } = req.params;

    if (!publicToken) {
      return res.status(400).json({
        success: false,
        message: "Public badge token is required",
      });
    }

    // ==========================================
    // Find only a valid onsite badge
    // ==========================================
    const badge = await OnsiteBadge.findOne({
      publicToken,
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
          "city",
          "state",
          "country",
          "registrationType",
          "badgeProfileId",
          "badgeProfileName",
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
        path: "badgeProfileId",
        select: "CardProfileName",
      })
      .lean();

    if (!badge) {
      return res.status(404).json({
        success: false,
        message: "Onsite badge pass not found",
      });
    }

    // ==========================================
    // Return only public-safe badge data
    // ==========================================
    return res.status(200).json({
      success: true,
      message: "Onsite badge pass fetched successfully",

      data: {
        badge: {
          publicToken: badge.publicToken,
          registrationNumber: badge.regNum,

          prefix: badge.prefix || "",
          name: badge.name,
          designation: badge.designation || "",
          affiliation: badge.affiliation || "",

          registrationType: badge.registrationType || "",

          badgeProfile: badge.badgeProfileId
            ? {
                id: badge.badgeProfileId._id,
                name: badge.badgeProfileId.CardProfileName,
              }
            : badge.badgeProfileName
              ? {
                  id: null,
                  name: badge.badgeProfileName,
                }
              : null,

          createdAt: badge.createdAt,
        },

        event: badge.eventId
          ? {
              id: badge.eventId._id,
              eventName: badge.eventId.eventName,
              shortName: badge.eventId.shortName,
              eventCode: badge.eventId.eventCode,
              startDateTime: badge.eventId.startDateTime,
              endDateTime: badge.eventId.endDateTime,

              venue: badge.eventId.venueName
                ? {
                    name: badge.eventId.venueName.venueName,
                    address: badge.eventId.venueName.venueAddress,
                  }
                : null,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Get public onsite badge pass error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};