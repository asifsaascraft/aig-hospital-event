import Banquet from "../models/Banquet.js";
import Event from "../models/Event.js";

// =======================
// Create Banquet (EventAdmin Only)
// =======================
export const createBanquet = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { banquetslabName, amount, startDate, endDate, status } = req.body;

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
      status: status || "Active", 
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
// Get Active Banquets where endDate >= Today
// =======================
export const getActiveBanquetsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Today's date (only date compare)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Convert DD/MM/YYYY -> JS Date
    const parseDate = (dateString) => {
      if (!dateString) return null;
      const [day, month, year] = dateString.split("/").map(Number);
      return new Date(year, month - 1, day);
    };

    // Fetch only ACTIVE banquets
    const banquets = await Banquet.find({ eventId, status: "Active" });

    // Filter -> endDate is NOT expired
    const filtered = banquets.filter((item) => {
      const endDateObj = parseDate(item.endDate);
      return endDateObj && endDateObj >= today;
    });

    // Sort -> earliest startDate first
    filtered.sort((a, b) => {
      const dateA = parseDate(a.startDate);
      const dateB = parseDate(b.startDate);
      return dateA - dateB;
    });

    res.status(200).json({
      success: true,
      message: "Active and non-expired banquets fetched successfully",
      data: filtered,
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
    const { banquetslabName, amount, startDate, endDate, status } = req.body;

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
    if (status !== undefined) banquet.status = status;  

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
