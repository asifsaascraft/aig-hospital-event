import ScanType from "../models/ScanType.js";
import Event from "../models/Event.js";

// ======================================
// Create Scan Type
// ======================================
export const createScanType = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { scanType, scanMode, status } = req.body;

    if (!scanType) {
      return res.status(400).json({
        success: false,
        message: "scanType is required",
      });
    }

    if (!scanMode) {
      return res.status(400).json({
        success: false,
        message: "scanMode is required",
      });
    }

    // Check event
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check duplicate
    const existing = await ScanType.findOne({
      eventId,
      scanType: scanType.trim(),
      scanMode,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Scan type already exists for this event",
      });
    }

    const data = await ScanType.create({
      eventId,
      scanType: scanType.trim(),
      scanMode,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Scan type created successfully",
      data,
    });

  } catch (error) {
    console.error("Create ScanType Error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate scan type for this event",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ======================================
// Get All Scan Types By Event
// ======================================
export const getScanTypes = async (req, res) => {
  try {
    const { eventId } = req.params;

    const data = await ScanType.find({ eventId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Scan types fetched successfully",
      data,
    });

  } catch (error) {
    console.error("Get ScanTypes Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ======================================
// Get Active Scan Types By Event
// ======================================
export const getActiveScanTypes = async (req, res) => {
  try {
    const { eventId } = req.params;

    const data = await ScanType.find({
      eventId,
      status: "Active",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Active scan types fetched successfully",
      data,
    });

  } catch (error) {
    console.error("Get Active ScanTypes Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ======================================
// Update Scan Type
// ======================================
export const updateScanType = async (req, res) => {
  try {
    const { id } = req.params;
    const { scanType, scanMode, status } = req.body;

    const existingScanType = await ScanType.findById(id);

    if (!existingScanType) {
      return res.status(404).json({
        success: false,
        message: "Scan type not found",
      });
    }

    // Final values after update
    const finalScanType = scanType
      ? scanType.trim()
      : existingScanType.scanType;

    const finalScanMode = scanMode
      ? scanMode
      : existingScanType.scanMode;

    // Prevent duplicate
    const duplicate = await ScanType.findOne({
      eventId: existingScanType.eventId,
      scanType: finalScanType,
      scanMode: finalScanMode,
      _id: { $ne: id },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Scan type already exists for this event",
      });
    }

    existingScanType.scanType = finalScanType;
    existingScanType.scanMode = finalScanMode;

    if (status) {
      existingScanType.status = status;
    }

    await existingScanType.save();

    res.status(200).json({
      success: true,
      message: "Scan type updated successfully",
      data: existingScanType,
    });

  } catch (error) {
    console.error("Update ScanType Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ======================================
// Delete Scan Type
// ======================================
export const deleteScanType = async (req, res) => {
  try {
    const { id } = req.params;

    const scanType = await ScanType.findById(id);

    if (!scanType) {
      return res.status(404).json({
        success: false,
        message: "Scan type not found",
      });
    }

    await scanType.deleteOne();

    res.status(200).json({
      success: true,
      message: "Scan type deleted successfully",
    });

  } catch (error) {
    console.error("Delete ScanType Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};