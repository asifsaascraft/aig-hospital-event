import OtherTeam from "../models/OtherTeam.js";

// =======================
// Get all other teams (public)
// =======================
export const getOtherTeams = async (req, res) => {
  try {
    const teams = await OtherTeam.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: teams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch other teams",
      error: error.message,
    });
  }
};

// =======================
// Get only ACTIVE other teams (public)
// =======================
export const getActiveOtherTeams = async (req, res) => {
  try {
    const teams = await OtherTeam.find({ status: "Active" }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      data: teams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch active other teams",
      error: error.message,
    });
  }
};

// =======================
// Create other team (admin only)
// =======================
export const createOtherTeam = async (req, res) => {
  try {
    const {
      contactPersonName,
      contactPersonEmail,
      contactPersonMobile,
      status,
    } = req.body;

    if (!contactPersonName || !contactPersonEmail || !contactPersonMobile) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedEmail = contactPersonEmail.trim().toLowerCase();

    // Check email uniqueness
    const existingEmail = await OtherTeam.findOne({
      contactPersonEmail: normalizedEmail,
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Check mobile uniqueness
    const existingMobile = await OtherTeam.findOne({
      contactPersonMobile,
    });

    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile already exists",
      });
    }

    const team = await OtherTeam.create({
      contactPersonName,
      contactPersonEmail: normalizedEmail,
      contactPersonMobile,
      status,
    });

    res.status(201).json({
      success: true,
      data: team,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create other team",
      error: error.message,
    });
  }
};

// =======================
// Update other team (admin only)
// =======================
export const updateOtherTeam = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      contactPersonName,
      contactPersonEmail,
      contactPersonMobile,
      status,
    } = req.body;

    // Email uniqueness
    if (contactPersonEmail) {
      const normalizedEmail = contactPersonEmail.trim().toLowerCase();

      const existingEmail = await OtherTeam.findOne({
        contactPersonEmail: normalizedEmail,
        _id: { $ne: id },
      });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Mobile uniqueness
    if (contactPersonMobile) {
      const existingMobile = await OtherTeam.findOne({
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

    const team = await OtherTeam.findByIdAndUpdate(
      id,
      {
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

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Other team not found",
      });
    }

    res.json({
      success: true,
      data: team,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update other team",
      error: error.message,
    });
  }
};

// =======================
// Delete other team (admin only)
// =======================
export const deleteOtherTeam = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await OtherTeam.findByIdAndDelete(id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Other team not found",
      });
    }

    res.json({
      success: true,
      message: "Other team deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete other team",
      error: error.message,
    });
  }
};