import AddRoom from "../models/AddRoom.js";
import Event from "../models/Event.js";
import Hotel from "../models/Hotel.js";
import RoomCategory from "../models/RoomCategory.js";

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
    // ===============================
    // Required check
    // ===============================
    if (!checkinDateTime || !checkoutDateTime) {
      return res.status(400).json({
        message: "Check-in and check-out date time are required",
      });
    }

    // ===============================
    // Validate datetime format
    // ===============================
    if (isNaN(new Date(checkinDateTime)) || isNaN(new Date(checkoutDateTime))) {
      return res.status(400).json({
        message: "Invalid date time format",
      });
    }

    // ===============================
    // Convert datetime
    // ===============================
    const parsedCheckinDateTime = new Date(checkinDateTime);
    const parsedCheckoutDateTime = new Date(checkoutDateTime);

    // ===============================
    // Validate checkout > checkin
    // ===============================
    if (parsedCheckoutDateTime <= parsedCheckinDateTime) {
      return res.status(400).json({
        message: "Checkout date time must be greater than checkin date time",
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

    // ===============================
    // Validate datetime format
    // ===============================
    if (
      (checkinDateTime && isNaN(new Date(checkinDateTime))) ||
      (checkoutDateTime && isNaN(new Date(checkoutDateTime)))
    ) {
      return res.status(400).json({
        message: "Invalid date time format",
      });
    }

    // ===============================
    // Prepare final values
    // ===============================
    const finalCheckinDateTime = checkinDateTime
      ? new Date(checkinDateTime)
      : existingRoom.checkinDateTime;

    const finalCheckoutDateTime = checkoutDateTime
      ? new Date(checkoutDateTime)
      : existingRoom.checkoutDateTime;

    // ===============================
    // Validate checkout > checkin
    // ===============================
    if (finalCheckoutDateTime <= finalCheckinDateTime) {
      return res.status(400).json({
        message: "Checkout date time must be greater than checkin date time",
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
