import RegistrationSlab from "../models/RegistrationSlab.js";
import Event from "../models/Event.js";

// =======================
// Create Registration Slab (EventAdmin Only)
// =======================
export const createRegistrationSlab = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { slabName, amount, startDate, endDate } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Create new registration slab
    const slab = await RegistrationSlab.create({
      eventId,
      slabName,
      amount,
      startDate,
      endDate,
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
// Get All Registration Slabs by Event ID (Public/User)
// =======================
export const getRegistrationSlabsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const slabs = await RegistrationSlab.find({ eventId }).sort({ createdAt: -1 });

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
// Update Registration Slab (EventAdmin Only)
// =======================
export const updateRegistrationSlab = async (req, res) => {
  try {
    const { id } = req.params;
    const { slabName, amount, startDate, endDate } = req.body;

    // Find existing slab
    const slab = await RegistrationSlab.findById(id);
    if (!slab) {
      return res.status(404).json({ message: "Registration slab not found" });
    }

    // Update fields only if provided
    if (slabName) slab.slabName = slabName;
    if (amount !== undefined) slab.amount = amount;
    if (startDate) slab.startDate = startDate;
    if (endDate) slab.endDate = endDate;

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
// Delete Registration Slab (EventAdmin Only)
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
