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
      startDateTime,
      endDateTime,
    } = req.body;

    // ===============================
    // Required check
    // ===============================
    if (!startDateTime || !endDateTime) {
      return res.status(400).json({
        message: "Start and End date time are required",
      });
    }

    // ===============================
    // Validate format
    // ===============================
    if (isNaN(new Date(startDateTime))) {
      return res.status(400).json({
        message: "Invalid startDateTime format",
      });
    }

    if (isNaN(new Date(endDateTime))) {
      return res.status(400).json({
        message: "Invalid endDateTime format",
      });
    }

    // ===============================
    // Convert
    // ===============================
    const parsedStart = new Date(startDateTime);
    const parsedEnd = new Date(endDateTime);

    // ===============================
    // Compare
    // ===============================
    if (parsedEnd < parsedStart) {
      return res.status(400).json({
        message: "End date must be greater than or equal to start date",
      });
    }

    // ===============================
    // Validate Event
    // ===============================
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // ===============================
    // Validate Hotel
    // ===============================
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // ===============================
    // Validate Room Category
    // ===============================
    const category = await RoomCategory.findById(roomCategoryId);
    if (!category) {
      return res.status(404).json({ message: "Room category not found" });
    }

    if (category.hotel.toString() !== hotelId.toString()) {
      return res.status(400).json({
        message: "Room category does not belong to selected hotel",
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
      startDateTime: parsedStart,
      endDateTime: parsedEnd,
    });

    res.status(201).json({
      success: true,
      message: "Room added successfully",
      data: newAddRoom,
    });

  } catch (error) {
    console.error("Create AddRoom error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


// =======================
// Get all rooms by event
// =======================
export const getAddRoomsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const rooms = await AddRoom.find({ eventId })
      .populate("hotelId", "hotelName")
      .populate("roomCategoryId", "roomCategory roomType")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Rooms fetched successfully",
      data: rooms,
    });

  } catch (error) {
    console.error("Get AddRooms error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


// =======================
// Get single room by ID
// =======================
export const getAddRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await AddRoom.findById(id)
      .populate("hotelId", "hotelName")
      .populate("roomCategoryId", "roomCategory roomType");

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json({
      success: true,
      data: room,
    });

  } catch (error) {
    console.error("Get AddRoom By ID error:", error);
    res.status(500).json({ message: "Server Error" });
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
      startDateTime,
      endDateTime,
    } = req.body;

    const existingRoom = await AddRoom.findById(id);
    if (!existingRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    // ===============================
    // Validate format
    // ===============================
    if (startDateTime && isNaN(new Date(startDateTime))) {
      return res.status(400).json({
        message: "Invalid startDateTime format",
      });
    }

    if (endDateTime && isNaN(new Date(endDateTime))) {
      return res.status(400).json({
        message: "Invalid endDateTime format",
      });
    }

    // ===============================
    // Final values + conversion
    // ===============================
    const finalStart = startDateTime
      ? new Date(startDateTime)
      : existingRoom.startDateTime;

    const finalEnd = endDateTime
      ? new Date(endDateTime)
      : existingRoom.endDateTime;

    // ===============================
    // Compare
    // ===============================
    if (finalEnd < finalStart) {
      return res.status(400).json({
        message: "End date must be greater than or equal to start date",
      });
    }

    // ===============================
    // Validate Hotel
    // ===============================
    const finalHotelId = hotelId || existingRoom.hotelId;
    const hotel = await Hotel.findById(finalHotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // ===============================
    // Validate Room Category
    // ===============================
    const finalRoomCategoryId =
      roomCategoryId || existingRoom.roomCategoryId;

    const category = await RoomCategory.findById(finalRoomCategoryId);
    if (!category) {
      return res.status(404).json({ message: "Room category not found" });
    }

    if (category.hotel.toString() !== finalHotelId.toString()) {
      return res.status(400).json({
        message: "Room category does not belong to selected hotel",
      });
    }

    // ===============================
    // Update fields
    // ===============================
    existingRoom.hotelId = finalHotelId;
    existingRoom.roomCategoryId = finalRoomCategoryId;

    if (numberOfRooms !== undefined) {
      existingRoom.numberOfRooms = numberOfRooms;
    }

    existingRoom.startDateTime = finalStart;
    existingRoom.endDateTime = finalEnd;

    await existingRoom.save();

    res.status(200).json({
      success: true,
      message: "Room updated successfully",
      data: existingRoom,
    });

  } catch (error) {
    console.error("Update AddRoom error:", error);
    res.status(500).json({ message: "Server Error" });
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
      return res.status(404).json({ message: "Room not found" });
    }

    await room.deleteOne();

    res.status(200).json({
      success: true,
      message: "Room deleted successfully",
    });

  } catch (error) {
    console.error("Delete AddRoom error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};