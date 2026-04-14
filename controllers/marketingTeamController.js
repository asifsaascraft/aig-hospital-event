import MarketingTeam from "../models/MarketingTeam.js";

// =======================
// Get all marketing teams (public)
// =======================
export const getMarketingTeams = async (req, res) => {
  try {
    const marketingTeams = await MarketingTeam.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: marketingTeams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch marketing teams",
      error: error.message,
    });
  }
};

// =======================
// Get only ACTIVE marketing teams (public)
// =======================
export const getActiveMarketingTeams = async (req, res) => {
  try {
    const marketingTeams = await MarketingTeam.find({ status: "Active" }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      data: marketingTeams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch active marketing teams",
      error: error.message,
    });
  }
};

// =======================
// Create marketing team (admin only)
// =======================
export const createMarketingTeam = async (req, res) => {
  try {
    const {
      companyName,
      contactPersonName,
      contactPersonEmail,
      contactPersonMobile,
      status,
    } = req.body;

    if (
      !companyName ||
      !contactPersonName ||
      !contactPersonEmail ||
      !contactPersonMobile
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check email uniqueness
    const existingEmail = await MarketingTeam.findOne({
      contactPersonEmail,
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Check mobile uniqueness
    const existingMobile = await MarketingTeam.findOne({
      contactPersonMobile,
    });

    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile already exists",
      });
    }

    const marketingTeam = await MarketingTeam.create({
      companyName,
      contactPersonName,
      contactPersonEmail,
      contactPersonMobile,
      status,
    });

    res.status(201).json({
      success: true,
      data: marketingTeam,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create marketing team",
      error: error.message,
    });
  }
};

// =======================
// Update marketing team (admin only)
// =======================
export const updateMarketingTeam = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      companyName,
      contactPersonName,
      contactPersonEmail,
      contactPersonMobile,
      status,
    } = req.body;

    // Check email uniqueness
    if (contactPersonEmail) {
      const existingEmail = await MarketingTeam.findOne({
        contactPersonEmail,
        _id: { $ne: id },
      });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Check mobile uniqueness
    if (contactPersonMobile) {
      const existingMobile = await MarketingTeam.findOne({
        contactPersonMobile,
        _id: { $ne: id },
      });

      if (existingMobile) {
        return res.status(400).json({
          success: false,
          message: "Mobile already exists",
        });
      }
    }

    const marketingTeam = await MarketingTeam.findByIdAndUpdate(
      id,
      {
        companyName,
        contactPersonName,
        contactPersonEmail,
        contactPersonMobile,
        status,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!marketingTeam) {
      return res.status(404).json({
        success: false,
        message: "Marketing team not found",
      });
    }

    res.json({
      success: true,
      data: marketingTeam,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update marketing team",
      error: error.message,
    });
  }
};

// =======================
// Delete marketing team (admin only)
// =======================
export const deleteMarketingTeam = async (req, res) => {
  try {
    const { id } = req.params;

    const marketingTeam = await MarketingTeam.findByIdAndDelete(id);

    if (!marketingTeam) {
      return res.status(404).json({
        success: false,
        message: "Marketing team not found",
      });
    }

    res.json({
      success: true,
      message: "Marketing team deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete marketing team",
      error: error.message,
    });
  }
};