import RegistrationSlab from "../models/RegistrationSlab.js";
import Event from "../models/Event.js";
import mongoose from "mongoose";

// =======================
// Create Registration Slab
// =======================
export const createRegistrationSlab = async (req, res) => {
  try {
    const { eventId } = req.params;

    const {
      slabType = "regular",
      slabName,
      description,
      amount,
      AccompanyAmount,
      startDateTime,
      endDateTime,
      needAdditionalInfo,
      additionalFields,
    } = req.body;

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid eventId",
      });
    }

    if (!["regular", "sponsor"].includes(slabType)) {
      return res.status(400).json({
        success: false,
        message: "slabType must be either regular or sponsor",
      });
    }

    if (!slabName || !startDateTime || !endDateTime) {
      return res.status(400).json({
        success: false,
        message: "slabName, startDateTime and endDateTime are required",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid startDateTime or endDateTime format",
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: "endDateTime must be greater than or equal to startDateTime",
      });
    }

    const slab = await RegistrationSlab.create({
      eventId,
      slabType,
      slabName,
      description,
      amount,
      AccompanyAmount,
      startDateTime: start,
      endDateTime: end,
      needAdditionalInfo: needAdditionalInfo ?? false,
      additionalFields: Array.isArray(additionalFields) ? additionalFields : [],
    });

    return res.status(201).json({
      success: true,
      message: "Registration slab created successfully",
      data: slab,
    });
  } catch (error) {
    console.error("Create registration slab error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((err) => err.message)
          .join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =======================
// Get Active Regular Slabs
// =======================
export const getActiveRegularRegistrationSlabsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid eventId",
      });
    }

    const now = new Date();

    const slabs = await RegistrationSlab.find({
      eventId,
      slabType: "regular",
      startDateTime: { $lte: now },
      endDateTime: { $gte: now },
    }).sort({ startDateTime: 1 });

    return res.status(200).json({
      success: true,
      message: "Active regular registration slabs fetched successfully",
      count: slabs.length,
      data: slabs,
    });
  } catch (error) {
    console.error("Get active regular slabs error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get Active Sponsor Slabs
// =======================
export const getActiveSponsorRegistrationSlabsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid eventId",
      });
    }

    const now = new Date();

    const slabs = await RegistrationSlab.find({
      eventId,
      slabType: "sponsor",
      startDateTime: { $lte: now },
      endDateTime: { $gte: now },
    }).sort({ startDateTime: 1 });

    return res.status(200).json({
      success: true,
      message: "Active sponsor registration slabs fetched successfully",
      count: slabs.length,
      data: slabs,
    });
  } catch (error) {
    console.error("Get active sponsor slabs error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Registration Slabs
// =======================
export const getRegistrationSlabsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const slabs = await RegistrationSlab.find({ eventId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Registration slabs fetched successfully",
      data: slabs,
    });
  } catch (error) {
    console.error("Get registration slabs error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get Active Registration Slabs
// =======================
export const getActiveRegistrationSlabsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const now = new Date();

    const slabs = await RegistrationSlab.find({
      eventId,
      startDateTime: { $lte: now },
      endDateTime: { $gte: now },
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Active registration slabs fetched successfully",
      data: slabs,
    });
  } catch (error) {
    console.error("Get active slabs error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Registration Slab
// =======================
export const updateRegistrationSlab = async (req, res) => {
  try {
    const { id } = req.params;

    const slab = await RegistrationSlab.findById(id);
    if (!slab) {
      return res.status(404).json({ message: "Registration slab not found" });
    }

    const {
      slabType,
      slabName,
      description,
      amount,
      AccompanyAmount,
      startDateTime,
      endDateTime,
      needAdditionalInfo,
      additionalFields,
    } = req.body;

    // =======================
    // DATE VALIDATION
    // =======================
    let start = slab.startDateTime;
    let end = slab.endDateTime;

    if (startDateTime) {
      if (isNaN(new Date(startDateTime))) {
        return res.status(400).json({
          message: "Invalid startDateTime format",
        });
      }
      start = new Date(startDateTime);
      slab.startDateTime = start;
    }

    if (endDateTime) {
      if (isNaN(new Date(endDateTime))) {
        return res.status(400).json({
          message: "Invalid endDateTime format",
        });
      }
      end = new Date(endDateTime);
      slab.endDateTime = end;
    }

    if (start && end && end < start) {
      return res.status(400).json({
        message: "End date time must be greater than start date time",
      });
    }

    // =======================
    // UPDATE FIELDS
    // =======================

    if (slabType !== undefined) {
      if (!["regular", "sponsor"].includes(slabType)) {
        return res.status(400).json({
          success: false,
          message: "slabType must be either regular or sponsor",
        });
      }

      slab.slabType = slabType;
    }

    if (slabName !== undefined) slab.slabName = slabName;
    if (description !== undefined) slab.description = description;
    if (amount !== undefined) slab.amount = amount;
    if (AccompanyAmount !== undefined) slab.AccompanyAmount = AccompanyAmount;

    if (needAdditionalInfo !== undefined)
      slab.needAdditionalInfo = needAdditionalInfo;

    if (additionalFields !== undefined) {
      slab.additionalFields = Array.isArray(additionalFields)
        ? additionalFields
        : [];
    }

    await slab.save();

    res.status(200).json({
      success: true,
      message: "Registration slab updated successfully",
      data: slab,
    });
  } catch (error) {
    console.error("Update registration slab error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Registration Slab
// =======================
export const deleteRegistrationSlab = async (req, res) => {
  try {
    const { id } = req.params;

    const slab = await RegistrationSlab.findById(id);
    if (!slab) {
      return res.status(404).json({ message: "Registration slab not found" });
    }

    await slab.deleteOne();

    res.status(200).json({
      success: true,
      message: "Registration slab deleted successfully",
    });
  } catch (error) {
    console.error("Delete registration slab error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
