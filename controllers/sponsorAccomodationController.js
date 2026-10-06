import Accomodation from "../models/Accomodation.js";
import AddRoom from "../models/AddRoom.js";
import SponsorAccomodationQuota from "../models/SponsorAccomodationQuota.js";
import AssignAccomodationService from "../models/AssignAccomodationService.js";
import RoomCategory from "../models/RoomCategory.js";
import Hotel from "../models/Hotel.js";
import Sponsor from "../models/Sponsor.js";

// =======================
// Helper Functions
// =======================

const HOTEL_TIMEZONE = "Asia/Kolkata";

const getDateKey = (date) => {
  return new Date(date).toISOString().split("T")[0];
};

const formatDateIST = (date) => {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: HOTEL_TIMEZONE,
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));
};

/**
 * Convert hotel's HH:mm time into an actual Date
 * on the same calendar date.
 *
 * Hotel times are stored as local Indian time.
 */
const applyHotelTime = (date, time, fieldName) => {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error(`Invalid hotel ${fieldName}. Expected HH:mm format`);
  }

  const [hours, minutes] = time.split(":").map(Number);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid hotel ${fieldName}. Expected HH:mm format`);
  }

  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: HOTEL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(date));

  const year = Number(dateParts.find((part) => part.type === "year").value);

  const month = Number(dateParts.find((part) => part.type === "month").value);

  const day = Number(dateParts.find((part) => part.type === "day").value);

  // IST = UTC + 05:30
  return new Date(
    Date.UTC(year, month - 1, day, hours - 5, minutes - 30, 0, 0),
  );
};

const getDatesBetween = (start, end) => {
  const dates = [];

  let current = new Date(start);

  while (current <= end) {
    dates.push(new Date(current));

    current.setUTCDate(current.getUTCDate() + 1);
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
      roomCategoryId,
      roomType,
      guestName,
      otherEventRegistrationId,
      remark,
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
    // ROOM CATEGORY VALIDATION
    // ===============================
    if (!roomCategoryId) {
      return res.status(400).json({
        success: false,
        message: "Room category selection is required",
      });
    }

    // ===============================
    // HOTEL VALIDATION
    // ===============================
    const hotel = await Hotel.findOne({
      _id: hotelId,
      status: "Active",
    });

    if (!hotel) {
      return res.status(400).json({
        success: false,
        message: "Selected hotel is not available",
      });
    }

    if (!hotel.checkinTime || !hotel.checkoutTime) {
      return res.status(400).json({
        success: false,
        message: "Hotel check-in and check-out time are not configured",
      });
    }

    const roomCategory = await RoomCategory.findOne({
      _id: roomCategoryId,
      hotelId,
      status: "Active",
    });

    if (!roomCategory) {
      return res.status(400).json({
        success: false,
        message: "Selected room category is not available for this hotel",
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
    const roomIds = quotaRecord.quotas
      .filter(
        (q) =>
          q.roomCategoryId &&
          q.roomCategoryId.toString() === roomCategoryId.toString(),
      )
      .map((q) => q.quotaId);

    const rooms = await AddRoom.find({
      _id: { $in: roomIds },
      hotelId,
      roomCategoryId,
    })
      .populate("hotelId")
      .populate("roomCategoryId")
      .sort({
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

    // =====================================================
    // HOTEL STANDARD CHECK-IN / CHECK-OUT TIME
    // =====================================================

    // Standard check-in time is hotel's configured checkinTime
    const standardCheckin = applyHotelTime(
      checkin,
      hotel.checkinTime,
      "check-in time",
    );

    // Standard checkout time is hotel's configured checkoutTime
    const standardCheckout = applyHotelTime(
      checkout,
      hotel.checkoutTime,
      "check-out time",
    );

    // =====================================================
    // EARLY CHECK-IN
    // =====================================================
    // Example:
    // Hotel check-in = 13:00
    //
    // Guest requests:
    // 27 Oct 10:00
    //
    // Then guest is arriving before standard check-in,
    // therefore previous day's quota is required.
    //
    // 26 Oct quota + 27 Oct quota
    // =====================================================

    if (checkin < standardCheckin) {
      const previousDate = new Date(startDate);

      previousDate.setUTCDate(previousDate.getUTCDate() - 1);

      const previousDayRoom = rooms.find(
        (r) =>
          getDateKey(r.checkinDateTime) === getDateKey(previousDate) &&
          r.hotelId._id.toString() === hotelId.toString() &&
          r.roomCategoryId._id.toString() === roomCategoryId.toString(),
      );

      if (!previousDayRoom) {
        return res.status(400).json({
          success: false,
          message:
            `Early check-in at ${hotel.checkinTime} requires ` +
            `an additional room quota for ` +
            `${getDateKey(previousDate)}. ` +
            `No quota is available for that date.`,
        });
      }

      // Consume previous day's quota also.
      startDate.setUTCDate(startDate.getUTCDate() - 1);
    }

    // =====================================================
    // NORMAL CHECKOUT NIGHT LOGIC
    // =====================================================
    //
    // Example:
    // 27 Oct 13:00 → 29 Oct 11:00
    //
    // Quota required:
    // 27 Oct
    // 28 Oct
    //
    // Checkout at exactly hotel checkout time does NOT
    // consume 29 Oct quota.
    // =====================================================

    endDate.setUTCDate(endDate.getUTCDate() - 1);

    // =====================================================
    // LATE CHECKOUT
    // =====================================================
    // Example:
    // Hotel checkout = 11:00
    //
    // Guest requests:
    // 29 Oct 14:00
    //
    // Therefore 29 Oct quota is additionally required.
    // =====================================================

    if (checkout > standardCheckout) {
      // Add checkout day quota
      endDate.setUTCDate(endDate.getUTCDate() + 1);

      const extraCheckoutRoom = rooms.find(
        (r) =>
          getDateKey(r.checkinDateTime) === getDateKey(endDate) &&
          r.hotelId._id.toString() === hotelId.toString() &&
          r.roomCategoryId._id.toString() === roomCategoryId.toString(),
      );

      if (!extraCheckoutRoom) {
        return res.status(400).json({
          success: false,
          message:
            `Late checkout after ${hotel.checkoutTime} ` +
            `requires additional room quota for ` +
            `${getDateKey(endDate)}. ` +
            `No quota is available for that date.`,
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
        (r) =>
          getDateKey(r.checkinDateTime) === getDateKey(date) &&
          r.hotelId._id.toString() === hotelId.toString() &&
          r.roomCategoryId._id.toString() === roomCategoryId.toString(),
      );

      if (!room) {
        return res.status(400).json({
          success: false,
          message: `No quota available for ${getDateKey(
            date,
          )} in selected hotel. Please select another date or reduce stay duration.`,
        });
      }

      const quotaItem = quotaRecord.quotas.find(
        (q) => q.quotaId.toString() === room._id.toString(),
      );

      // First check whether quota exists
      if (!quotaItem) {
        return res.status(400).json({
          success: false,
          message: `Quota not assigned for ${getDateKey(date)}`,
        });
      }

      // Then check room category
      if (
        !quotaItem.roomCategoryId ||
        quotaItem.roomCategoryId.toString() !== roomCategoryId.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: `Room category quota is not assigned for ${getDateKey(date)}`,
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
        hotelId: room.hotelId._id,
        roomCategoryId: room.roomCategoryId._id,
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
      roomCategoryId,
      roomType,
      guestName: roomType === "Double Occupancy" ? guestName : null,
      otherEventRegistrationId:
        roomType === "Twin Sharing" ? otherEventRegistrationId : null,
      checkinDateTime: checkin,
      checkoutDateTime: checkout,
      accomodationDays,
      remark,
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
      .populate("roomCategoryId", "roomCategoryName")
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
      ? assignedData.eventRegistrationId.map((id) => id.toString())
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
          item.eventRegistrationId?._id?.toString(),
        ) ||
        assignedRegistrationIds.includes(
          item.otherEventRegistrationId?._id?.toString(),
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

    const assignedRegistrationIds = assignedData.eventRegistrationId.map((id) =>
      id.toString(),
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
      .populate("hotelId", "hotelName checkinTime checkoutTime")
      .populate("roomCategoryId", "roomCategoryName")
      .populate("eventRegistrationId", "prefix name email mobile regNum")
      .populate("otherEventRegistrationId", "prefix name email mobile regNum")
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
      message: "Booked assigned accomodation fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Get Booked Assigned Accommodation Error:", error);

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
      .populate("hotelId", "hotelName checkinTime checkoutTime")
      .populate("roomCategoryId", "roomCategoryName")
      .populate("sponsorId", "sponsorName contactPersonName email mobile")
      .populate("eventRegistrationId", "prefix name email mobile regNum")
      .populate("otherEventRegistrationId", "prefix name email mobile regNum")
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
      message: "All accomodation fetched successfully",
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
      roomCategoryId,
      roomType,
      guestName,
      otherEventRegistrationId,
      remark,
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
    }).sort({ createdAt: -1 });

    // Copy new data into old booking
    booking.eventRegistrationId = newBooking.eventRegistrationId;
    booking.hotelId = newBooking.hotelId;
    booking.roomCategoryId = newBooking.roomCategoryId;
    booking.roomType = newBooking.roomType;
    booking.guestName = newBooking.guestName;
    booking.otherEventRegistrationId = newBooking.otherEventRegistrationId;

    booking.checkinDateTime = newBooking.checkinDateTime;
    booking.checkoutDateTime = newBooking.checkoutDateTime;
    booking.accomodationDays = newBooking.accomodationDays;
    booking.remark = newBooking.remark;

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

    // ===============================
    // GET SPONSOR QUOTA
    // ===============================
    const quotaRecord = await SponsorAccomodationQuota.findOne({
      eventId,
      sponsorId,
    }).populate({
      path: "quotas.quotaId",
      populate: [
        {
          path: "hotelId",
          select: "hotelName",
        },
        {
          path: "roomCategoryId",
          select: "roomCategoryName",
        },
      ],
    });

    if (!quotaRecord) {
      return res.status(404).json({
        success: false,
        message: "No quota assigned",
      });
    }

    // ===============================
    // RESPONSE ARRAYS / MAPS
    // ===============================
    const dateWise = [];

    const roomCategorySummaryMap = {};

    const hotelSummaryMap = {};

    // ===============================
    // LOOP THROUGH SPONSOR QUOTAS
    // ===============================
    for (const q of quotaRecord.quotas) {
      const room = q.quotaId;

      // Safety check
      if (!room) {
        continue;
      }

      // ===============================
      // HOTEL INFORMATION
      // ===============================
      const hotel = room.hotelId;

      if (!hotel) {
        continue;
      }

      const hotelName = hotel.hotelName;

      // ===============================
      // ROOM CATEGORY INFORMATION
      // ===============================
      const roomCategoryId =
        q.roomCategoryId?.toString() || room.roomCategoryId?._id?.toString();

      const roomCategoryName =
        q.roomCategoryId?.roomCategoryName ||
        room.roomCategoryId?.roomCategoryName ||
        "Unknown";

      // ===============================
      // DATE
      // ===============================
      const date = getDateKey(room.checkinDateTime);

      // ===============================
      // COUNT USED QUOTA
      // ===============================
      const used = await Accomodation.countDocuments({
        eventId,
        sponsorId,

        accomodationDays: {
          $elemMatch: {
            date,
            quotaId: room._id,
            roomCategoryId: roomCategoryId,
          },
        },
      });

      // ===============================
      // REMAINING
      // ===============================
      const remaining = Math.max(q.numberOfQuota - used, 0);

      // =====================================================
      // 1. DATE WISE
      // =====================================================
      dateWise.push({
        hotelName,

        roomCategoryId: roomCategoryId || null,

        roomCategoryName,

        date,

        totalQuota: q.numberOfQuota,

        used,

        remaining,
      });

      // =====================================================
      // 2. ROOM CATEGORY WISE
      // =====================================================

      // Unique key = Hotel + Room Category
      const categoryKey = `${hotel._id}_${roomCategoryId}`;

      if (!roomCategorySummaryMap[categoryKey]) {
        roomCategorySummaryMap[categoryKey] = {
          hotelId: hotel._id,

          hotelName,

          roomCategoryId: roomCategoryId || null,

          roomCategoryName,

          totalQuota: 0,

          used: 0,

          remaining: 0,
        };
      }

      roomCategorySummaryMap[categoryKey].totalQuota += q.numberOfQuota;

      roomCategorySummaryMap[categoryKey].used += used;

      roomCategorySummaryMap[categoryKey].remaining += remaining;

      // =====================================================
      // 3. HOTEL WISE
      // =====================================================

      const hotelKey = hotel._id.toString();

      if (!hotelSummaryMap[hotelKey]) {
        hotelSummaryMap[hotelKey] = {
          hotelId: hotel._id,

          hotelName,

          totalQuota: 0,

          used: 0,

          remaining: 0,
        };
      }

      hotelSummaryMap[hotelKey].totalQuota += q.numberOfQuota;

      hotelSummaryMap[hotelKey].used += used;

      hotelSummaryMap[hotelKey].remaining += remaining;
    }

    // ===============================
    // CONVERT MAPS → ARRAYS
    // ===============================
    const roomCategoryWise = Object.values(roomCategorySummaryMap);

    const hotelWise = Object.values(hotelSummaryMap);

    // ===============================
    // SORT DATE WISE
    // ===============================
    dateWise.sort((a, b) => new Date(a.date) - new Date(b.date));

    // ===============================
    // SORT ROOM CATEGORY WISE
    // ===============================
    roomCategoryWise.sort((a, b) => {
      if (a.hotelName !== b.hotelName) {
        return a.hotelName.localeCompare(b.hotelName);
      }

      return a.roomCategoryName.localeCompare(b.roomCategoryName);
    });

    // ===============================
    // SORT HOTEL WISE
    // ===============================
    hotelWise.sort((a, b) => a.hotelName.localeCompare(b.hotelName));

    // ===============================
    // RESPONSE
    // ===============================
    return res.status(200).json({
      success: true,
      message: "Accomodation summary fetched",

      data: {
        dateWise,

        roomCategoryWise,

        hotelWise,
      },
    });
  } catch (error) {
    console.error("Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// =====================================================
// EVENT ADMIN - ACCOMODATION SUMMARY
// =====================================================

export const getEventAdminAccomodationSummary = async (req, res) => {
  try {
    const { eventId } = req.params;

    // =====================================================
    // 1. GET ALL ROOMS ADDED FOR EVENT
    // =====================================================

    const addRooms = await AddRoom.find({ eventId })
      .populate("hotelId", "hotelName")
      .populate("roomCategoryId", "roomCategoryName")
      .sort({ checkinDateTime: 1 });

    if (!addRooms.length) {
      return res.status(404).json({
        success: false,
        message: "No accommodation rooms found for this event",
      });
    }

    // =====================================================
    // 2. GET ALL SPONSOR QUOTAS FOR EVENT
    // =====================================================

    const quotaRecords = await SponsorAccomodationQuota.find({
      eventId,
    })
      .populate("sponsorId", "sponsorName contactPersonName email mobile")
      .populate({
        path: "quotas.quotaId",
        populate: [
          {
            path: "hotelId",
            select: "hotelName",
          },
          {
            path: "roomCategoryId",
            select: "roomCategoryName",
          },
        ],
      });

    // =====================================================
    // MAPS
    // =====================================================

    const hotelWiseMap = {};
    const roomCategoryWiseMap = {};
    const sponsorWiseMap = {};
    const dateWiseMap = {};

    const quotaWise = [];

    // =====================================================
    // OVERVIEW VARIABLES
    // =====================================================

    let totalRoomsAdded = 0;
    let totalQuotaAllocated = 0;
    let totalBookedRooms = 0;

    // =====================================================
    // 3. PROCESS ALL ADD ROOM RECORDS
    // =====================================================

    for (const room of addRooms) {
      if (!room.hotelId || !room.roomCategoryId) {
        continue;
      }

      const hotelId = room.hotelId._id.toString();

      const roomCategoryId = room.roomCategoryId._id.toString();

      const hotelName = room.hotelId.hotelName;

      const roomCategoryName = room.roomCategoryId.roomCategoryName;

      const totalRooms = Number(room.numberOfRooms || 0);

      const availableRooms = Number(room.availableRooms || 0);

      /*
       * Number of rooms already allocated from AddRoom
       */
      const allocatedRooms = Math.max(
        totalRooms - availableRooms,
        0
      );

      totalRoomsAdded += totalRooms;

      // ===================================================
      // HOTEL WISE
      // ===================================================

      if (!hotelWiseMap[hotelId]) {
        hotelWiseMap[hotelId] = {
          hotelId,
          hotelName,

          totalRooms: 0,
          quotaAllocated: 0,
          bookedRooms: 0,
          remainingQuota: 0,
          availableRooms: 0,
        };
      }

      hotelWiseMap[hotelId].totalRooms += totalRooms;

      hotelWiseMap[hotelId].availableRooms += availableRooms;

      // ===================================================
      // ROOM CATEGORY WISE
      // ===================================================

      const categoryKey = `${hotelId}_${roomCategoryId}`;

      if (!roomCategoryWiseMap[categoryKey]) {
        roomCategoryWiseMap[categoryKey] = {
          hotelId,
          hotelName,

          roomCategoryId,
          roomCategoryName,

          totalRooms: 0,
          quotaAllocated: 0,
          bookedRooms: 0,
          remainingQuota: 0,
          availableRooms: 0,
        };
      }

      roomCategoryWiseMap[categoryKey].totalRooms += totalRooms;

      roomCategoryWiseMap[categoryKey].availableRooms += availableRooms;
    }

    // =====================================================
    // 4. PROCESS SPONSOR QUOTAS
    // =====================================================

    for (const quotaRecord of quotaRecords) {
      const sponsor = quotaRecord.sponsorId;

      if (!sponsor) {
        continue;
      }

      const sponsorId = sponsor._id.toString();

      const sponsorName =
        sponsor.sponsorName ||
        sponsor.contactPersonName ||
        "Unknown Sponsor";

      // ===================================================
      // CREATE SPONSOR ENTRY
      // ===================================================

      if (!sponsorWiseMap[sponsorId]) {
        sponsorWiseMap[sponsorId] = {
          sponsorId,
          sponsorName,

          contactPersonName: sponsor.contactPersonName || null,

          email: sponsor.email || null,

          mobile: sponsor.mobile || null,

          totalQuota: 0,
          usedQuota: 0,
          remainingQuota: 0,

          hotels: [],
        };
      }

      // ===================================================
      // PROCESS EACH QUOTA
      // ===================================================

      for (const q of quotaRecord.quotas) {
        const room = q.quotaId;

        if (!room || !room.hotelId || !room.roomCategoryId) {
          continue;
        }

        const hotelId = room.hotelId._id.toString();

        const hotelName = room.hotelId.hotelName;

        const roomCategoryId =
          q.roomCategoryId?._id?.toString() ||
          q.roomCategoryId?.toString() ||
          room.roomCategoryId?._id?.toString();

        const roomCategoryName =
          q.roomCategoryId?.roomCategoryName ||
          room.roomCategoryId?.roomCategoryName ||
          "Unknown";

        const quota = Number(q.numberOfQuota || 0);

        // =================================================
        // DATE
        // =================================================

        const date = getDateKey(room.checkinDateTime);

        // =================================================
        // COUNT ACTUAL BOOKED ROOMS
        // =================================================

        const used = await Accomodation.countDocuments({
          eventId,

          sponsorId,

          accomodationDays: {
            $elemMatch: {
              date,
              quotaId: room._id,
              roomCategoryId,
            },
          },
        });

        const remaining = Math.max(quota - used, 0);

        // =================================================
        // OVERVIEW
        // =================================================

        totalQuotaAllocated += quota;

        totalBookedRooms += used;

        // =================================================
        // SPONSOR WISE
        // =================================================

        sponsorWiseMap[sponsorId].totalQuota += quota;

        sponsorWiseMap[sponsorId].usedQuota += used;

        sponsorWiseMap[sponsorId].remainingQuota += remaining;

        // =================================================
        // SPONSOR HOTEL DETAIL
        // =================================================

        sponsorWiseMap[sponsorId].hotels.push({
          hotelId,
          hotelName,

          roomCategoryId,
          roomCategoryName,

          quota,
          used,
          remaining,

          date,

          checkinDateTime: room.checkinDateTime,
          checkoutDateTime: room.checkoutDateTime,
        });

        // =================================================
        // HOTEL WISE
        // =================================================

        if (!hotelWiseMap[hotelId]) {
          hotelWiseMap[hotelId] = {
            hotelId,
            hotelName,

            totalRooms: 0,
            quotaAllocated: 0,
            bookedRooms: 0,
            remainingQuota: 0,
            availableRooms: 0,
          };
        }

        hotelWiseMap[hotelId].quotaAllocated += quota;

        hotelWiseMap[hotelId].bookedRooms += used;

        hotelWiseMap[hotelId].remainingQuota += remaining;

        // =================================================
        // ROOM CATEGORY WISE
        // =================================================

        const categoryKey = `${hotelId}_${roomCategoryId}`;

        if (!roomCategoryWiseMap[categoryKey]) {
          roomCategoryWiseMap[categoryKey] = {
            hotelId,
            hotelName,

            roomCategoryId,
            roomCategoryName,

            totalRooms: 0,
            quotaAllocated: 0,
            bookedRooms: 0,
            remainingQuota: 0,
            availableRooms: 0,
          };
        }

        roomCategoryWiseMap[categoryKey].quotaAllocated += quota;

        roomCategoryWiseMap[categoryKey].bookedRooms += used;

        roomCategoryWiseMap[categoryKey].remainingQuota += remaining;

        // =================================================
        // DATE WISE
        // =================================================

        const dateKey = `${date}_${hotelId}_${roomCategoryId}`;

        if (!dateWiseMap[dateKey]) {
          dateWiseMap[dateKey] = {
            date,

            hotelId,
            hotelName,

            roomCategoryId,
            roomCategoryName,

            totalQuota: 0,
            used: 0,
            remaining: 0,
          };
        }

        dateWiseMap[dateKey].totalQuota += quota;

        dateWiseMap[dateKey].used += used;

        dateWiseMap[dateKey].remaining += remaining;

        // =================================================
        // QUOTA WISE DETAIL
        // =================================================

        quotaWise.push({
          quotaId: room._id,

          sponsorId,
          sponsorName,

          hotelId,
          hotelName,

          roomCategoryId,
          roomCategoryName,

          date,

          checkinDateTime: room.checkinDateTime,

          checkoutDateTime: room.checkoutDateTime,

          totalRooms: room.numberOfRooms,

          availableRooms: room.availableRooms,

          quotaAllocated: quota,

          bookedRooms: used,

          remainingQuota: remaining,
        });
      }
    }

    // =====================================================
    // 5. CALCULATE OVERVIEW
    // =====================================================

    const totalAvailableRooms = addRooms.reduce(
      (sum, room) => sum + Number(room.availableRooms || 0),
      0
    );

    const totalHotels = Object.keys(hotelWiseMap).length;

    const totalRoomCategories =
      Object.keys(roomCategoryWiseMap).length;

    const totalSponsors =
      Object.keys(sponsorWiseMap).length;

    const totalRoomsAllocatedToSponsors = addRooms.reduce(
      (sum, room) => {
        const total = Number(room.numberOfRooms || 0);

        const available = Number(room.availableRooms || 0);

        return sum + Math.max(total - available, 0);
      },
      0
    );

    // =====================================================
    // 6. CONVERT MAPS TO ARRAYS
    // =====================================================

    const hotelWise = Object.values(hotelWiseMap);

    const roomCategoryWise =
      Object.values(roomCategoryWiseMap);

    const sponsorWise =
      Object.values(sponsorWiseMap);

    const dateWise =
      Object.values(dateWiseMap);

    // =====================================================
    // 7. SORT DATA
    // =====================================================

    hotelWise.sort((a, b) =>
      a.hotelName.localeCompare(b.hotelName)
    );

    roomCategoryWise.sort((a, b) => {
      if (a.hotelName !== b.hotelName) {
        return a.hotelName.localeCompare(b.hotelName);
      }

      return a.roomCategoryName.localeCompare(
        b.roomCategoryName
      );
    });

    sponsorWise.sort((a, b) =>
      a.sponsorName.localeCompare(b.sponsorName)
    );

    dateWise.sort(
      (a, b) =>
        new Date(a.date) - new Date(b.date)
    );

    quotaWise.sort((a, b) => {
      if (a.hotelName !== b.hotelName) {
        return a.hotelName.localeCompare(b.hotelName);
      }

      return a.sponsorName.localeCompare(
        b.sponsorName
      );
    });

    // =====================================================
    // 8. FINAL RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      message:
        "Event Admin accommodation summary fetched successfully",

      data: {
        // ===============================================
        // OVERVIEW
        // ===============================================

        overview: {
          totalHotels,

          totalRoomCategories,

          totalSponsors,

          totalRoomsAdded,

          totalRoomsAllocatedToSponsors,

          totalQuotaAllocated,

          totalBookedRooms,

          totalAvailableRooms,

          totalQuotaRemaining: Math.max(
            totalQuotaAllocated - totalBookedRooms,
            0
          ),
        },

        // ===============================================
        // HOTEL WISE
        // ===============================================

        hotelWise,

        // ===============================================
        // ROOM CATEGORY WISE
        // ===============================================

        roomCategoryWise,

        // ===============================================
        // SPONSOR WISE
        // ===============================================

        sponsorWise,

        // ===============================================
        // DATE WISE
        // ===============================================

        dateWise,

        // ===============================================
        // DETAILED QUOTA WISE
        // ===============================================

        quotaWise,
      },
    });
  } catch (error) {
    console.error(
      "Event Admin Accommodation Summary Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message: "Server error",

      error: error.message,
    });
  }
};