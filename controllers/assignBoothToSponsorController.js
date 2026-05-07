import AssignBoothToSponsor from "../models/AssignBoothToSponsor.js";
import Sponsor from "../models/Sponsor.js";
import SponsorBooth from "../models/SponsorBooth.js";
import Event from "../models/Event.js";

// =======================
// ASSIGN SPONSORS TO BOOTH
// =======================
export const assignSponsorsToBooth = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { sponsorBoothId, sponsorIds } = req.body;

    // =======================
    // BASIC VALIDATION
    // =======================
    if (!eventId || !sponsorBoothId || !sponsorIds?.length) {
      return res.status(400).json({
        success: false,
        message: "eventId, sponsorBoothId and sponsorIds are required",
      });
    }

    // =======================
    // VALIDATE EVENT
    // =======================
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // =======================
    // VALIDATE BOOTH
    // =======================
    const booth = await SponsorBooth.findById(sponsorBoothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: "Booth not found",
      });
    }

    // =======================
    // VALIDATE SPONSORS
    // =======================
    const validSponsors = await Sponsor.find({
      _id: { $in: sponsorIds },
    });

    if (validSponsors.length !== sponsorIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some sponsor IDs are invalid",
      });
    }

    // =======================
    // PREVENT CROSS-EVENT ISSUE (IMPORTANT)
    // =======================
    const invalidEventSponsor = validSponsors.find(
      (s) => s.eventId.toString() !== eventId
    );

    if (invalidEventSponsor) {
      return res.status(400).json({
        success: false,
        message: "All sponsors must belong to same event",
      });
    }

    // =======================
    // CHECK EXISTING ASSIGNMENTS
    // =======================
    const existingAssignments = await AssignBoothToSponsor.find({
      eventId,
      sponsorId: { $in: sponsorIds },
    });

    if (existingAssignments.length > 0) {
      // Check if assigned to another booth
      const conflict = existingAssignments.find(
        (item) => item.sponsorBoothId.toString() !== sponsorBoothId
      );

      if (conflict) {
        return res.status(400).json({
          success: false,
          message: "This sponsor is already assigned to another booth",
        });
      }

      // Check if already in same booth
      return res.status(400).json({
        success: false,
        message: "This sponsor is already assigned to this booth",
      });
    }

    // =======================
    // UPSERT (ADD SPONSORS)
    // =======================
    const updated = await AssignBoothToSponsor.findOneAndUpdate(
      { eventId, sponsorBoothId },
      {
        $addToSet: {
          sponsorId: { $each: sponsorIds },
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    // =======================
    // RESPONSE
    // =======================
    res.status(200).json({
      success: true,
      message: "Sponsors assigned to booth successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Assign booth error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// =======================
// Get all booth assignments
// =======================
export const getAssignedBooths = async (req, res) => {
  try {
    const { eventId } = req.params;

    const data = await AssignBoothToSponsor.find({ eventId })
      .populate({
        path: "sponsorBoothId",
        populate: {
          path: "hallId",
          select: "hallName status",
        },
      })
      .populate(
        "sponsorId",
        "sponsorName contactPersonName email mobile"
      );


    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get booths error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get single booth
// =======================
export const getSponsorsByBooth = async (req, res) => {
  try {
    const { sponsorBoothId } = req.params;

    const data = await AssignBoothToSponsor.findOne({
      sponsorBoothId,
    })
      .populate("sponsorBoothId")
      .populate("sponsorId", "sponsorName contactPersonName email email");

    if (!data) {
      return res.status(404).json({ message: "No data found" });
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get single booth error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// GET LOGGED-IN SPONSOR ASSIGNED BOOTH
// =======================
export const getMyAssignedBooth = async (req, res) => {
  try {
    const sponsorId = req.sponsor._id;
    const { eventId } = req.params;

    const data = await AssignBoothToSponsor.findOne({
      eventId,
      sponsorId: sponsorId,
    })
      .populate({
        path: "sponsorBoothId",
        populate: {
          path: "hallId",
          select: "hallName status",
        },
      })
      .populate(
        "sponsorId",
        "sponsorName contactPersonName email mobile"
      );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "No booth assigned",
      });
    }

    res.status(200).json({
      success: true,
      message: "Assigned booth fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Get my booth error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


// =======================
// Remove sponsor from booth
// =======================
export const removeSponsorFromBooth = async (req, res) => {
  try {
    const { sponsorBoothId, sponsorId } = req.params;

    const updated = await AssignBoothToSponsor.findOneAndUpdate(
      { sponsorBoothId },
      {
        $pull: { sponsorId: sponsorId },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Sponsor removed from booth",
      data: updated,
    });
  } catch (error) {
    console.error("Remove booth error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete full assignment
// =======================
export const deleteBoothAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await AssignBoothToSponsor.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.status(200).json({
      success: true,
      message: "Booth assignment deleted",
    });
  } catch (error) {
    console.error("Delete booth error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};