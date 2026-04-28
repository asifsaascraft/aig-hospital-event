import CardProfile from "../models/CardProfile.js";
import Event from "../models/Event.js";

// =======================
// Create Card Profile (EventAdmin)
// =======================
export const createCardProfile = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { CardProfileName, status } = req.body;

    // Validate input
    if (!CardProfileName) {
      return res.status(400).json({
        message: "CardProfileName is required",
      });
    }

    // Check Event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    //  Check duplicate (case-insensitive)
    const existing = await CardProfile.findOne({
      eventId,
      CardProfileName: CardProfileName.trim(),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Card profile already exists for this event",
      });
    }

    const profile = await CardProfile.create({
      eventId,
      CardProfileName: CardProfileName.trim(),
      status,
    });

    res.status(201).json({
      success: true,
      message: "Card profile created successfully",
      data: profile,
    });

  } catch (error) {
    console.error("Create CardProfile error:", error);

    // Handle duplicate index
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Duplicate card profile for this event",
      });
    }

    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Card Profiles by Event ID (Public/User)
// =======================
export const getCardProfilesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const profiles = await CardProfile.find({ eventId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Card profiles fetched successfully",
      data: profiles,
    });

  } catch (error) {
    console.error("Get CardProfiles error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get Active Card Profiles by Event ID (Public/User)
// =======================
export const getActiveCardProfilesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const profiles = await CardProfile.find({
      eventId,
      status: "Active",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Active card profiles fetched successfully",
      data: profiles,
    });

  } catch (error) {
    console.error("Get Active CardProfiles error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Card Profile (EventAdmin Only)
// =======================
export const updateCardProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { CardProfileName, status } = req.body;

    const profile = await CardProfile.findById(id);
    if (!profile) {
      return res.status(404).json({
        message: "Card profile not found",
      });
    }

    //  Prevent duplicate on update
    if (CardProfileName) {
      const existing = await CardProfile.findOne({
        eventId: profile.eventId,
        CardProfileName: CardProfileName.trim(),
        _id: { $ne: id },
      });

      if (existing) {
        return res.status(400).json({
          message: "Card profile already exists for this event",
        });
      }

      profile.CardProfileName = CardProfileName.trim();
    }

    if (status) profile.status = status;

    await profile.save();

    res.status(200).json({
      success: true,
      message: "Card profile updated successfully",
      data: profile,
    });

  } catch (error) {
    console.error("Update CardProfile error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Card Profile (EventAdmin Only)
// =======================
export const deleteCardProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await CardProfile.findById(id);
    if (!profile) {
      return res.status(404).json({
        message: "Card profile not found",
      });
    }

    await profile.deleteOne();

    res.status(200).json({
      success: true,
      message: "Card profile deleted successfully",
    });

  } catch (error) {
    console.error("Delete CardProfile error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};