import Accomodation from "../models/Accomodation.js";
import AddRoom from "../models/AddRoom.js";
import SponsorAccomodationQuota from "../models/SponsorAccomodationQuota.js";
import AssignAccomodationService from "../models/AssignAccomodationService.js";

// =======================
// Helper Functions
// =======================

const getDateKey = (date) => {
  return new Date(date).toISOString().split("T")[0]; // YYYY-MM-DD
};


const formatDateIST = (date) => {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));
};


const getDatesBetween = (start, end) => {
  const dates = [];

  let current = new Date(start);

  // HOTEL NIGHT LOGIC
  while (current <= end) {
    dates.push(new Date(current));

    current.setUTCDate(
      current.getUTCDate() + 1
    );
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

    const checkin = new Date(checkinDateTime);
    const checkout = new Date(checkoutDateTime);

    if (isNaN(checkin) || isNaN(checkout)) {
      return res.status(400).json({
        success: false,
        message: "Invalid checkin or checkout datetime",
      });
    }

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
      hotelId,
    }).populate("hotelId").sort({
      checkinDateTime: 1,
    });

    if (rooms.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No quota available for selected hotel",
      });
    }

    const startDate = new Date(checkin);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(checkout);
    endDate.setUTCHours(0, 0, 0, 0);

    // HOTEL NIGHT LOGIC
    // checkout belongs to previous night's quota
    endDate.setUTCDate(endDate.getUTCDate() - 1);

    // =======================================
    // EARLY CHECKIN LOGIC
    // =======================================

    // Find room for selected checkin day
    const checkinDayRoom = rooms.find(
      r =>
        getDateKey(r.checkinDateTime) ===
        getDateKey(startDate) &&
        r.hotelId._id.toString() === hotelId.toString()
    );

    if (!checkinDayRoom) {
      return res.status(400).json({
        success: false,
        message: `No quota available for ${getDateKey(
          startDate
        )}`,
      });
    }

    // Standard checkin cutoff
    const standardCheckin = new Date(checkin);

    standardCheckin.setUTCHours(
      new Date(checkinDayRoom.checkinDateTime).getUTCHours(),
      new Date(checkinDayRoom.checkinDateTime).getUTCMinutes(),
      0,
      0
    );

    // =======================================
    // IF CHECKIN IS BEFORE CHECKIN CUTOFF
    // USE PREVIOUS DAY QUOTA
    // =======================================
    if (checkin < standardCheckin) {

      // Previous day
      const previousDate = new Date(startDate);
      previousDate.setUTCDate(previousDate.getUTCDate() - 1);

      // Check previous day room availability
      const previousDayRoom = rooms.find(
        r =>
          getDateKey(r.checkinDateTime) ===
          getDateKey(previousDate) &&
          r.hotelId._id.toString() === hotelId.toString()
      );

      // No previous day quota
      if (!previousDayRoom) {
        return res.status(400).json({
          success: false,
          message: `Early check-in requires previous day's quota. No quota available for ${getDateKey(
            previousDate
          )}`,
        });
      }

      // Use previous day quota
      startDate.setUTCDate(startDate.getUTCDate() - 1);
    }

    // =======================================
    // LATE CHECKOUT LOGIC
    // =======================================

    // Find room for checkout day
    const checkoutDayRoom = rooms.find(
      r =>
        getDateKey(r.checkinDateTime) ===
        getDateKey(endDate) &&
        r.hotelId._id.toString() === hotelId.toString()
    );

    if (!checkoutDayRoom) {
      return res.status(400).json({
        success: false,
        message: `No quota available for ${getDateKey(
          endDate
        )}`,
      });
    }

    // Standard checkout cutoff
    const standardCheckout = new Date(checkout);

    standardCheckout.setUTCHours(
      new Date(checkoutDayRoom.checkoutDateTime).getUTCHours(),
      new Date(checkoutDayRoom.checkoutDateTime).getUTCMinutes(),
      0,
      0
    );

    // =======================================
    // IF CHECKOUT EXCEEDS CHECKOUT CUTOFF
    // USE NEXT DAY QUOTA
    // =======================================
    if (checkout > standardCheckout) {

      // Add next day quota
      endDate.setUTCDate(endDate.getUTCDate() + 1);

      // Validate next day room exists
      const extraCheckoutRoom = rooms.find(
        r =>
          getDateKey(r.checkinDateTime) ===
          getDateKey(endDate) &&
          r.hotelId._id.toString() === hotelId.toString()
      );

      if (!extraCheckoutRoom) {
        return res.status(400).json({
          success: false,
          message: `Late checkout requires additional quota for ${getDateKey(
            endDate
          )}`,
        });
      }
    }

    const dates = getDatesBetween(startDate, endDate);

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
        r =>
          getDateKey(r.checkinDateTime) ===
          getDateKey(date) &&
          r.hotelId._id.toString() === hotelId.toString()
      );

      if (!room) {
        return res.status(400).json({
          success: false,
          message: `No quota available for ${getDateKey(
            date
          )} in selected hotel. Please select another date or reduce stay duration.`,
        });
      }

      // ===============================
      // ADDROOM DATETIME VALIDATION
      // ===============================

      // Checkin validation
      if (
        getDateKey(date) === getDateKey(checkin)
      ) {
        if (checkin < new Date(room.checkinDateTime)) {
          return res.status(400).json({
            success: false,
            message: `Check-in allowed only after ${formatDateIST(
              room.checkinDateTime
            )}`,
          });
        }
      }

      const quotaItem = quotaRecord.quotas.find(
        q => q.quotaId.toString() === room._id.toString()
      );

      if (!quotaItem) {
        return res.status(400).json({
          success: false,
          message: `Quota not assigned for ${getDateKey(date)}`,
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
            date: getDateKey(date),
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
          message: `Delegate already booked for ${getDateKey(date)}`,
        });
      }

      const used = await Accomodation.countDocuments({
        eventId,
        sponsorId,
        accomodationDays: {
          $elemMatch: {
            date: getDateKey(date),
            quotaId: room._id,
          },
        },
      });

      if (used >= quotaItem.numberOfQuota) {
        return res.status(400).json({
          success: false,
          message: `Quota full for ${getDateKey(date)}`,
        });
      }

      accomodationDays.push({
        date: getDateKey(date),
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
      checkinDateTime: checkin,
      checkoutDateTime: checkout,
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

    const bookings = await Accomodation.find({
      eventId,
      sponsorId,
    })
      .populate("hotelId", "hotelName checkinTime checkoutTime")
      .populate("eventRegistrationId", "prefix name email mobile regNum")
      .populate("otherEventRegistrationId", "prefix name email mobile regNum")
      .sort({ createdAt: -1 });

    // ===============================
    // GET ASSIGNED REGISTRATION IDS
    // ===============================
    const assignedData = await AssignAccomodationService.findOne({
      eventId,
      sponsorId,
    });

    const assignedRegistrationIds = assignedData
      ? assignedData.eventRegistrationId.map((id) =>
        id.toString()
      )
      : [];

    // ===============================
    // ADD STATUS FIELD
    // ===============================
    const data = bookings.map((item) => ({
      ...item.toObject(),

      // UI FIELD
      usedQuota: item.accomodationDays.length,

      // true = came from AssignAccomodationService
      // false = normal sponsor booking
      isAssignedAccomodationService:
        assignedRegistrationIds.includes(
          item.eventRegistrationId?._id?.toString()
        ) ||

        assignedRegistrationIds.includes(
          item.otherEventRegistrationId?._id?.toString()
        ),
    }));

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
// Get My Booked Assigned Accomodations
// =======================
export const getMyBookedAssignedAccomodations = async (req, res) => {
  try {
    const sponsorId = req.sponsor._id;
    const { eventId } = req.params;

    // ===============================
    // GET ASSIGNED DELEGATES
    // ===============================
    const assignedData = await AssignAccomodationService.findOne({
      eventId,
      sponsorId,
    });

    if (!assignedData) {
      return res.status(404).json({
        success: false,
        message: "No assigned accommodation services found",
      });
    }

    const assignedRegistrationIds =
      assignedData.eventRegistrationId.map((id) =>
        id.toString()
      );

    // ===============================
    // GET ONLY BOOKED ASSIGNED
    // ===============================
    const bookings = await Accomodation.find({
      eventId,
      sponsorId,

      $or: [
        {
          eventRegistrationId: {
            $in: assignedRegistrationIds,
          },
        },
        {
          otherEventRegistrationId: {
            $in: assignedRegistrationIds,
          },
        },
      ],
    })
      .populate(
        "hotelId",
        "hotelName checkinTime checkoutTime"
      )
      .populate(
        "eventRegistrationId",
        "prefix name email mobile regNum"
      )
      .populate(
        "otherEventRegistrationId",
        "prefix name email mobile regNum"
      )
      .sort({ createdAt: -1 });

    // ===============================
    // SAME RESPONSE FORMAT
    // ===============================
    const data = bookings.map((item) => ({
      ...item.toObject(),

      // UI FIELD
      usedQuota: item.accomodationDays.length,
    }));

    return res.status(200).json({
      success: true,
      message:
        "Booked assigned accomodation fetched successfully",
      data,
    });

  } catch (error) {
    console.error(
      "Get Booked Assigned Accommodation Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =======================
// Get All Accomodation By Event (Event Admin)
// =======================
export const getAllAccomodationByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const bookings = await Accomodation.find({
      eventId,
    })
      .populate(
        "hotelId",
        "hotelName checkinTime checkoutTime"
      )
      .populate(
        "sponsorId",
        "sponsorName contactPersonName email mobile"
      )
      .populate(
        "eventRegistrationId",
        "prefix name email mobile regNum"
      )
      .populate(
        "otherEventRegistrationId",
        "prefix name email mobile regNum"
      )
      .sort({ createdAt: -1 });

    const data = bookings.map((item) => ({
      ...item.toObject(),

      // =========================
      // UI FIELD
      // =========================
      usedQuota: item.accomodationDays.length,
    }));

    return res.status(200).json({
      success: true,
      message:
        "All accomodation fetched successfully",
      total: data.length,
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

    req._skipBookingId = id;

    // ===============================
    // REUSE CREATE VALIDATION LOGIC
    // ===============================
    const response = {
      statusCode: 200,
      body: null,
    };

    const mockRes = {
      status(code) {
        response.statusCode = code;
        return this;
      },

      json(data) {
        response.body = data;
        return data;
      },
    };

    await createAccomodation(req, mockRes);

    // Validation failed
    if (response.statusCode !== 201) {
      return res.status(response.statusCode).json(response.body);
    }

    // Get newly created booking
    const newBooking = await Accomodation.findOne({
      sponsorId,
      eventId,
      eventRegistrationId,
      checkinDateTime: new Date(checkinDateTime),
    })
      .sort({ createdAt: -1 });

    // Copy new data into old booking
    booking.eventRegistrationId = newBooking.eventRegistrationId;
    booking.hotelId = newBooking.hotelId;
    booking.roomType = newBooking.roomType;
    booking.guestName = newBooking.guestName;
    booking.otherEventRegistrationId =
      newBooking.otherEventRegistrationId;

    booking.checkinDateTime = newBooking.checkinDateTime;
    booking.checkoutDateTime = newBooking.checkoutDateTime;
    booking.accomodationDays = newBooking.accomodationDays;

    await booking.save();

    // Delete temporary booking
    await newBooking.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Accommodation updated successfully",
      data: booking,
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

    const dateWise = [];
    const hotelSummaryMap = {};

    for (let q of quotaRecord.quotas) {
      const room = q.quotaId;

      const used = await Accomodation.countDocuments({
        eventId,
        sponsorId,
        accomodationDays: {
          $elemMatch: {
            quotaId: room._id,
            date: getDateKey(room.checkinDateTime),
          },
        },
      });

      const remaining = Math.max(q.numberOfQuota - used, 0);
      const hotelName = room.hotelId.hotelName;

      // =========================
      // DATE WISE
      // =========================
      dateWise.push({
        hotelName,
        date: getDateKey(room.checkinDateTime),
        totalQuota: q.numberOfQuota,
        used,
        remaining,
      });

      // =========================
      // HOTEL WISE (AGGREGATION)
      // =========================
      if (!hotelSummaryMap[hotelName]) {
        hotelSummaryMap[hotelName] = {
          hotelName,
          totalQuota: 0,
          used: 0,
          remaining: 0,
        };
      }

      hotelSummaryMap[hotelName].totalQuota += q.numberOfQuota;
      hotelSummaryMap[hotelName].used += used;
      hotelSummaryMap[hotelName].remaining += remaining;
    }

    // Convert map → array
    const hotelWise = Object.values(hotelSummaryMap);

    return res.status(200).json({
      success: true,
      message: "Accomodation summary fetched",
      data: {
        dateWise,
        hotelWise,
      },
    });

  } catch (error) {
    console.error("Summary Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};