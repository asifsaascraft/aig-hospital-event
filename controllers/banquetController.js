import Banquet from "../models/Banquet.js";
import Event from "../models/Event.js";

// =======================
// Create Banquet (EventAdmin Only)
// =======================
export const createBanquet = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { banquetslabName, amount, startDate, endDate } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Create new banquet
    const banquet = await Banquet.create({
      eventId,
      banquetslabName,
      amount,
      startDate,
      endDate,
    });

    res.status(201).json({
      success: true,
      message: "Banquet created successfully",
      data: banquet,
    });
  } catch (error) {
    console.error("Create banquet error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Banquets by Event ID (Public/User)
// =======================
export const getBanquetsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const banquets = await Banquet.find({ eventId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Banquets fetched successfully",
      data: banquets,
    });
  } catch (error) {
    console.error("Get banquets error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get Active Banquets by Event ID (Public/User)
// - Shows banquets where endDate is null OR endDate >= now
// - (Start date is NOT enforced here; only endDate governs visibility)
// =======================
export const getActiveBanquetsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const now = new Date();

    const banquets = await Banquet.find({
      eventId,
      $or: [
        { endDate: { $gte: now } }, // not expired
        { endDate: null },          // open-ended banquet
      ],
    }).sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      message: "Active banquets fetched successfully",
      data: banquets,
    });
  } catch (error) {
    console.error("Get active banquets error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Banquet (EventAdmin Only)
// =======================
export const updateBanquet = async (req, res) => {
  try {
    const { id } = req.params;
    const { banquetslabName, amount, startDate, endDate } = req.body;

    // Find existing banquet
    const banquet = await Banquet.findById(id);
    if (!banquet) {
      return res.status(404).json({ message: "Banquet not found" });
    }

    // Update fields only if provided
    if (banquetslabName) banquet.banquetslabName = banquetslabName;
    if (amount !== undefined) banquet.amount = amount;
    if (startDate) banquet.startDate = startDate;
    if (endDate) banquet.endDate = endDate;

    await banquet.save();

    res.status(200).json({
      success: true,
      message: "Banquet updated successfully",
      data: banquet,
    });
  } catch (error) {
    console.error("Update banquet error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Banquet (EventAdmin Only)
// =======================
export const deleteBanquet = async (req, res) => {
  try {
    const { id } = req.params;

    const banquet = await Banquet.findById(id);
    if (!banquet) {
      return res.status(404).json({ message: "Banquet not found" });
    }

    await banquet.deleteOne();

    res.status(200).json({
      success: true,
      message: "Banquet deleted successfully",
    });
  } catch (error) {
    console.error("Delete banquet error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
