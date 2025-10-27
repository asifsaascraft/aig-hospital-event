import SponsorHall from "../models/SponsorHall.js";
import Event from "../models/Event.js";

// =======================
// Create Hall (EventAdmin Only)
// =======================
export const createSponsorHall = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { hallName, status } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Create new hall
    const hall = await SponsorHall.create({
      eventId,
      hallName,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Sponsor Hall created successfully",
      data: hall,
    });
  } catch (error) {
    console.error("Create Sponsor Hall error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Halls by Event ID (Public/User)
// =======================
export const getSponsorHallsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const halls = await SponsorHall.find({ eventId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Sponsor Halls fetched successfully",
      data: halls,
    });
  } catch (error) {
    console.error("Get Sponsor Halls error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Hall (EventAdmin Only)
// =======================
export const updateSponsorHall = async (req, res) => {
  try {
    const { id } = req.params;
    const { hallName, status } = req.body;

    const hall = await SponsorHall.findById(id);
    if (!hall) {
      return res.status(404).json({ message: "Sponsor Hall not found" });
    }

    if (hallName) hall.hallName = hallName;
    if (status) hall.status = status;

    await hall.save();

    res.status(200).json({
      success: true,
      message: "Sponsor Hall updated successfully",
      data: hall,
    });
  } catch (error) {
    console.error("Update Sponsor Hall error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Hall (EventAdmin Only)
// =======================
export const deleteSponsorHall = async (req, res) => {
  try {
    const { id } = req.params;

    const hall = await SponsorHall.findById(id);
    if (!hall) {
      return res.status(404).json({ message: "Sponsor Hall not found" });
    }

    await hall.deleteOne();

    res.status(200).json({
      success: true,
      message: "Sponsor Hall deleted successfully",
    });
  } catch (error) {
    console.error("Delete Sponsor Hall error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
