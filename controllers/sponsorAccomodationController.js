import mongoose from "mongoose";
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

// Convert a stored UTC Date into its Indian calendar date (YYYY-MM-DD).
const getDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: HOTEL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
};

// Accept ISO timestamps and common Indian date/time formats.
// Date/time strings without an explicit timezone are interpreted as IST.
const parseDateTimeIST = (value) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value);
  }
  if (typeof value !== "string" || !value.trim()) return null;

  const input = value.trim();
  const indianMatch = input.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );

  if (indianMatch) {
    const [
      ,
      dayText,
      monthText,
      yearText,
      hourText = "0",
      minuteText = "0",
      secondText = "0",
    ] = indianMatch;

    const day = Number(dayText);
    const month = Number(monthText);
    const year = Number(yearText);
    const hour = Number(hourText);
    const minute = Number(minuteText);
    const second = Number(secondText);

    if (
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31 ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59 ||
      second < 0 ||
      second > 59
    ) {
      return null;
    }

    const result = new Date(
      Date.UTC(year, month - 1, day, hour - 5, minute - 30, second),
    );

    // Reject impossible dates such as 31/02/2026.
    const check = new Date(Date.UTC(year, month - 1, day));

    if (
      check.getUTCFullYear() !== year ||
      check.getUTCMonth() !== month - 1 ||
      check.getUTCDate() !== day
    ) {
      return null;
    }

    return result;
  }

  // A timezone-less ISO date/time is treated as Indian time, not server-local time.
  const timezoneLessISO =
    /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?)?$/.test(
      input,
    );

  const normalized = timezoneLessISO
    ? `${input.replace(" ", "T")}${
        input.length === 10 ? "T00:00:00" : ""
      }+05:30`
    : input;

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateIST = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date/time";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: HOTEL_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
};

const addDaysToDateKey = (dateKey, amount) => {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};

const getDatesBetweenKeys = (startKey, endKey) => {
  const dates = [];
  let current = startKey;

  while (current && current <= endKey) {
    dates.push(current);
    current = addDaysToDateKey(current, 1);
  }

  return dates;
};

const badRequest = (message) => ({
  statusCode: 400,
  body: { success: false, message },
});

const notFound = (message) => ({
  statusCode: 404,
  body: { success: false, message },
});

