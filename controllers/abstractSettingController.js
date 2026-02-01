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
      uploadFileRequired,
      uploadVideoUrlRequired,
      abstractSubmissionStartDate,
      abstractSubmissionEndDate,
      numberOfAbstractSubmission,
      abstractWordCount,
      reviewingType,
      minimumScore,
      maximumScore,
      message,
      description,
    } = req.body;

    // Validate event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Only one setting per event
    const existingSetting = await AbstractSetting.findOne({ eventId });
    if (existingSetting) {
      return res.status(400).json({
        message: "Abstract setting already exists for this event",
      });
    }

    // Score validation
    if (reviewingType === "SCORE_BASED") {
      if (minimumScore == null || maximumScore == null) {
        return res.status(400).json({
          message:
            "Minimum and maximum score are required for score-based reviewing",
        });
      }
      if (minimumScore > maximumScore) {
        return res.status(400).json({
          message: "Minimum score cannot be greater than maximum score",
        });
      }
    }

    const setting = await AbstractSetting.create({
      eventId,
      regRequiredForAbstractSubmission,
      uploadFileRequired,
      uploadVideoUrlRequired,
      abstractSubmissionStartDate,
      abstractSubmissionEndDate,
      numberOfAbstractSubmission,
      abstractWordCount,
      reviewingType,
      minimumScore: reviewingType === "SCORE_BASED" ? minimumScore : null,
      maximumScore: reviewingType === "SCORE_BASED" ? maximumScore : null,
      message,
      description,
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
// Get Abstract Setting by Event ID (Public/User)
// =======================
export const getAbstractSettingsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const setting = await AbstractSetting.findOne({ eventId });

    res.status(200).json({
      success: true,
      message: "Abstract setting fetched successfully",
      data: setting,
    });
  } catch (error) {
    console.error("Get abstract setting error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Abstract Setting (EventAdmin Only)
// =======================
export const updateAbstractSetting = async (req, res) => {
  try {
    const { id } = req.params;

    const setting = await AbstractSetting.findById(id);
    if (!setting) {
      return res.status(404).json({ message: "Abstract setting not found" });
    }

    const updatableFields = [
      "regRequiredForAbstractSubmission",
      "uploadFileRequired",
      "uploadVideoUrlRequired",
      "abstractSubmissionStartDate",
      "abstractSubmissionEndDate",
      "numberOfAbstractSubmission",
      "abstractWordCount",
      "reviewingType",
      "minimumScore",
      "maximumScore",
      "message",
      "description",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        setting[field] = req.body[field];
      }
    });

    // Score validation
    if (setting.reviewingType === "SCORE_BASED") {
      if (setting.minimumScore == null || setting.maximumScore == null) {
        return res.status(400).json({
          message:
            "Minimum and maximum score are required for score-based reviewing",
        });
      }
      if (setting.minimumScore > setting.maximumScore) {
        return res.status(400).json({
          message: "Minimum score cannot be greater than maximum score",
        });
      }
    } else {
      setting.minimumScore = null;
      setting.maximumScore = null;
    }

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
