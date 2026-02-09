import AbstractSubmit from "../models/AbstractSubmit.js";
import AbstractSetting from "../models/AbstractSetting.js";
import AbstractCategory from "../models/AbstractCategory.js";
import EventRegistration from "../models/EventRegistration.js";

/* =======================
   Generate 6-digit Abstract Number
======================= */
const generateAbstractNumber = async () => {
  let number;
  let exists;

  do {
    number = Math.floor(100000 + Math.random() * 900000).toString();
    exists = await AbstractSubmit.findOne({ abstractNumber: number });
  } while (exists);

  return number;
};

/* =======================
   Submit Abstract (USER)
======================= */
export const submitAbstract = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.params;

    const {
      presenterName,
      coAuthor,
      title,
      abstract,
      categories = [],
      uploadVideoUrl,
    } = req.body;

    const uploadFile = req.file?.path || null;

    /* =======================
       Abstract Setting
    ======================= */
    const setting = await AbstractSetting.findOne({ eventId });
    if (!setting) {
      return res.status(400).json({
        success: false,
        message: "Abstract submission is not configured for this event",
      });
    }

    /* =======================
   Registration Required Validation
======================= */
    if (setting.regRequiredForAbstractSubmission) {
      const registration = await EventRegistration.findOne({
        eventId,
        userId,
        isSuspended: false,
      });

      if (!registration) {
        return res.status(400).json({
          success: false,
          message: "You must register for the event before submitting an abstract",
        });
      }
    }


    /* =======================
       Date Validation (SEPARATE)
    ======================= */
    const now = new Date();

    if (
      setting.abstractSubmissionStartDate &&
      now < setting.abstractSubmissionStartDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Abstract submission has not started yet",
      });
    }

    if (
      setting.abstractSubmissionEndDate &&
      now > setting.abstractSubmissionEndDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Abstract submission deadline has passed",
      });
    }

    /* =======================
       Max Submission Per User
    ======================= */
    const submissionCount = await AbstractSubmit.countDocuments({
      eventId,
      userId,
    });

    if (submissionCount >= setting.numberOfAbstractSubmission) {
      return res.status(400).json({
        success: false,
        message: `You can submit only ${setting.numberOfAbstractSubmission} abstract(s) for this event`,
      });
    }

    /* =======================
       Word Count Validation
    ======================= */
    const wordCount = abstract.trim().split(/\s+/).length;
    if (wordCount > setting.abstractWordCount) {
      return res.status(400).json({
        success: false,
        message: `Abstract exceeds maximum word limit of ${setting.abstractWordCount}`,
      });
    }

    /* =======================
       Upload Rules (INDEPENDENT)
    ======================= */
    if (setting.uploadFileRequired && !uploadFile) {
      return res.status(400).json({
        success: false,
        message: "Abstract file upload is required",
      });
    }

    if (setting.uploadVideoUrlRequired && !uploadVideoUrl) {
      return res.status(400).json({
        success: false,
        message: "Video URL is required",
      });
    }

    /* =======================
       Category Validation (OPTIONAL)
       Checked against AbstractCategory count
    ======================= */
    if (categories.length > 0) {
      const activeCategories = await AbstractCategory.find({
        eventId,
        status: "Active",
      });

      if (categories.length > activeCategories.length) {
        return res.status(400).json({
          success: false,
          message: "Invalid number of categories selected",
        });
      }

      for (const cat of categories) {
        const validCategory = activeCategories.find(
          (c) => c._id.toString() === cat.categoryId
        );

        if (!validCategory) {
          return res.status(400).json({
            success: false,
            message: "Invalid or inactive category selected",
          });
        }

        if (!validCategory.categoryOptions.includes(cat.selectedOption)) {
          return res.status(400).json({
            success: false,
            message: "Invalid category option selected",
          });
        }
      }
    }

    /* =======================
       Generate Abstract Number
    ======================= */
    const abstractNumber = await generateAbstractNumber();

    /* =======================
       Save Abstract
    ======================= */
    const abstractSubmit = await AbstractSubmit.create({
      eventId,
      userId,
      presenterName,
      coAuthor,
      title,
      abstract,
      categories,
      abstractNumber,
      uploadFile,
      uploadVideoUrl,
    });

    res.status(201).json({
      success: true,
      message: "Abstract submitted successfully",
      data: abstractSubmit,
    });
  } catch (error) {
    console.error("Submit abstract error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit abstract",
    });
  }
};
