
import RegistrationSlab from "../models/RegistrationSlab.js";
import Event from "../models/Event.js";

// =======================
// Create Registration Slab
// =======================
export const createRegistrationSlab = async (req, res) => {
  try {
    const { eventId } = req.params;

    const {
      slabName,
      amount,
      AccompanyAmount,
      startDate,
      endDate,
      needAdditionalInfo,
      additionalFields,
      status,
    } = req.body;

    // Check event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const slab = await RegistrationSlab.create({
      eventId,
      slabName,
      amount,
      AccompanyAmount,
      startDate,
      endDate,
      needAdditionalInfo: needAdditionalInfo || false,
      additionalFields: Array.isArray(additionalFields) ? additionalFields : [],
      status: status || "Active", 
    });

    res.status(201).json({
      success: true,
      message: "Registration slab created successfully",
      data: slab,
    });

  } catch (error) {
    console.error("Create registration slab error:", error);
    res.status(500).json({ message: "Server Error" });
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

    const slabs = await RegistrationSlab.find({
      eventId,
      status: "Active",
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

    const {
      slabName,
      amount,
      AccompanyAmount,
      startDate,
      endDate,
      needAdditionalInfo,
      additionalFields,
      status,
    } = req.body;

    const slab = await RegistrationSlab.findById(id);
    if (!slab) {
      return res.status(404).json({ message: "Registration slab not found" });
    }

    if (slabName !== undefined) slab.slabName = slabName;
    if (amount !== undefined) slab.amount = amount;
    if (AccompanyAmount !== undefined) slab.AccompanyAmount = AccompanyAmount;

    if (startDate) slab.startDate = startDate;
    if (endDate) slab.endDate = endDate;

    if (needAdditionalInfo !== undefined)
      slab.needAdditionalInfo = needAdditionalInfo;

    if (additionalFields !== undefined) {
      slab.additionalFields = Array.isArray(additionalFields)
        ? additionalFields
        : [];
    }
    if (status !== undefined) slab.status = status;  

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
      return res
        .status(404)
        .json({ message: "Registration slab not found" });
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