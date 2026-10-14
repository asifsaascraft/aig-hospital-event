import AddRoom from "../models/AddRoom.js";
import Event from "../models/Event.js";
import Hotel from "../models/Hotel.js";
import RoomCategory from "../models/RoomCategory.js";

// Parse date-only values as midnight in Indian Standard Time
const parseIndianDate = (value) => {
  if (typeof value !== "string") return null;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return null;

  const [, year, month, day] = match;

  const date = new Date(`${year}-${month}-${day}T00:00:00+05:30`);

  // Reject invalid calendar dates
  if (
    date.getUTCFullYear() !== Number(year) &&
    date.getUTCFullYear() !== Number(year) - 1
  ) {
    return null;
  }

  const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);

  if (
    istDate.getUTCFullYear() !== Number(year) ||
    istDate.getUTCMonth() + 1 !== Number(month) ||
    istDate.getUTCDate() !== Number(day)
  ) {
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
        message: "Check-in and check-out dates are required",
      });
    }

    const parsedCheckinDateTime = parseIndianDate(checkinDateTime);
    const parsedCheckoutDateTime = parseIndianDate(checkoutDateTime);

    if (!parsedCheckinDateTime || !parsedCheckoutDateTime) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    if (parsedCheckoutDateTime <= parsedCheckinDateTime) {
      return res.status(400).json({
        success: false,
        message: "Checkout date must be greater than check-in date",
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
      ? parseIndianDate(checkinDateTime)
      : existingRoom.checkinDateTime;

    const parsedCheckoutDateTime = checkoutDateTime
      ? parseIndianDate(checkoutDateTime)
      : existingRoom.checkoutDateTime;

    if (!parsedCheckinDateTime || !parsedCheckoutDateTime) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    const finalCheckinDateTime = parsedCheckinDateTime;
    const finalCheckoutDateTime = parsedCheckoutDateTime;

    if (finalCheckoutDateTime <= finalCheckinDateTime) {
      return res.status(400).json({
        success: false,
        message: "Checkout date must be greater than check-in date",
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
