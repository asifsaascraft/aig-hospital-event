import RegistrationSetting from "../models/RegistrationSetting.js";
import Event from "../models/Event.js";

// =======================
// Create Registration Setting (EventAdmin Only)
// =======================
export const createRegistrationSetting = async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      attendeeRegistration,
      accompanyRegistration,
      workshopRegistration,
      banquetRegistration,
      eventRegistrationStartDate,
      eventRegistrationEndDate,
    } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if a registration setting already exists for this event
    const existingSetting = await RegistrationSetting.findOne({ eventId });
    if (existingSetting) {
      return res.status(400).json({
        message: "Registration setting already exists for this event",
      });
    }

    // Create new registration setting
    const setting = await RegistrationSetting.create({
      eventId,
      attendeeRegistration,
      accompanyRegistration,
      workshopRegistration,
      banquetRegistration,
      eventRegistrationStartDate,
      eventRegistrationEndDate,
    });

    res.status(201).json({
      success: true,
      message: "Registration setting created successfully",
      data: setting,
    });
  } catch (error) {
    console.error("Create registration setting error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Registration Settings by Event ID (Public/User)
// =======================
export const getRegistrationSettingsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const settings = await RegistrationSetting.find({ eventId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Registration settings fetched successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Get registration settings error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Registration Setting (EventAdmin Only)
// =======================
export const updateRegistrationSetting = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      attendeeRegistration,
      accompanyRegistration,
      workshopRegistration,
      banquetRegistration,
      eventRegistrationStartDate,
      eventRegistrationEndDate,
    } = req.body;

    // Find existing setting
    const setting = await RegistrationSetting.findById(id);
    if (!setting) {
      return res.status(404).json({ message: "Registration setting not found" });
    }

    // Update only provided fields
    if (attendeeRegistration !== undefined)
      setting.attendeeRegistration = attendeeRegistration;
    if (accompanyRegistration !== undefined)
      setting.accompanyRegistration = accompanyRegistration;
    if (workshopRegistration !== undefined)
      setting.workshopRegistration = workshopRegistration;
    if (banquetRegistration !== undefined)
      setting.banquetRegistration = banquetRegistration;
    if (eventRegistrationStartDate)
      setting.eventRegistrationStartDate = eventRegistrationStartDate;
    if (eventRegistrationEndDate)
      setting.eventRegistrationEndDate = eventRegistrationEndDate;

    await setting.save();

    res.status(200).json({
      success: true,
      message: "Registration setting updated successfully",
      data: setting,
    });
  } catch (error) {
    console.error("Update registration setting error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Registration Setting (EventAdmin Only)
// =======================
export const deleteRegistrationSetting = async (req, res) => {
  try {
    const { id } = req.params;

    const setting = await RegistrationSetting.findById(id);
    if (!setting) {
      return res.status(404).json({ message: "Registration setting not found" });
    }

    await setting.deleteOne();

    res.status(200).json({
      success: true,
      message: "Registration setting deleted successfully",
    });
  } catch (error) {
    console.error("Delete registration setting error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
