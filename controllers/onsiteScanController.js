import mongoose from "mongoose";
import OnsiteBadge from "../models/OnsiteBadge.js";
import ScanType from "../models/ScanType.js";
import BadgeProfilePrivilege from "../models/BadgeProfilePrivilege.js";
import BadgeScanLog from "../models/BadgeScanLog.js";

// =====================================
// BADGE SCAN
// =====================================
export const scanBadge = async (req, res) => {
  try {
    const { regNum, scanTypeId } = req.body;
    const eventId = req.onsite.eventId;
    const scannedBy = req.onsite.id;

    if (!regNum || !scanTypeId) {
      return res.status(400).json({
        success: false,
        message: "regNum and scanTypeId are required",
      });
    }

    // =================================
    // FIND BADGE
    // =================================
    const badge = await OnsiteBadge.findOne({
      eventId,
      regNum,
      isDeleted: false,
      isSuspended: false,
    });

    if (!badge) {
      return res.status(404).json({
        success: false,
        message: "Badge not found",
      });
    }

    // =================================
    // FIND SCAN TYPE
    // =================================
    const scanType = await ScanType.findOne({
      _id: scanTypeId,
      eventId,
      status: "Active",
      isDeleted: false,
    });

    if (!scanType) {
      return res.status(404).json({
        success: false,
        message: "Scan type not found",
      });
    }

    // =================================
    // CHECK PRIVILEGE
    // =================================
    const privilege = await BadgeProfilePrivilege.findOne({
      eventId,
      badgeProfileId: badge.badgeProfileId,
      scanTypeId,
      isAllowed: true,
      status: "Active",
      isDeleted: false,
    });

    if (!privilege) {
      return res.status(403).json({
        success: false,
        message: `${badge.badgeProfileName} is not allowed for ${scanType.scanType}`,
      });
    }

    // =================================
    // SINGLE MODE CHECK
    // =================================
    if (scanType.scanMode === "single") {
      const alreadyScanned =
        await BadgeScanLog.findOne({
          eventId,
          badgeId: badge._id,
          scanTypeId,
        });

      if (alreadyScanned) {
        return res.status(409).json({
          success: false,
          message: "Already scanned",
          data: {
            scannedAt: alreadyScanned.createdAt,
          },
        });
      }
    }

    // =================================
    // MULTIPLE MODE
    // =================================
    let scanLog =
      await BadgeScanLog.findOne({
        eventId,
        badgeId: badge._id,
        scanTypeId,
      });

    if (scanLog) {
      scanLog.scanCount += 1;

      await scanLog.save();
    } else {
      scanLog = await BadgeScanLog.create({
        eventId,
        badgeId: badge._id,
        scanTypeId,
        scannedBy,
        regNum: badge.regNum,
      });
    }

    return res.status(200).json({
      success: true,
      message: `${scanType.scanType} granted`,
      badge: {
        id: badge._id,
        regNum: badge.regNum,
        name: badge.name,
        badgeProfileName: badge.badgeProfileName,
      },
      scanType: {
        id: scanType._id,
        scanType: scanType.scanType,
        scanCode: scanType.scanCode,
      },
      scanLog,
    });
  } catch (error) {
    console.error("SCAN BADGE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to scan badge",
      error: error.message,
    });
  }
};


// =====================================
// SCAN SUMMARY BY EVENT
// =====================================
export const getScanSummary = async (req, res) => {
  try {
    const { eventId } = req.params;
    const data = await BadgeScanLog.aggregate([
      {
        $match: {
          eventId: new mongoose.Types.ObjectId(eventId),
        },
      },
      {
        $group: {
          _id: "$scanTypeId",
          totalScans: {
            $sum: "$scanCount",
          },
        },
      },
      {
        $lookup: {
          from: "scantypes",
          localField: "_id",
          foreignField: "_id",
          as: "scanType",
        },
      },
      {
        $unwind: "$scanType",
      },
      {
        $project: {
          _id: 0,
          scanTypeId: "$scanType._id",
          scanType: "$scanType.scanType",
          scanCode: "$scanType.scanCode",
          totalScans: 1,
        },
      },
      {
        $sort: {
          totalScans: -1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      total: data.length,
      data,
    });
  } catch (error) {
    console.error("SCAN SUMMARY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch scan summary",
      error: error.message,
    });
  }
};