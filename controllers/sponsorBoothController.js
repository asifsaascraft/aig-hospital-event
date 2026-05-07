import SponsorBooth from "../models/SponsorBooth.js";
import Event from "../models/Event.js";
import SponsorHall from "../models/SponsorHall.js";

// =======================
// Create Sponsor Booth (EventAdmin Only)
// =======================
export const createSponsorBooth = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { booth, hallId, stallType, status } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Validate hall existence
    const hall = await SponsorHall.findById(hallId);

    if (!hall) {
      return res.status(404).json({
        message: "Sponsor hall not found",
      });
    }

    // Support both local & S3 uploads
    const boothFilePath = req.file?.location || req.file?.path;
    if (!boothFilePath) {
      return res.status(400).json({ message: "Booth PDF is required" });
    }

    // Create new sponsor booth
    const newBooth = await SponsorBooth.create({
      eventId,
      booth,
      hallId,
      stallType,
      status,
      boothImageUpload: boothFilePath,
    });

    res.status(201).json({
      success: true,
      message: "Sponsor Booth created successfully",
      data: newBooth,
    });
  } catch (error) {
    console.error("Create Sponsor Booth error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Sponsor Booths by Event ID (Public/User)
// =======================
export const getSponsorBoothsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const booths = await SponsorBooth.find({ eventId })
      .populate("hallId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Sponsor Booths fetched successfully",
      data: booths,
    });
  } catch (error) {
    console.error("Get Sponsor Booths error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get Active Sponsor Booths by Event ID (Public/User)
// =======================
export const getActiveSponsorBoothsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const booths = await SponsorBooth.find({
      eventId,
      status: "Active",
    })
      .populate("hallId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Active Sponsor Booths fetched successfully",
      data: booths,
    });
  } catch (error) {
    console.error("Get Active Sponsor Booths error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Sponsor Booth (EventAdmin Only)
// =======================
export const updateSponsorBooth = async (req, res) => {
  try {
    const { id } = req.params;
    const { booth, hallId, stallType, status } = req.body;

    const existingBooth = await SponsorBooth.findById(id);
    if (!existingBooth) {
      return res.status(404).json({ message: "Sponsor Booth not found" });
    }

    // Validate hall if provided
    if (hallId) {
      const hallExists = await SponsorHall.findById(hallId);

      if (!hallExists) {
        return res.status(404).json({
          message: "Sponsor hall not found",
        });
      }
    }

    // Update provided fields
    if (booth) existingBooth.booth = booth;
    if (hallId) existingBooth.hallId = hallId;
    if (stallType) existingBooth.stallType = stallType;
    if (status) existingBooth.status = status;

    // Update booth PDF if new file uploaded
    const boothFilePath = req.file?.location || req.file?.path;
    if (boothFilePath) {
      existingBooth.boothImageUpload = boothFilePath;
    }

    await existingBooth.save();

    res.status(200).json({
      success: true,
      message: "Sponsor Booth updated successfully",
      data: existingBooth,
    });
  } catch (error) {
    console.error("Update Sponsor Booth error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Sponsor Booth (EventAdmin Only)
// =======================
export const deleteSponsorBooth = async (req, res) => {
  try {
    const { id } = req.params;

    const booth = await SponsorBooth.findById(id);
    if (!booth) {
      return res.status(404).json({ message: "Sponsor Booth not found" });
    }

    await booth.deleteOne();

    res.status(200).json({
      success: true,
      message: "Sponsor Booth deleted successfully",
    });
  } catch (error) {
    console.error("Delete Sponsor Booth error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
