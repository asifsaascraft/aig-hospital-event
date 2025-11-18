import AbstractSetting from "../models/AbstractSetting.js";
import Event from "../models/Event.js";

// =======================
// Create Abstract Setting (EventAdmin Only)
// =======================
export const createAbstractSetting = async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      regRequiredForAbstractSubmission,
      abstractSubmissionStartDate,
      abstractSubmissionEndDate,
      numberOfReviewerPerCategory,
      abstractWordCount,
    } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if an abstract setting already exists for this event
    const existingSetting = await AbstractSetting.findOne({ eventId });
    if (existingSetting) {
      return res.status(400).json({
        message: "Abstract setting already exists for this event",
      });
    }

    // Create new abstract setting
    const setting = await AbstractSetting.create({
      eventId,
      regRequiredForAbstractSubmission,
      abstractSubmissionStartDate,
      abstractSubmissionEndDate,
      numberOfReviewerPerCategory,
      abstractWordCount,
    });

    res.status(201).json({
      success: true,
      message: "Abstract setting created successfully",
      data: setting,
    });
  } catch (error) {
    console.error("Create abstract setting error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Abstract Settings by Event ID (Public/User)
// =======================
export const getAbstractSettingsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const settings = await AbstractSetting.find({ eventId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Abstract settings fetched successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Get abstract settings error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Abstract Setting (EventAdmin Only)
// =======================
export const updateAbstractSetting = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      regRequiredForAbstractSubmission,
      abstractSubmissionStartDate,
      abstractSubmissionEndDate,
      numberOfReviewerPerCategory,
      abstractWordCount,
    } = req.body;

    // Find existing setting
    const setting = await AbstractSetting.findById(id);
    if (!setting) {
      return res.status(404).json({ message: "Abstract setting not found" });
    }

    // Update only provided fields
    if (regRequiredForAbstractSubmission !== undefined)
      setting.regRequiredForAbstractSubmission =
        regRequiredForAbstractSubmission;

    if (abstractSubmissionStartDate)
      setting.abstractSubmissionStartDate = abstractSubmissionStartDate;

    if (abstractSubmissionEndDate)
      setting.abstractSubmissionEndDate = abstractSubmissionEndDate;

    if (numberOfReviewerPerCategory !== undefined)
      setting.numberOfReviewerPerCategory = numberOfReviewerPerCategory;

    if (abstractWordCount !== undefined)
      setting.abstractWordCount = abstractWordCount;

    await setting.save();

    res.status(200).json({
      success: true,
      message: "Abstract setting updated successfully",
      data: setting,
    });
  } catch (error) {
    console.error("Update abstract setting error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Abstract Setting (EventAdmin Only)
// =======================
export const deleteAbstractSetting = async (req, res) => {
  try {
    const { id } = req.params;

    const setting = await AbstractSetting.findById(id);
    if (!setting) {
      return res.status(404).json({ message: "Abstract setting not found" });
    }

    await setting.deleteOne();

    res.status(200).json({
      success: true,
      message: "Abstract setting deleted successfully",
    });
  } catch (error) {
    console.error("Delete abstract setting error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
