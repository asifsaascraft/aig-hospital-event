import CardProfile from "../models/CardProfile.js";

// =======================
// Create Card Profile (EventAdmin)
// =======================
export const createCardProfile = async (req, res) => {
  try {
    const { CardProfileName, status } = req.body;

    if (!CardProfileName) {
      return res.status(400).json({
        message: "CardProfileName is required",
      });
    }

    const existing = await CardProfile.findOne({
      CardProfileName: CardProfileName.trim(),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Card profile already exists",
      });
    }

    const profile = await CardProfile.create({
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

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Duplicate card profile",
      });
    }

    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Card Profiles (Public/User)
// =======================
export const getCardProfiles = async (req, res) => {
  try {

    const profiles = await CardProfile.find().sort({
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
// Get Active Card Profiles (Public/User)
// =======================
export const getActiveCardProfiles = async (req, res) => {
  try {

    const profiles = await CardProfile.find({
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

    // Prevent updating Delegate profile
    if (profile.CardProfileName === "Delegate") {
      return res.status(400).json({
        success: false,
        message: "Delegate card profile cannot be updated",
      });
    }

    // Prevent duplicate globally
    if (CardProfileName) {

      const existing = await CardProfile.findOne({
        CardProfileName: CardProfileName.trim(),
        _id: { $ne: id },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Card profile already exists",
        });
      }

      profile.CardProfileName = CardProfileName.trim();
    }

    if (status) {
      profile.status = status;
    }

    await profile.save();

    res.status(200).json({
      success: true,
      message: "Card profile updated successfully",
      data: profile,
    });

  } catch (error) {
    console.error("Update CardProfile error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate card profile",
      });
    }

    res.status(500).json({
      message: "Server Error",
    });
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

    // Prevent deleting Delegate profile
    if (profile.CardProfileName === "Delegate") {
      return res.status(400).json({
        success: false,
        message: "Delegate card profile cannot be deleted",
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