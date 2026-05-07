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
      regClosedMessage,
    } = req.body;

    // ===============================
    // Required check
    // ===============================
    if (!eventRegistrationStartDate || !eventRegistrationEndDate) {
      return res.status(400).json({
        message: "Start and End registration date are required",
      });
    }

    // ===============================
    // Validate format
    // ===============================
    if (isNaN(new Date(eventRegistrationStartDate))) {
      return res.status(400).json({
        message: "Invalid eventRegistrationStartDate format",
      });
    }

    if (isNaN(new Date(eventRegistrationEndDate))) {
      return res.status(400).json({
        message: "Invalid eventRegistrationEndDate format",
      });
    }

    // ===============================
    // Convert
    // ===============================
    const parsedStart = new Date(eventRegistrationStartDate);
    const parsedEnd = new Date(eventRegistrationEndDate);

    // ===============================
    // Compare
    // ===============================
    if (parsedEnd < parsedStart) {
      return res.status(400).json({
        message: "End date must be greater than or equal to start date",
      });
    }

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
      eventRegistrationStartDate: parsedStart,
      eventRegistrationEndDate: parsedEnd,
      regClosedMessage,
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
      regClosedMessage,
    } = req.body;

    // Find existing setting
    const setting = await RegistrationSetting.findById(id);
    if (!setting) {
      return res.status(404).json({ message: "Registration setting not found" });
    }

    // ===============================
    // Validate format
    // ===============================
    if (
      eventRegistrationStartDate &&
      isNaN(new Date(eventRegistrationStartDate))
    ) {
      return res.status(400).json({
        message: "Invalid eventRegistrationStartDate format",
      });
    }

    if (
      eventRegistrationEndDate &&
      isNaN(new Date(eventRegistrationEndDate))
    ) {
      return res.status(400).json({
        message: "Invalid eventRegistrationEndDate format",
      });
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
    // ===============================
    // Final values + conversion
    // ===============================
    const finalStart = eventRegistrationStartDate
      ? new Date(eventRegistrationStartDate)
      : setting.eventRegistrationStartDate;

    const finalEnd = eventRegistrationEndDate
      ? new Date(eventRegistrationEndDate)
      : setting.eventRegistrationEndDate;

    // ===============================
    // Compare
    // ===============================
    if (finalEnd < finalStart) {
      return res.status(400).json({
        message: "End date must be greater than or equal to start date",
      });
    }

    setting.eventRegistrationStartDate = finalStart;
    setting.eventRegistrationEndDate = finalEnd;
    if (regClosedMessage !== undefined)
      setting.regClosedMessage = regClosedMessage;

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
