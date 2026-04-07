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
    const { hotelId, roomCategoryId, numberOfRooms } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const category = await RoomCategory.findById(roomCategoryId);
    if (!category) {
      return res.status(404).json({ message: "Room category not found" });
    }

    if (category.hotel.toString() !== hotelId) {
      return res.status(400).json({
        message: "Room category does not belong to selected hotel",
      });
    }

    //  DUPLICATE CHECK
    const existingRoom = await AddRoom.findOne({
      eventId,
      hotelId,
      roomCategoryId,
    });

    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message:
          "This combination (event + hotel + room category) already exists",
      });
    }

    const newAddRoom = await AddRoom.create({
      eventId,
      hotelId,
      roomCategoryId,
      numberOfRooms,
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
    const { hotelId, roomCategoryId, numberOfRooms } = req.body;

    const existingRoom = await AddRoom.findById(id);
    if (!existingRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    // ===============================
    // Step 1: Prepare final values
    // ===============================
    const finalHotelId = hotelId || existingRoom.hotelId;
    const finalRoomCategoryId =
      roomCategoryId || existingRoom.roomCategoryId;
    const finalEventId = existingRoom.eventId;

    // ===============================
    // Step 2: Validate hotel
    // ===============================
    const hotel = await Hotel.findById(finalHotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // ===============================
    // Step 3: Validate room category
    // ===============================
    const category = await RoomCategory.findById(finalRoomCategoryId);
    if (!category) {
      return res.status(404).json({ message: "Room category not found" });
    }

    // Ensure category belongs to hotel
    if (category.hotel.toString() !== finalHotelId.toString()) {
      return res.status(400).json({
        message: "Room category does not belong to selected hotel",
      });
    }

    // ===============================
    //  Step 4: DUPLICATE CHECK
    // ===============================
    const duplicate = await AddRoom.findOne({
      eventId: finalEventId,
      hotelId: finalHotelId,
      roomCategoryId: finalRoomCategoryId,
      _id: { $ne: id }, // VERY IMPORTANT (exclude current)
    });

    if (duplicate) {
      return res.status(400).json({
        message:
          "This combination (event + hotel + room category) already exists",
      });
    }

    // ===============================
    // Step 5: Update fields
    // ===============================
    existingRoom.hotelId = finalHotelId;
    existingRoom.roomCategoryId = finalRoomCategoryId;

    if (numberOfRooms !== undefined) {
      existingRoom.numberOfRooms = numberOfRooms;
    }

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