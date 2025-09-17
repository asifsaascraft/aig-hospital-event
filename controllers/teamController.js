import Team from "../models/Team.js";

// =======================
// Get all teams (admin only)
// =======================
export const getTeams = async (req, res) => {
  try {
    const teams = await Team.find().sort({ createdAt: -1 });
    res.json({ success: true, data: teams });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch teams",
      error: error.message,
    });
  }
};

// =======================
// Create team (admin only)
// =======================
export const createTeam = async (req, res) => {
  try {
    const { companyName, contactPersonName, contactPersonMobile, contactPersonEmail, status } = req.body;

    if (!companyName || !contactPersonName || !contactPersonMobile || !contactPersonEmail) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const team = await Team.create({
      companyName,
      contactPersonName,
      contactPersonMobile,
      contactPersonEmail,
      status,
    });

    res.status(201).json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create team",
      error: error.message,
    });
  }
};

// =======================
// Update team (admin only)
// =======================
export const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, contactPersonName, contactPersonMobile, contactPersonEmail, status } = req.body;

    const team = await Team.findByIdAndUpdate(
      id,
      { companyName, contactPersonName, contactPersonMobile, contactPersonEmail, status },
      { new: true, runValidators: true }
    );

    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "Team not found" });
    }

    res.json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update team",
      error: error.message,
    });
  }
};

// =======================
// Delete team (admin only)
// =======================
export const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await Team.findByIdAndDelete(id);

    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "Team not found" });
    }

    res.json({ success: true, message: "Team deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete team",
      error: error.message,
    });
  }
};
