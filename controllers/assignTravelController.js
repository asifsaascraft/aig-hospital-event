import AssignTravel from "../models/AssignTravel.js";
import Travel from "../models/Travel.js";

// ===============================
// HELPER: Build Assignee Query
// ===============================
const getAssigneeQuery = (body, eventId) => {
  return {
    eventId,
    ...(body.marketingTeamId && { marketingTeamId: body.marketingTeamId }),
    ...(body.eventAdminId && { eventAdminId: body.eventAdminId }),
    ...(body.otherTeamId && { otherTeamId: body.otherTeamId }),
  };
};

// ===============================
// ASSIGN TRAVEL
// ===============================
export const assignTravel = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { travelIds } = req.body;

    if (!travelIds || travelIds.length === 0) {
      return res.status(400).json({
        message: "At least one travelId is required",
      });
    }

    //  CHECK duplicate assignment
    const alreadyAssigned = await AssignTravel.find({
      eventId,
      travelIds: { $in: travelIds },
    });

    if (alreadyAssigned.length > 0) {
      return res.status(400).json({
        message: "Some travelIds are already assigned to another team",
      });
    }

    const query = getAssigneeQuery(req.body, eventId);

    let record = await AssignTravel.findOne(query);

    if (record) {
      //  Merge (no duplicate)
      record.travelIds = [
        ...new Set([
          ...record.travelIds.map((id) => id.toString()),
          ...travelIds,
        ]),
      ];
      await record.save();
    } else {
      record = await AssignTravel.create({
        ...query,
        travelIds,
      });
    }

    res.status(200).json({
      success: true,
      message: "Travel assigned successfully",
      data: record,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// REMOVE TRAVEL FROM TEAM
// ===============================
export const removeTravel = async (req, res) => {
  try {
    const { assignId } = req.params;
    const { travelId } = req.body;

    const record = await AssignTravel.findById(assignId);

    if (!record) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    record.travelIds = record.travelIds.filter(
      (id) => id.toString() !== travelId
    );

    //  If empty → delete document
    if (record.travelIds.length === 0) {
      await AssignTravel.findByIdAndDelete(assignId);

      return res.status(200).json({
        success: true,
        message: "Travel removed and assignment deleted (no travels left)",
      });
    }

    await record.save();

    res.status(200).json({
      success: true,
      message: "Travel removed successfully",
      data: record,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// REASSIGN TRAVEL (MOVE)
// ===============================
export const reassignTravel = async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      fromAssignId,
      travelId,
      marketingTeamId,
      eventAdminId,
      otherTeamId,
    } = req.body;

    // ======================
    // REMOVE FROM OLD
    // ======================
    const from = await AssignTravel.findById(fromAssignId);

    if (!from) {
      return res.status(404).json({ message: "Source not found" });
    }

    from.travelIds = from.travelIds.filter(
      (id) => id.toString() !== travelId
    );

    //  If empty → delete old record
    if (from.travelIds.length === 0) {
      await AssignTravel.findByIdAndDelete(fromAssignId);
    } else {
      await from.save();
    }

    // ======================
    // ADD TO NEW
    // ======================
    const query = {
      eventId,
      ...(marketingTeamId && { marketingTeamId }),
      ...(eventAdminId && { eventAdminId }),
      ...(otherTeamId && { otherTeamId }),
    };

    let to = await AssignTravel.findOne(query);

    if (to) {
      if (!to.travelIds.includes(travelId)) {
        to.travelIds.push(travelId);
        await to.save();
      }
    } else {
      to = await AssignTravel.create({
        ...query,
        travelIds: [travelId],
      });
    }

    res.status(200).json({
      success: true,
      message: "Travel reassigned successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// GET UNASSIGNED TRAVELS
// ===============================
export const getUnassignedTravels = async (req, res) => {
  try {
    const { eventId } = req.params;

    const assigned = await AssignTravel.find({ eventId });

    const assignedIds = assigned.flatMap((doc) =>
      doc.travelIds.map((id) => id.toString())
    );

    const travels = await Travel.find({
      eventId,
      _id: { $nin: assignedIds },
    })
      .select("_id eventRegistrationId fullName") 
      .populate(
        "eventRegistrationId",
        "prefix name email mobile regNum"
      );

    //  Clean response (optional but recommended)
    const formatted = travels.map((item) => ({
      _id: item._id,
      eventRegistrationId: item.eventRegistrationId,
      fullName: item.fullName,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// SUMMARY
// ===============================
export const getAssignSummary = async (req, res) => {
  try {
    const { eventId } = req.params;

    const data = await AssignTravel.find({ eventId })
      .populate(
        "marketingTeamId",
        "companyName contactPersonName contactPersonEmail contactPersonMobile"
      )
      .populate("eventAdminId", "name email mobile")
      .populate(
        "otherTeamId",
        "contactPersonName contactPersonEmail contactPersonMobile"
      )
      .populate({
        path: "travelIds",
        select:
          "_id eventId eventRegistrationId fullName travelAgentId arrivalPickupPoint arrivalPickupPointType arrivalPickupDateTime arrivalDropOffPoint departurePickupPoint departurePickupPointType departurePickupDateTime departureDropOffPoint",
        populate: [
          {
            path: "eventRegistrationId",
            select: "prefix name email mobile regNum",
          },
          {
            path: "travelAgentId",
            select: "agentName email mobile company",
          },
        ],
      })
      .lean(); //  important

    //  FORMAT RESPONSE
    const formatted = data.map((item) => {
      return {
        _id: item._id,

        ...(item.marketingTeamId && {
          marketingTeamId: item.marketingTeamId,
        }),

        ...(item.eventAdminId && {
          eventAdminId: item.eventAdminId,
        }),

        ...(item.otherTeamId && {
          otherTeamId: item.otherTeamId,
        }),

        travelIds: item.travelIds.map((t) => ({
          _id: t._id,
          eventId: t.eventId,
          eventRegistrationId: t.eventRegistrationId, //  populated object
          fullName: t.fullName,
          travelAgentId: t.travelAgentId, //  populated object
          arrivalPickupPoint: t.arrivalPickupPoint,
          arrivalPickupPointType: t.arrivalPickupPointType,
          arrivalPickupDateTime: t.arrivalPickupDateTime,
          arrivalDropOffPoint: t.arrivalDropOffPoint,
          departurePickupPoint: t.departurePickupPoint,
          departurePickupPointType: t.departurePickupPointType,
          departurePickupDateTime: t.departurePickupDateTime,
          departureDropOffPoint: t.departureDropOffPoint,
        })),
      };
    });

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};