// Shared create/update validation. A sponsor can book only from its assigned
// quota, for the selected hotel + room category, and only while quota remains.
const prepareAccommodationBooking = async ({
  eventId,
  sponsorId,
  payload,
  ignoreBookingId = null,
}) => {
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
  } = payload;

  if (!mongoose.isValidObjectId(eventId)) {
    return badRequest("Invalid event ID");
  }

  if (!eventRegistrationId || !mongoose.isValidObjectId(eventRegistrationId)) {
    return badRequest("A valid delegate registration is required");
  }

  if (!hotelId || !mongoose.isValidObjectId(hotelId)) {
    return badRequest("A valid hotel selection is required");
  }

  if (!roomCategoryId || !mongoose.isValidObjectId(roomCategoryId)) {
    return badRequest("A valid room category selection is required");
  }

  if (
    !roomType ||
    !["Single Occupancy", "Double Occupancy", "Twin Sharing"].includes(roomType)
  ) {
    return badRequest("Please select a valid room type");
  }

  if (roomType === "Double Occupancy" && !String(guestName || "").trim()) {
    return badRequest("Guest name is required for Double Occupancy");
  }

  if (roomType === "Twin Sharing") {
    if (
      !otherEventRegistrationId ||
      !mongoose.isValidObjectId(otherEventRegistrationId)
    ) {
      return badRequest("A valid second delegate is required for Twin Sharing");
    }

    if (
      eventRegistrationId.toString() === otherEventRegistrationId.toString()
    ) {
      return badRequest("You cannot select the same delegate for Twin Sharing");
    }
  }

  if (!checkinDateTime || !checkoutDateTime) {
    return badRequest("Check-in and check-out date/time are required");
  }

  const checkin = parseDateTimeIST(checkinDateTime);
  const checkout = parseDateTimeIST(checkoutDateTime);

  if (!checkin || !checkout) {
    return badRequest(
      "Invalid date/time. Use DD/MM/YYYY HH:mm (Indian time) or an ISO date-time with timezone.",
    );
  }

  if (checkin >= checkout) {
    return badRequest(
      `Check-out (${formatDateIST(checkout)}) must be later than check-in (${formatDateIST(checkin)}).`,
    );
  }

  const hotel = await Hotel.findOne({ _id: hotelId, status: "Active" });

  if (!hotel) {
    return badRequest("Selected hotel is not active or does not exist");
  }

  const category = await RoomCategory.findOne({
    _id: roomCategoryId,
    hotelId,
    status: "Active",
  });

  if (!category) {
    return badRequest(
      "Selected room category is not active or does not belong to this hotel",
    );
  }

  const quotaRecord = await SponsorAccomodationQuota.findOne({
    eventId,
    sponsorId,
  });

  if (!quotaRecord || !quotaRecord.quotas?.length) {
    return badRequest(
      "No accommodation quota has been assigned to your sponsor account",
    );
  }

  // Restrict all possible nights to this sponsor's quota items for the chosen
  // hotel and category. AddRoom stores the standard check-in/check-out instants.
  const eligibleQuotaItems = quotaRecord.quotas.filter(
    (item) =>
      item.quotaId &&
      item.roomCategoryId?.toString() === roomCategoryId.toString(),
  );

  const quotaRoomIds = eligibleQuotaItems.map((item) => item.quotaId);

  const rooms = await AddRoom.find({
    _id: { $in: quotaRoomIds },
    eventId,
    hotelId,
    roomCategoryId,
  }).sort({ checkinDateTime: 1 });

  const roomByDate = new Map();

  for (const room of rooms) {
    const key = getDateKey(room.checkinDateTime);
    if (key && !roomByDate.has(key)) {
      roomByDate.set(key, room);
    }
  }

  const checkinKey = getDateKey(checkin);
  const checkoutKey = getDateKey(checkout);

  if (!checkinKey || !checkoutKey) {
    return badRequest("Could not interpret the selected Indian dates");
  }

  // Each AddRoom record represents one night: its check-in date is the quota date.
  const normalNightKeys = getDatesBetweenKeys(
    checkinKey,
    addDaysToDateKey(checkoutKey, -1),
  );

  if (!normalNightKeys.length) {
    return badRequest("The accommodation must include at least one night");
  }

  for (const key of normalNightKeys) {
    if (!roomByDate.has(key)) {
      return badRequest(
        `No assigned room quota for ${key.split("-").reverse().join("/")}. Hotel: ${hotel.hotelName}; room category: ${category.roomCategoryName}.`,
      );
    }
  }

  const firstNightRoom = roomByDate.get(normalNightKeys[0]);
  const lastNightRoom = roomByDate.get(
    normalNightKeys[normalNightKeys.length - 1],
  );

  const requiredDateKeys = [...normalNightKeys];

  // Early check-in: if arrival is earlier than the standard time stored in
  // AddRoom for the first night, the previous night's quota is also required.
  if (checkin < firstNightRoom.checkinDateTime) {
    const previousKey = addDaysToDateKey(checkinKey, -1);

    if (!roomByDate.has(previousKey)) {
      return badRequest(
        `Early check-in requested for ${formatDateIST(checkin)} is before the standard check-in time ${formatDateIST(firstNightRoom.checkinDateTime)}. An additional room quota is required for ${previousKey.split("-").reverse().join("/")}, but your sponsor has no assigned quota for that date in this hotel and room category.`,
      );
    }

    requiredDateKeys.unshift(previousKey);
  }

  // Late checkout: compare against the checkout instant stored on the last
  // normal night in AddRoom. If late, the checkout calendar date needs quota too.
  if (checkout > lastNightRoom.checkoutDateTime) {
    const extraCheckoutKey = checkoutKey;

    if (!roomByDate.has(extraCheckoutKey)) {
      return badRequest(
        `Late check-out requested for ${formatDateIST(checkout)} is after the standard check-out time ${formatDateIST(lastNightRoom.checkoutDateTime)}. An additional room quota is required for ${extraCheckoutKey.split("-").reverse().join("/")}, but your sponsor has no assigned quota for that date in this hotel and room category.`,
      );
    }

    requiredDateKeys.push(extraCheckoutKey);
  }

  // Check duplicate delegate bookings, ignoring the current record during update.
  const delegateIds = [
    eventRegistrationId.toString(),
    ...(roomType === "Twin Sharing"
      ? [otherEventRegistrationId.toString()]
      : []),
  ];

  const duplicateConditions = delegateIds.flatMap((delegateId) => [
    { eventRegistrationId: delegateId },
    { otherEventRegistrationId: delegateId },
  ]);

  const duplicate = await Accomodation.findOne({
    eventId,
    ...(ignoreBookingId ? { _id: { $ne: ignoreBookingId } } : {}),
    $or: duplicateConditions,
  });

  if (duplicate) {
    return badRequest(
      "One of the selected delegates already has an accommodation booking for this event",
    );
  }

  const accomodationDays = [];

  for (const dateKey of [...new Set(requiredDateKeys)]) {
    const room = roomByDate.get(dateKey);

    if (!room) {
      return badRequest(
        `No assigned room quota for ${dateKey.split("-").reverse().join("/")}, hotel ${hotel.hotelName}, category ${category.roomCategoryName}.`,
      );
    }

    const quotaItem = eligibleQuotaItems.find(
      (item) => item.quotaId.toString() === room._id.toString(),
    );

    if (
      !quotaItem ||
      quotaItem.roomCategoryId?.toString() !== roomCategoryId.toString()
    ) {
      return badRequest(
        `No sponsor quota is assigned for ${dateKey.split("-").reverse().join("/")}, category ${category.roomCategoryName}.`,
      );
    }

    const used = await Accomodation.countDocuments({
      eventId,
      sponsorId,
      ...(ignoreBookingId ? { _id: { $ne: ignoreBookingId } } : {}),
      accomodationDays: {
        $elemMatch: {
          date: dateKey,
          quotaId: room._id,
          roomCategoryId,
        },
      },
    });

    if (used >= quotaItem.numberOfQuota) {
      return badRequest(
        `Your ${category.roomCategoryName} quota is full for ${dateKey.split("-").reverse().join("/")}. Assigned quota: ${quotaItem.numberOfQuota}; already booked: ${used}.`,
      );
    }

    accomodationDays.push({
      date: dateKey,
      quotaId: room._id,
      hotelId: room.hotelId,
      roomCategoryId: room.roomCategoryId,
    });
  }

  return {
    data: {
      eventId,
      sponsorId,
      eventRegistrationId,
      hotelId,
      roomCategoryId,
      roomType,
      guestName:
        roomType === "Double Occupancy" ? String(guestName).trim() : null,
      otherEventRegistrationId:
        roomType === "Twin Sharing" ? otherEventRegistrationId : null,
      checkinDateTime: checkin,
      checkoutDateTime: checkout,
      accomodationDays,
      remark,
    },
  };
};

