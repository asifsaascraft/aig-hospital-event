import EventRegistration from "../models/EventRegistration.js";


export const checkEmailExists = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { email } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required in the URL",
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists for this event
    const existing = await EventRegistration.findOne({
      eventId,
      email: normalizedEmail,
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Email already registered for this event",
      });
    }

    return res.status(200).json({
      success: false,
      message: "Email not registered for this event",
    });
  } catch (error) {
    console.error("Error checking email:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while checking email",
    });
  }
};
