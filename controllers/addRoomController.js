import AddRoom from "../models/AddRoom.js";
import Event from "../models/Event.js";
import Hotel from "../models/Hotel.js";

// =======================
// Create AddRoom (EventAdmin only)
// =======================
export const createAddRoom = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { hotelId, numberOfRooms, checkinDate } = req.body;

    if (numberOfRooms === undefined || numberOfRooms < 1) {
      return res.status(400).json({
        message: "Number of rooms must be at least 1",
      });
    }

    // ===============================
    // Required check
    // ===============================
    if (!checkinDate) {
      return res.status(400).json({
        message: "Checkin date is required",
      });
    }

    // ===============================
    // Validate format
    // ===============================
    if (isNaN(new Date(checkinDate))) {
      return res.status(400).json({
        message: "Invalid checkinDate format",
      });
    }

    // ===============================
    // Convert
    // ===============================
    const parsedCheckinDate = new Date(checkinDate);

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
    // Check duplicate (IMPORTANT)
    // ===============================
    const existingRoom = await AddRoom.findOne({
      eventId,
      hotelId,
      checkinDate: parsedCheckinDate,
    });

    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: "Room already exists for this hotel on selected date",
      });
    }

    // ===============================
    // Create
    // ===============================
    const newAddRoom = await AddRoom.create({
      eventId,
      hotelId,
      numberOfRooms,
      availableRooms: numberOfRooms,
      checkinDate: parsedCheckinDate,
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
      .populate("hotelId", "hotelName checkinTime checkoutTime")
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
      .populate("hotelId", "hotelName checkinTime checkoutTime");

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
    const { hotelId, numberOfRooms, checkinDate } = req.body;

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
      return res.status(404).json({ message: "Room not found" });
    }

    // ===============================
    // Validate checkinDate format
    // ===============================
    if (checkinDate && isNaN(new Date(checkinDate))) {
      return res.status(400).json({
        message: "Invalid checkinDate format",
      });
    }

    // ===============================
    // Prepare final values
    // ===============================
    const finalCheckinDate = checkinDate
      ? new Date(checkinDate)
      : existingRoom.checkinDate;

    const finalHotelId = hotelId || existingRoom.hotelId;

    // ===============================
    // Validate Hotel
    // ===============================
    const hotel = await Hotel.findById(finalHotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // ===============================
    // Prevent duplicate (IMPORTANT)
    // ===============================
    const duplicate = await AddRoom.findOne({
      _id: { $ne: id }, // exclude current record
      eventId: existingRoom.eventId,
      hotelId: finalHotelId,
      checkinDate: finalCheckinDate,
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Room already exists for this hotel on selected date",
      });
    }

    // ===============================
    // Update fields
    // ===============================
    existingRoom.hotelId = finalHotelId;

    if (numberOfRooms !== undefined) {
      const allocated =
        existingRoom.numberOfRooms - existingRoom.availableRooms;

      // Prevent reducing below already allocated
      if (numberOfRooms < allocated) {
        return res.status(400).json({
          message: `Cannot reduce rooms below allocated (${allocated})`,
        });
      }

      const diff = numberOfRooms - existingRoom.numberOfRooms;

      existingRoom.numberOfRooms = numberOfRooms;
      existingRoom.availableRooms =
        (existingRoom.availableRooms || 0) + diff;
    }

    existingRoom.checkinDate = finalCheckinDate;

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

    // ===============================
    // Handle duplicate index error
    // ===============================
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate room entry not allowed",
      });
    }

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