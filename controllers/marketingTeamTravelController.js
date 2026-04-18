import MarketingTeamTravel from "../models/MarketingTeamTravel.js";
import Travel from "../models/Travel.js";


// =======================
// Assign travel to  marketing team (event admin only)
// =======================
export const assignTravelToMarketingTeam = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { marketingTeamId, travelIds } = req.body;

    if (!marketingTeamId || !travelIds || travelIds.length === 0) {
      return res.status(400).json({
        message: "marketingTeamId and travelIds are required",
      });
    }

    // ===============================
    // STEP 1: CHECK ALREADY ASSIGNED TRAVELS
    // ===============================
    const alreadyAssigned = await MarketingTeamTravel.find({
      eventId,
      travelIds: { $in: travelIds },
    });

    const assignedTravelIds = alreadyAssigned.flatMap((doc) =>
      doc.travelIds.map((id) => id.toString())
    );

    const newTravelIds = travelIds.filter(
      (id) => !assignedTravelIds.includes(id)
    );

    if (newTravelIds.length === 0) {
      return res.status(400).json({
        message: "All selected travels are already assigned",
      });
    }

    // ===============================
    // STEP 2: CHECK EXISTING RECORD
    // ===============================
    let record = await MarketingTeamTravel.findOne({
      eventId,
      marketingTeamId,
    });

    if (record) {
      // ADD NEW TRAVELS (NO DUPLICATE)
      record.travelIds = [
        ...new Set([
          ...record.travelIds.map((id) => id.toString()),
          ...newTravelIds,
        ]),
      ];
      await record.save();
    } else {
      // CREATE NEW RECORD
      record = await MarketingTeamTravel.create({
        eventId,
        marketingTeamId,
        travelIds: newTravelIds,
      });
    }

    res.status(200).json({
      success: true,
      message: "Travel assigned successfully",
      data: record,
    });
  } catch (error) {
    console.error("Assign error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


// =======================
// Get All Booked Travel, not to assigned any marketing team (event admin only)
// =======================
export const getUnassignedTravels = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get all assigned travelIds
    const assigned = await MarketingTeamTravel.find({ eventId });

    const assignedIds = assigned.flatMap((doc) =>
      doc.travelIds.map((id) => id.toString())
    );

    // Fetch only unassigned + populate registration
    const travels = await Travel.find({
      eventId,
      _id: { $nin: assignedIds },
    })
      .populate({
        path: "eventRegistrationId",
        select: "prefix name email mobile",
      })
      .populate({
        path: "travelAgentId",
        select: "agentName email mobile",
      })

    res.status(200).json({
      success: true,
      count: travels.length,
      data: travels,
    });
  } catch (error) {
    console.error("Unassigned error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Booked Travel and assigned to any marketing team (event admin only)
// =======================
export const getMarketingTeamTravelSummary = async (req, res) => {
  try {
    const { eventId } = req.params;

    const data = await MarketingTeamTravel.find({ eventId })
      .populate("marketingTeamId", "companyName contactPersonName contactPersonEmail contactPersonMobile")
      .populate({
        path: "travelIds",
        populate: [
          {
            path: "eventRegistrationId",
            select: "prefix name email mobile",
          },
          {
            path: "travelAgentId",
            select: "agentName email mobile",
          },
        ],
      });


    const result = data.map((item) => ({
      marketingTeam: item.marketingTeamId,
      totalTravels: item.travelIds.length,
      travels: item.travelIds,
    }));

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Summary error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};