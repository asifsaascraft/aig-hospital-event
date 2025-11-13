import ExhibitorBooth from "../models/ExhibitorBooth.js";
import Event from "../models/Event.js";

// =======================
// Create Exhibitor Booth (EventAdmin Only)
// =======================
export const createExhibitorBooth = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { booth, hall, stallType, status } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Support both local & S3 uploads
    const boothFilePath = req.file?.location || req.file?.path;
    if (!boothFilePath) {
      return res.status(400).json({ message: "Booth PDF file is required" });
    }

    // Create new exhibitor booth
    const newBooth = await ExhibitorBooth.create({
      eventId,
      booth,
      hall,
      stallType,
      status,
      boothImageUpload: boothFilePath,
    });

    res.status(201).json({
      success: true,
      message: "Exhibitor Booth created successfully",
      data: newBooth,
    });
  } catch (error) {
    console.error("Create Exhibitor Booth error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Exhibitor Booths by Event ID (Public/User)
// =======================
export const getExhibitorBoothsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const booths = await ExhibitorBooth.find({ eventId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Exhibitor Booths fetched successfully",
      data: booths,
    });
  } catch (error) {
    console.error("Get Exhibitor Booths error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get Active Exhibitor Booths by Event ID (Public/User)
// =======================
export const getActiveExhibitorBoothsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const booths = await ExhibitorBooth.find({
      eventId,
      status: "Active",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Active Exhibitor Booths fetched successfully",
      data: booths,
    });
  } catch (error) {
    console.error("Get Active Exhibitor Booths error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Exhibitor Booth (EventAdmin Only)
// =======================
export const updateExhibitorBooth = async (req, res) => {
  try {
    const { id } = req.params;
    const { booth, hall, stallType, status } = req.body;

    const existingBooth = await ExhibitorBooth.findById(id);
    if (!existingBooth) {
      return res.status(404).json({ message: "Exhibitor Booth not found" });
    }

    // Update provided fields
    if (booth) existingBooth.booth = booth;
    if (hall) existingBooth.hall = hall;
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
      message: "Exhibitor Booth updated successfully",
      data: existingBooth,
    });
  } catch (error) {
    console.error("Update Exhibitor Booth error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Exhibitor Booth (EventAdmin Only)
// =======================
export const deleteExhibitorBooth = async (req, res) => {
  try {
    const { id } = req.params;

    const booth = await ExhibitorBooth.findById(id);
    if (!booth) {
      return res.status(404).json({ message: "Exhibitor Booth not found" });
    }

    await booth.deleteOne();

    res.status(200).json({
      success: true,
      message: "Exhibitor Booth deleted successfully",
    });
  } catch (error) {
    console.error("Delete Exhibitor Booth error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