// =======================
// CREATE ACCOMODATION
// =======================
export const createAccomodation = async (req, res) => {
  try {
    const { eventId } = req.params;
    const sponsorId = req.sponsor._id;

    const result = await prepareAccommodationBooking({
      eventId,
      sponsorId,
      payload: req.body,
    });

    if (result.statusCode) {
      return res.status(result.statusCode).json(result.body);
    }

    const booking = await Accomodation.create(result.data);

    return res.status(201).json({
      success: true,
      message: "Accommodation booked successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Create Accommodation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating accommodation",
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

    // GET ASSIGNED REGISTRATION IDS
    const assignedData = await AssignAccomodationService.findOne({
      eventId,
      sponsorId,
    });

    const assignedRegistrationIds = assignedData
      ? assignedData.eventRegistrationId.map((id) => id.toString())
      : [];

    // ADD STATUS FIELD
    const data = bookings.map((item) => ({
      ...item.toObject(),
      usedQuota: item.accomodationDays.length,
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

    const data = bookings.map((item) => ({
      ...item.toObject(),
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
    const { id, eventId } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid accommodation booking ID",
      });
    }

    const booking = await Accomodation.findOne({
      _id: id,
      sponsorId,
      eventId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Accommodation booking not found for this event",
      });
    }

    // Partial updates are supported: omitted fields retain their current values.
    const payload = {
      eventRegistrationId:
        req.body.eventRegistrationId ?? booking.eventRegistrationId,
      checkinDateTime: req.body.checkinDateTime ?? booking.checkinDateTime,
      checkoutDateTime: req.body.checkoutDateTime ?? booking.checkoutDateTime,
      hotelId: req.body.hotelId ?? booking.hotelId,
      roomCategoryId: req.body.roomCategoryId ?? booking.roomCategoryId,
      roomType: req.body.roomType ?? booking.roomType,
      guestName: req.body.guestName ?? booking.guestName,
      otherEventRegistrationId:
        req.body.otherEventRegistrationId ?? booking.otherEventRegistrationId,
      remark: req.body.remark ?? booking.remark,
    };

    const result = await prepareAccommodationBooking({
      eventId,
      sponsorId,
      payload,
      ignoreBookingId: booking._id,
    });

    if (result.statusCode) {
      return res.status(result.statusCode).json(result.body);
    }

    Object.assign(booking, result.data);
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Accommodation updated successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Update Accommodation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating accommodation",
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

    // GET SPONSOR QUOTA
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

    const dateWise = [];
    const roomCategorySummaryMap = {};
    const hotelSummaryMap = {};

    // LOOP THROUGH SPONSOR QUOTAS
    for (const q of quotaRecord.quotas) {
      const room = q.quotaId;

      if (!room) continue;

      const hotel = room.hotelId;
      if (!hotel) continue;

      const hotelName = hotel.hotelName;

      const roomCategoryId =
        q.roomCategoryId?.toString() || room.roomCategoryId?._id?.toString();

      const roomCategoryName =
        q.roomCategoryId?.roomCategoryName ||
        room.roomCategoryId?.roomCategoryName ||
        "Unknown";

      const date = getDateKey(room.checkinDateTime);

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

      const remaining = Math.max(q.numberOfQuota - used, 0);

      // DATE WISE
      dateWise.push({
        hotelName,
        roomCategoryId: roomCategoryId || null,
        roomCategoryName,
        date,
        totalQuota: q.numberOfQuota,
        used,
        remaining,
      });

      // ROOM CATEGORY WISE
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

      // HOTEL WISE
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

    const roomCategoryWise = Object.values(roomCategorySummaryMap);
    const hotelWise = Object.values(hotelSummaryMap);

    dateWise.sort((a, b) => new Date(a.date) - new Date(b.date));

    roomCategoryWise.sort((a, b) => {
      if (a.hotelName !== b.hotelName) {
        return a.hotelName.localeCompare(b.hotelName);
      }

      return a.roomCategoryName.localeCompare(b.roomCategoryName);
    });

    hotelWise.sort((a, b) => a.hotelName.localeCompare(b.hotelName));

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

    // GET ALL ROOMS ADDED FOR EVENT
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

    // GET ALL SPONSOR QUOTAS FOR EVENT
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

    const hotelWiseMap = {};
    const roomCategoryWiseMap = {};
    const sponsorWiseMap = {};
    const dateWiseMap = {};
    const quotaWise = [];

    let totalRoomsAdded = 0;
    let totalQuotaAllocated = 0;
    let totalBookedRooms = 0;

    // PROCESS ALL ADD ROOM RECORDS
    for (const room of addRooms) {
      if (!room.hotelId || !room.roomCategoryId) continue;

      const hotelId = room.hotelId._id.toString();
      const roomCategoryId = room.roomCategoryId._id.toString();
      const hotelName = room.hotelId.hotelName;
      const roomCategoryName = room.roomCategoryId.roomCategoryName;

      const totalRooms = Number(room.numberOfRooms || 0);
      const availableRooms = Number(room.availableRooms || 0);

      const allocatedRooms = Math.max(totalRooms - availableRooms, 0);

      totalRoomsAdded += totalRooms;

      // HOTEL WISE
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

      // ROOM CATEGORY WISE
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

    // PROCESS SPONSOR QUOTAS
    for (const quotaRecord of quotaRecords) {
      const sponsor = quotaRecord.sponsorId;
      if (!sponsor) continue;

      const sponsorId = sponsor._id.toString();
      const sponsorName =
        sponsor.sponsorName || sponsor.contactPersonName || "Unknown Sponsor";

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

      // PROCESS EACH QUOTA
      for (const q of quotaRecord.quotas) {
        const room = q.quotaId;

        if (!room || !room.hotelId || !room.roomCategoryId) continue;

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
        const date = getDateKey(room.checkinDateTime);

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

        totalQuotaAllocated += quota;
        totalBookedRooms += used;

        // SPONSOR WISE
        sponsorWiseMap[sponsorId].totalQuota += quota;
        sponsorWiseMap[sponsorId].usedQuota += used;
        sponsorWiseMap[sponsorId].remainingQuota += remaining;

        // SPONSOR HOTEL DETAIL
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

        // HOTEL WISE
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

        // ROOM CATEGORY WISE
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

        // DATE WISE
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

        // QUOTA WISE DETAIL
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
    // CALCULATE OVERVIEW
    // =====================================================

    const totalAvailableRooms = addRooms.reduce(
      (sum, room) => sum + Number(room.availableRooms || 0),
      0,
    );

    const totalHotels = Object.keys(hotelWiseMap).length;
    const totalRoomCategories = Object.keys(roomCategoryWiseMap).length;
    const totalSponsors = Object.keys(sponsorWiseMap).length;

    const totalRoomsAllocatedToSponsors = addRooms.reduce((sum, room) => {
      const total = Number(room.numberOfRooms || 0);
      const available = Number(room.availableRooms || 0);

      return sum + Math.max(total - available, 0);
    }, 0);

    // =====================================================
    // CONVERT MAPS TO ARRAYS
    // =====================================================

    const hotelWise = Object.values(hotelWiseMap);
    const roomCategoryWise = Object.values(roomCategoryWiseMap);
    const sponsorWise = Object.values(sponsorWiseMap);
    const dateWise = Object.values(dateWiseMap);

    // =====================================================
    // SORT DATA
    // =====================================================

    hotelWise.sort((a, b) => a.hotelName.localeCompare(b.hotelName));

    roomCategoryWise.sort((a, b) => {
      if (a.hotelName !== b.hotelName) {
        return a.hotelName.localeCompare(b.hotelName);
      }

      return a.roomCategoryName.localeCompare(b.roomCategoryName);
    });

    sponsorWise.sort((a, b) => a.sponsorName.localeCompare(b.sponsorName));

    dateWise.sort((a, b) => new Date(a.date) - new Date(b.date));

    quotaWise.sort((a, b) => {
      if (a.hotelName !== b.hotelName) {
        return a.hotelName.localeCompare(b.hotelName);
      }

      return a.sponsorName.localeCompare(b.sponsorName);
    });

    // =====================================================
    // FINAL RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,
      message: "Event Admin accommodation summary fetched successfully",

      data: {
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
            0,
          ),
        },

        hotelWise,
        roomCategoryWise,
        sponsorWise,
        dateWise,
        quotaWise,
      },
    });
  } catch (error) {
    console.error("Event Admin Accommodation Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
