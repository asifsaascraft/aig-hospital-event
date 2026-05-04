import SponsorAccomodationQuota from "../models/SponsorAccomodationQuota.js";
import AddRoom from "../models/AddRoom.js";
import Event from "../models/Event.js";
import Sponsor from "../models/Sponsor.js";

// =======================
// Create Sponsor Accommodation Quota
// =======================
// CREATE
export const createSponsorAccomodationQuota = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { sponsorId, quotaId, numberOfQuota } = req.body;

    // ===============================
    // VALIDATION
    // ===============================
    if (!sponsorId) {
      return res.status(400).json({
        success: false,
        message: "Sponsor is required",
      });
    }

    if (!quotaId) {
      return res.status(400).json({
        success: false,
        message: "Accomodation quota is required",
      });
    }

    if (numberOfQuota === undefined || numberOfQuota < 1) {
      return res.status(400).json({
        success: false,
        message: "Number of accomodation quota must be at least 1",
      });
    }

    // ===============================
    // EXISTENCE CHECKS
    // ===============================
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const sponsor = await Sponsor.findById(sponsorId);
    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: "Sponsor not found",
      });
    }

    const room = await AddRoom.findById(quotaId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Accomodation quota not found for given quota",
      });
    }

    if (room.eventId.toString() !== eventId) {
      return res.status(400).json({
        success: false,
        message: "Selected accomodation quota does not belong to this event",
      });
    }

    if (room.availableRooms < numberOfQuota) {
      return res.status(400).json({
        success: false,
        message: `Insufficient rooms. Only ${room.availableRooms} rooms available`,
      });
    }

    // ===============================
    // CHECK EXISTING
    // ===============================
    let record = await SponsorAccomodationQuota.findOne({
      eventId,
      sponsorId,
    });

    if (!record) {
      room.availableRooms -= numberOfQuota;
      await room.save();

      const newRecord = await SponsorAccomodationQuota.create({
        eventId,
        sponsorId,
        quotas: [{ quotaId, numberOfQuota }],
      });

      return res.status(201).json({
        success: true,
        message: "Accommodation quota created successfully",
        data: newRecord,
      });
    }

    const existingQuota = record.quotas.find(
      (q) => q.quotaId.toString() === quotaId
    );

    if (existingQuota) {
      return res.status(400).json({
        success: false,
        message: "This Accomodation quota is already assigned to this sponsor. You can update",
      });
    }

    room.availableRooms -= numberOfQuota;
    await room.save();

    record.quotas.push({ quotaId, numberOfQuota });
    await record.save();

    return res.status(200).json({
      success: true,
      message: "New accomodation quota added to existing sponsor successfully",
      data: record,
    });

  } catch (error) {
    console.error("Create Quota Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating quota",
      error: error.message,
    });
  }
};


// =======================
// Get All by Event
// =======================
export const getSponsorAccomodationQuotasByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const quotas = await SponsorAccomodationQuota.find({ eventId })
      .populate("sponsorId")
      .populate({
        path: "quotas.quotaId",
        select: "checkinDate hotelId",
        populate: {
          path: "hotelId",
          select: "hotelName checkinTime checkoutTime",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: quotas,
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get My Quotas (Sponsor Only)
// =======================
export const getMyAccomodationQuotas = async (req, res) => {
  try {
    const { eventId } = req.params;
    const sponsorId = req.sponsor._id;

    const quota = await SponsorAccomodationQuota.findOne({
      eventId,
      sponsorId,
    })
      .populate({
        path: "quotas.quotaId",
        select: "checkinDate hotelId",
        populate: {
          path: "hotelId",
          select: "hotelName checkinTime checkoutTime",
        },
      });

    if (!quota) {
      return res.status(404).json({
        success: false,
        message: "No accommodation quota assigned to this sponsor",
      });
    }

    // ===============================
    //  GROUP BY HOTEL
    // ===============================
    const hotelMap = {};

    quota.quotas.forEach((q) => {
      const room = q.quotaId;
      const hotel = room.hotelId;

      if (!hotel) return;

      const hotelId = hotel._id.toString();

      if (!hotelMap[hotelId]) {
        hotelMap[hotelId] = {
          hotelId: hotel._id,
          hotelName: hotel.hotelName,
          checkinTime: hotel.checkinTime,
          checkoutTime: hotel.checkoutTime,
          dates: [],
        };
      }

      hotelMap[hotelId].dates.push({
        quotaId: room._id,
        checkinDate: room.checkinDate,
        numberOfQuota: q.numberOfQuota,
      });
    });

    // Convert to array
    const result = Object.values(hotelMap);

    // ===============================
    // OPTIONAL: SORT DATES
    // ===============================
    result.forEach((hotel) => {
      hotel.dates.sort(
        (a, b) =>
          new Date(a.checkinDate) - new Date(b.checkinDate)
      );
    });

    return res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error("Get My Quota Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =======================
// Update
// =======================
export const updateSponsorAccomodationQuota = async (req, res) => {
  try {
    const { id } = req.params;
    const { quotaId, numberOfQuota } = req.body;

    if (!quotaId) {
      return res.status(400).json({
        success: false,
        message: "Accomodation quota is required",
      });
    }

    if (numberOfQuota === undefined || numberOfQuota < 1) {
      return res.status(400).json({
        success: false,
        message: "number of accomodation quota must be at least 1",
      });
    }

    const record = await SponsorAccomodationQuota.findById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Accommodation quota record not found",
      });
    }

    const quotaItem = record.quotas.find(
      (q) => q.quotaId.toString() === quotaId
    );

    if (!quotaItem) {
      return res.status(404).json({
        success: false,
        message: "Specified accomodation quota not found in this sponsor record",
      });
    }

    const room = await AddRoom.findById(quotaId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const diff = numberOfQuota - quotaItem.numberOfQuota;

    if (diff > 0) {
      if (room.availableRooms < diff) {
        return res.status(400).json({
          success: false,
          message: `Not enough rooms available. Only ${room.availableRooms} rooms left`,
        });
      }
      room.availableRooms -= diff;
    } else if (diff < 0) {
      room.availableRooms += Math.abs(diff);
    }

    quotaItem.numberOfQuota = numberOfQuota;

    await room.save();
    await record.save();

    return res.status(200).json({
      success: true,
      message: "Quota updated successfully",
      data: record,
    });

  } catch (error) {
    console.error("Update Quota Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating quota",
      error: error.message,
    });
  }
};

// =======================
// Delete
// =======================
export const deleteSponsorAccomodationQuota = async (req, res) => {
  try {
    const { id, quotaId } = req.params;


    const record = await SponsorAccomodationQuota.findById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Accommodation quota record not found",
      });
    }

    const index = record.quotas.findIndex(
      (q) => q.quotaId.toString() === quotaId
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Accomodation quota not found in this sponsor record",
      });
    }

    const quotaItem = record.quotas[index];

    const room = await AddRoom.findById(quotaId);
    if (room) {
      room.availableRooms += quotaItem.numberOfQuota;

      if (room.availableRooms > room.numberOfRooms) {
        room.availableRooms = room.numberOfRooms;
      }

      await room.save();
    }

    record.quotas.splice(index, 1);

    if (record.quotas.length === 0) {
      await record.deleteOne();
    } else {
      await record.save();
    }

    return res.status(200).json({
      success: true,
      message: "Quota removed successfully",
    });

  } catch (error) {
    console.error("Delete Quota Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting quota",
      error: error.message,
    });
  }
};