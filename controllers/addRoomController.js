import mongoose from "mongoose";
import AddRoom from "../models/AddRoom.js";
import Event from "../models/Event.js";
import Hotel from "../models/Hotel.js";
import RoomCategory from "../models/RoomCategory.js";
import SponsorAccomodationQuota from "../models/SponsorAccomodationQuota.js";


const parseFullDateTime = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

const isExactlyOneDayStay = (checkin, checkout) => {
  if (!checkin || !checkout) return false;

  const nextDay = new Date(checkin);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  return (
    checkout.getUTCFullYear() === nextDay.getUTCFullYear() &&
    checkout.getUTCMonth() === nextDay.getUTCMonth() &&
    checkout.getUTCDate() === nextDay.getUTCDate()
  );
};

// =======================
// Create AddRoom (EventAdmin only)
// =======================
export const createAddRoom = async (req, res) => {
  try {
    const { eventId } = req.params;

    const {
      hotelId,
      roomCategoryId,
      numberOfRooms,
      checkinDateTime,
      checkoutDateTime,
      remark,
    } = req.body;

    // ===============================
    // Validate numberOfRooms
    // ===============================
    if (numberOfRooms === undefined || numberOfRooms < 1) {
      return res.status(400).json({
        message: "Number of rooms must be at least 1",
      });
    }

    if (!hotelId || !roomCategoryId) {
      return res.status(400).json({
        success: false,
        message: "Hotel and Room Category are required",
      });
    }

    if (!checkinDateTime || !checkoutDateTime) {
      return res.status(400).json({
        success: false,
        message: "Check-in and check-out date-time are required",
      });
    }

    const parsedCheckinDateTime = parseFullDateTime(checkinDateTime);
    const parsedCheckoutDateTime = parseFullDateTime(checkoutDateTime);

    if (!parsedCheckinDateTime || !parsedCheckoutDateTime) {
      return res.status(400).json({
        success: false,
        message: "Invalid check-in or check-out date-time format",
      });
    }

    if (parsedCheckoutDateTime <= parsedCheckinDateTime) {
      return res.status(400).json({
        success: false,
        message: "Checkout date-time must be greater than check-in date-time",
      });
    }

    if (!isExactlyOneDayStay(parsedCheckinDateTime, parsedCheckoutDateTime)) {
      return res.status(400).json({
        success: false,
        message: "Checkout date must be exactly one day after check-in date",
      });
    }

    // ===============================
    // Validate Event
    // ===============================
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // ===============================
    // Validate Hotel
    // ===============================
    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({
        message: "Hotel not found",
      });
    }

    // ===============================
    // Validate Room Category
    // ===============================
    const roomCategory = await RoomCategory.findById(roomCategoryId);

    if (!roomCategory) {
      return res.status(404).json({
        success: false,
        message: "Room category not found",
      });
    }

    // Room Category should belong to selected Hotel
    if (roomCategory.hotelId.toString() !== hotelId) {
      return res.status(400).json({
        success: false,
        message: "Selected room category does not belong to selected hotel",
      });
    }
    // ===============================
    // Prevent duplicate
    // ===============================
    const existingRoom = await AddRoom.findOne({
      eventId,
      hotelId,
      roomCategoryId,
      checkinDateTime: parsedCheckinDateTime,
    });

    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message:
          "Room already exists for this hotel on selected check-in date time",
      });
    }

    // ===============================
    // Create
    // ===============================
    const newAddRoom = await AddRoom.create({
      eventId,
      hotelId,
      roomCategoryId,
      numberOfRooms,
      availableRooms: numberOfRooms,
      checkinDateTime: parsedCheckinDateTime,
      checkoutDateTime: parsedCheckoutDateTime,
      remark,
    });

    res.status(201).json({
      success: true,
      message: "Room added successfully",
      data: newAddRoom,
    });
  } catch (error) {
    console.error("Create AddRoom error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Get all rooms by event
// =======================
export const getAddRoomsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const rooms = await AddRoom.find({ eventId })
      .populate("hotelId", "hotelName checkinTime checkoutTime")
      .populate("roomCategoryId", "roomCategoryName")
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: "Rooms fetched successfully",
      data: rooms,
    });
  } catch (error) {
    console.error("Get AddRooms error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};


// =======================
// Get all rooms report by event
// =======================
export const getAccommodationRoomReport = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Validate event ID
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }

    // Check event
    const event = await Event.findById(eventId).select(
      "eventName shortName"
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Fetch all rooms for this event
    const rooms = await AddRoom.find({ eventId })
      .populate("hotelId", "hotelName")
      .populate("roomCategoryId", "roomCategoryName")
      .sort({ createdAt: -1 })
      .lean();

    // Fetch sponsor allocations for this event
    const sponsorQuotas = await SponsorAccomodationQuota.find({ eventId })
      .populate("sponsorId", "sponsorName contactPersonName email mobile")
      .lean();

    // Map sponsor allocations by AddRoom ID
    const allocationMap = new Map();

    for (const sponsorQuota of sponsorQuotas) {
      const sponsor = sponsorQuota.sponsorId;

      if (!sponsor) continue;

      for (const quota of sponsorQuota.quotas || []) {
        const quotaId = quota.quotaId?.toString();

        if (!quotaId) continue;

        if (!allocationMap.has(quotaId)) {
          allocationMap.set(quotaId, []);
        }

        allocationMap.get(quotaId).push({
          sponsorId: sponsor._id,
          sponsorName: sponsor.sponsorName,
          contactPersonName: sponsor.contactPersonName,
          email: sponsor.email,
          mobile: sponsor.mobile,
          numberOfRooms: quota.numberOfQuota,
          roomCategoryId: quota.roomCategoryId,
        });
      }
    }

    // Group rooms by hotel and room category
    const hotelMap = new Map();

    for (const room of rooms) {
      if (!room.hotelId || !room.roomCategoryId) continue;

      const hotelId = room.hotelId._id.toString();
      const categoryId = room.roomCategoryId._id.toString();

      if (!hotelMap.has(hotelId)) {
        hotelMap.set(hotelId, {
          hotelId: room.hotelId._id,
          hotelName: room.hotelId.hotelName,
          totalRooms: 0,
          allocatedRooms: 0,
          availableRooms: 0,
          roomCategories: new Map(),
        });
      }

      const hotel = hotelMap.get(hotelId);

      if (!hotel.roomCategories.has(categoryId)) {
        hotel.roomCategories.set(categoryId, {
          roomCategoryId: room.roomCategoryId._id,
          roomCategoryName: room.roomCategoryId.roomCategoryName,
          totalRooms: 0,
          allocatedRooms: 0,
          availableRooms: 0,
          stays: [],
        });
      }

      const category = hotel.roomCategories.get(categoryId);

      const totalRooms = room.numberOfRooms || 0;
      const availableRooms = room.availableRooms || 0;
      const allocatedRooms = totalRooms - availableRooms;

      const sponsors = allocationMap.get(room._id.toString()) || [];

      category.totalRooms += totalRooms;
      category.allocatedRooms += allocatedRooms;
      category.availableRooms += availableRooms;

      hotel.totalRooms += totalRooms;
      hotel.allocatedRooms += allocatedRooms;
      hotel.availableRooms += availableRooms;

      category.stays.push({
        quotaId: room._id,
        checkinDateTime: room.checkinDateTime,
        checkoutDateTime: room.checkoutDateTime,
        remark: room.remark,
        totalRooms,
        allocatedRooms,
        availableRooms,
        sponsors,
      });
    }

    // Convert Maps into arrays
    const report = Array.from(hotelMap.values()).map((hotel) => ({
      ...hotel,
      roomCategories: Array.from(hotel.roomCategories.values()),
    }));

    // Overall summary
    const summary = report.reduce(
      (result, hotel) => {
        result.totalHotels += 1;
        result.totalRooms += hotel.totalRooms;
        result.allocatedRooms += hotel.allocatedRooms;
        result.availableRooms += hotel.availableRooms;
        return result;
      },
      {
        totalHotels: 0,
        totalRooms: 0,
        allocatedRooms: 0,
        availableRooms: 0,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Accommodation room report fetched successfully",
      event: {
        _id: event._id,
        eventName: event.eventName,
        shortName: event.shortName,
      },
      summary,
      data: report,
    });
  } catch (error) {
    console.error("Get Accommodation Room Report Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// =======================
// Get single room by ID
// =======================
export const getAddRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await AddRoom.findById(id)
      .populate("hotelId", "hotelName checkinTime checkoutTime")
      .populate("roomCategoryId", "roomCategoryName");

    if (!room) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error("Get AddRoom By ID error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Update AddRoom (EventAdmin only)
// =======================
export const updateAddRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      hotelId,
      roomCategoryId,
      numberOfRooms,
      checkinDateTime,
      checkoutDateTime,
      remark,
    } = req.body;

    // ===============================
    // Validate numberOfRooms
    // ===============================
    if (numberOfRooms !== undefined && numberOfRooms < 1) {
      return res.status(400).json({
        message: "Number of rooms must be at least 1",
      });
    }

    // ===============================
    // Find existing room
    // ===============================
    const existingRoom = await AddRoom.findById(id);

    if (!existingRoom) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    const parsedCheckinDateTime = checkinDateTime
      ? parseFullDateTime(checkinDateTime)
      : existingRoom.checkinDateTime;

    const parsedCheckoutDateTime = checkoutDateTime
      ? parseFullDateTime(checkoutDateTime)
      : existingRoom.checkoutDateTime;

    if (!parsedCheckinDateTime || !parsedCheckoutDateTime) {
      return res.status(400).json({
        success: false,
        message: "Invalid check-in or check-out date-time format",
      });
    }

    const finalCheckinDateTime = parsedCheckinDateTime;
    const finalCheckoutDateTime = parsedCheckoutDateTime;

    if (finalCheckoutDateTime <= finalCheckinDateTime) {
      return res.status(400).json({
        success: false,
        message: "Checkout date-time must be greater than check-in date-time",
      });
    }

    if (!isExactlyOneDayStay(finalCheckinDateTime, finalCheckoutDateTime)) {
      return res.status(400).json({
        success: false,
        message: "Checkout date must be exactly one day after check-in date",
      });
    }

    const finalHotelId = hotelId || existingRoom.hotelId;

    const finalRoomCategoryId = roomCategoryId || existingRoom.roomCategoryId;

    // ===============================
    // Validate Hotel
    // ===============================
    const hotel = await Hotel.findById(finalHotelId);

    if (!hotel) {
      return res.status(404).json({
        message: "Hotel not found",
      });
    }

    const roomCategory = await RoomCategory.findById(finalRoomCategoryId);

    if (!roomCategory) {
      return res.status(404).json({
        success: false,
        message: "Room category not found",
      });
    }

    if (roomCategory.hotelId.toString() !== finalHotelId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Selected room category does not belong to selected hotel",
      });
    }

    // ===============================
    // Prevent duplicate
    // ===============================
    const duplicate = await AddRoom.findOne({
      _id: { $ne: id },
      eventId: existingRoom.eventId,
      hotelId: finalHotelId,
      roomCategoryId: finalRoomCategoryId,
      checkinDateTime: finalCheckinDateTime,
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message:
          "Room already exists for this hotel on selected check-in date time",
      });
    }

    // ===============================
    // Update fields
    // ===============================
    existingRoom.hotelId = finalHotelId;
    existingRoom.roomCategoryId = finalRoomCategoryId;

    if (numberOfRooms !== undefined) {
      const allocated =
        existingRoom.numberOfRooms - existingRoom.availableRooms;

      // Prevent reducing below allocated
      if (numberOfRooms < allocated) {
        return res.status(400).json({
          message: `Cannot reduce rooms below allocated (${allocated})`,
        });
      }

      const diff = numberOfRooms - existingRoom.numberOfRooms;

      existingRoom.numberOfRooms = numberOfRooms;

      existingRoom.availableRooms = (existingRoom.availableRooms || 0) + diff;
    }

    existingRoom.checkinDateTime = finalCheckinDateTime;

    existingRoom.checkoutDateTime = finalCheckoutDateTime;

    if (remark !== undefined) {
      existingRoom.remark = remark;
    }

    // ===============================
    // Save
    // ===============================
    await existingRoom.save();

    res.status(200).json({
      success: true,
      message: "Room updated successfully",
      data: existingRoom,
    });
  } catch (error) {
    console.error("Update AddRoom error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Delete AddRoom (EventAdmin only)
// =======================
export const deleteAddRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await AddRoom.findById(id);

    if (!room) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    await room.deleteOne();

    res.status(200).json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    console.error("Delete AddRoom error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};
