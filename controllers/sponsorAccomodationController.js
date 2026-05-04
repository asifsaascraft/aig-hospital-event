import Accomodation from "../models/Accomodation.js";
import AddRoom from "../models/AddRoom.js";
import SponsorAccomodationQuota from "../models/SponsorAccomodationQuota.js";

// =======================
// Helper Functions
// =======================

const convertUTCToIST = (date) => {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
};

const formatDateIST = (date) => {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const parseTime = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return { h, m };
};

const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getDatesBetween = (start, end) => {
  const dates = [];
  let current = new Date(start);

  while (current < end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};


// =======================
// CREATE ACCOMODATION
// =======================
export const createAccomodation = async (req, res) => {
  try {
    const { eventId } = req.params;
    const sponsorId = req.sponsor._id;

    const {
      eventRegistrationId,
      checkinDateTime,
      checkoutDateTime,
      hotelId,
      roomType,
      guestName,
      otherEventRegistrationId,
    } = req.body;

    // ===============================
    // BASIC VALIDATION
    // ===============================
    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: "Hotel selection is required",
      });
    }

    // ===============================
    // ROOM TYPE VALIDATION
    // ===============================
    if (!roomType) {
      return res.status(400).json({
        success: false,
        message: "Room type is required",
      });
    }

    if (roomType === "Double Occupancy" && !guestName) {
      return res.status(400).json({
        success: false,
        message: "Guest name is required for Double Occupancy",
      });
    }

    if (roomType === "Twin Sharing" && !otherEventRegistrationId) {
      return res.status(400).json({
        success: false,
        message: "Other delegate is required for Twin Sharing",
      });
    }

    if (
      roomType === "Twin Sharing" &&
      eventRegistrationId === otherEventRegistrationId
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot select the same delegate for Twin Sharing",
      });
    }

    // ===============================
    // PREVENT DUPLICATE BOOKING (FULL CHECK)
    // ===============================
    const existingBooking = await Accomodation.findOne({
      eventId,
      ...(req._skipBookingId && { _id: { $ne: req._skipBookingId } }),
      $or: [
        { eventRegistrationId },
        { otherEventRegistrationId: eventRegistrationId },
        ...(otherEventRegistrationId
          ? [
            { eventRegistrationId: otherEventRegistrationId },
            { otherEventRegistrationId },
          ]
          : []),
      ],
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message:
          "One of the selected delegates already has an accommodation booking",
      });
    }

    if (!checkinDateTime || !checkoutDateTime) {
      return res.status(400).json({
        success: false,
        message: "Checkin and checkout datetime are required",
      });
    }

    const checkinUTC = new Date(checkinDateTime);
    const checkoutUTC = new Date(checkoutDateTime);

    const checkin = convertUTCToIST(checkinUTC);
    const checkout = convertUTCToIST(checkoutUTC);

    if (checkin >= checkout) {
      return res.status(400).json({
        success: false,
        message: "Checkout date must be after checkin date",
      });
    }

    // ===============================
    // GET SPONSOR QUOTAS
    // ===============================
    const quotaRecord = await SponsorAccomodationQuota.findOne({
      eventId,
      sponsorId,
    });

    if (!quotaRecord) {
      return res.status(400).json({
        success: false,
        message: "No accommodation quota assigned",
      });
    }

    // ===============================
    // LOAD ROOMS OF THIS HOTEL ONLY
    // ===============================
    const roomIds = quotaRecord.quotas.map(q => q.quotaId);

    const rooms = await AddRoom.find({
      _id: { $in: roomIds },
      hotelId: hotelId
    }).populate("hotelId");

    if (rooms.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No quota available for selected hotel",
      });
    }

    const hotel = rooms[0].hotelId;

    // ===============================
    // TIME VALIDATION
    // ===============================
    const [checkinHour, checkinMin] = hotel.checkinTime.split(":").map(Number);
    const [checkoutHour, checkoutMin] = hotel.checkoutTime.split(":").map(Number);

    //  EARLY CHECKIN
    if (
      checkin.getHours() < checkinHour ||
      (checkin.getHours() === checkinHour &&
        checkin.getMinutes() < checkinMin)
    ) {
      return res.status(400).json({
        success: false,
        message: `Check-in allowed only after ${hotel.checkinTime}. Please book from previous date.`,
      });
    }

    //  LATE CHECKOUT
    if (
      checkout.getHours() > checkoutHour ||
      (checkout.getHours() === checkoutHour &&
        checkout.getMinutes() > checkoutMin)
    ) {
      return res.status(400).json({
        success: false,
        message: `Checkout exceeds ${hotel.checkoutTime}. Please include next date.`,
      });
    }

    const startDate = normalizeDate(checkin);
    const endDate = normalizeDate(checkout);

    const dates = [];
    let current = new Date(startDate);

    while (current < endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    if (dates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one day booking required",
      });
    }

    const accomodationDays = [];

    // ===============================
    // VALIDATE EACH DATE
    // ===============================
    for (let date of dates) {

      const room = rooms.find(
        r => normalizeDate(r.checkinDate).getTime() === normalizeDate(date).getTime()
      );

      if (!room) {
        return res.status(400).json({
          success: false,
          message: `No quota available for ${formatDateIST(date)} in selected hotel`,
        });
      }

      const quotaItem = quotaRecord.quotas.find(
        q => q.quotaId.toString() === room._id.toString()
      );

      if (!quotaItem) {
        return res.status(400).json({
          success: false,
          message: `Quota not assigned for ${formatDateIST(date)}`,
        });
      }

      // ===============================
      // PREVENT SAME DELEGATE OVERLAP (PER DAY)
      // ===============================
      const alreadyBooked = await Accomodation.findOne({
        eventId,
        ...(req._skipBookingId && { _id: { $ne: req._skipBookingId } }),
        accomodationDays: {
          $elemMatch: {
            date: normalizeDate(date),
          },
        },
        $or: [
          { eventRegistrationId },
          { otherEventRegistrationId: eventRegistrationId },
          ...(otherEventRegistrationId
            ? [
              { eventRegistrationId: otherEventRegistrationId },
              { otherEventRegistrationId },
            ]
            : []),
        ],
      });

      if (alreadyBooked) {
        return res.status(400).json({
          success: false,
          message: `Delegate already booked for ${formatDateIST(date)}`,
        });
      }

      const used = await Accomodation.countDocuments({
        eventId,
        sponsorId,
        accomodationDays: {
          $elemMatch: {
            date: normalizeDate(date),
            quotaId: room._id,
          },
        },
      });

      if (used >= quotaItem.numberOfQuota) {
        return res.status(400).json({
          success: false,
          message: `Quota full for ${formatDateIST(date)}`,
        });
      }

      accomodationDays.push({
        date: normalizeDate(date),
        quotaId: room._id,
        hotelId: room.hotelId._id
      });
    }

    // ===============================
    // CREATE BOOKING
    // ===============================
    const booking = await Accomodation.create({
      eventId,
      sponsorId,
      eventRegistrationId,
      hotelId,
      roomType,
      guestName: roomType === "Double Occupancy" ? guestName : null,
      otherEventRegistrationId:
        roomType === "Twin Sharing" ? otherEventRegistrationId : null,
      checkinDateTime: checkinUTC,
      checkoutDateTime: checkoutUTC,
      accomodationDays
    });

    return res.status(201).json({
      success: true,
      message: "Accommodation booked successfully",
      data: booking,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =======================
// Get Accomodation by Sponsor
// =======================
export const getAccomodationBySponsor = async (req, res) => {
  try {
    const sponsorId = req.sponsor._id;
    const { eventId } = req.params;

    const data = await Accomodation.find({
      eventId,
      sponsorId,
    })
      .populate("hotelId", "hotelName checkinTime checkoutTime")
      .populate("eventRegistrationId", "prefix name email mobile regNum")
      .populate("otherEventRegistrationId", "prefix name email mobile regNum")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Accomodation fetched successfully",
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// =======================
// Update Accomodation
// =======================
export const updateAccomodation = async (req, res) => {
  try {
    const sponsorId = req.sponsor._id;
    const { id } = req.params;
    const { eventId } = req.params;

    const {
      eventRegistrationId,
      checkinDateTime,
      checkoutDateTime,
      hotelId,
      roomType,
      guestName,
      otherEventRegistrationId,
    } = req.body;

    const booking = await Accomodation.findOne({
      _id: id,
      sponsorId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Accomodation not found",
      });
    }

    // ===============================
    // DUPLICATE CHECK (IGNORE CURRENT)
    // ===============================
    const existingBooking = await Accomodation.findOne({
      _id: { $ne: id },
      eventId,
      $or: [
        { eventRegistrationId },
        { otherEventRegistrationId: eventRegistrationId },
        ...(otherEventRegistrationId
          ? [
            { eventRegistrationId: otherEventRegistrationId },
            { otherEventRegistrationId },
          ]
          : []),
      ],
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message:
          "One of the selected delegates already has an accommodation booking",
      });
    }

    // ===============================
    // TEMPORARILY REMOVE CURRENT BOOKING FROM CHECK
    // ===============================
    req._skipBookingId = id;

    // Try creating new booking FIRST
    const result = await createAccomodation(req, {
      status: () => ({
        json: (data) => data,
      }),
    });

    // If failed → DO NOT delete old
    if (!result || result.success === false) {
      return res.status(400).json(result);
    }

    // Now delete old booking
    await booking.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Accommodation updated successfully",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
};

// =======================
// Delete Accomodation
// =======================
export const deleteAccomodation = async (req, res) => {
  try {
    const sponsorId = req.sponsor._id;
    const { id } = req.params;

    const booking = await Accomodation.findOne({
      _id: id,
      sponsorId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Accomodation not found",
      });
    }

    await booking.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Accomodation deleted successfully",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};


// =======================
// Accomodation Summary
// =======================
export const getAccomodationSummary = async (req, res) => {
  try {
    const sponsorId = req.sponsor._id;
    const { eventId } = req.params;

    const quotaRecord = await SponsorAccomodationQuota.findOne({
      eventId,
      sponsorId,
    }).populate({
      path: "quotas.quotaId",
      populate: {
        path: "hotelId",
        select: "hotelName",
      },
    });

    if (!quotaRecord) {
      return res.status(404).json({
        success: false,
        message: "No quota assigned",
      });
    }

    const summary = [];

    for (let q of quotaRecord.quotas) {
      const room = q.quotaId;

      const used = await Accomodation.countDocuments({
        eventId,
        sponsorId,
        accomodationDays: {
          $elemMatch: {
            quotaId: room._id,
            date: normalizeDate(room.checkinDate),
          },
        },
      });

      summary.push({
        hotelName: room.hotelId.hotelName,
        date: room.checkinDate,
        totalQuota: q.numberOfQuota,
        used,
        remaining: Math.max(q.numberOfQuota - used, 0),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Accomodation summary fetched",
      data: summary,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};