import ExhibitorType from "../models/ExhibitorType.js";
import Event from "../models/Event.js";

// =======================
// Create Exhibitor Type (EventAdmin Only)
// =======================
export const createExhibitorType = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { exhibitorType, status } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // Create Exhibitor Type
    const exhibitor = await ExhibitorType.create({
      eventId,
      exhibitorType,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Exhibitor Type created successfully",
      data: exhibitor,
    });
  } catch (error) {
    console.error("Create Exhibitor Type Error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Get All Exhibitor Types
// =======================
export const getExhibitorTypesByEvent = async (
  req,
  res
) => {
  try {
    const { eventId } = req.params;

    const exhibitorTypes = await ExhibitorType.find({
      eventId,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Exhibitor Types fetched successfully",
      data: exhibitorTypes,
    });
  } catch (error) {
    console.error("Get Exhibitor Types Error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Get Active Exhibitor Types
// =======================
export const getActiveExhibitorTypesByEvent =
  async (req, res) => {
    try {
      const { eventId } = req.params;

      const exhibitorTypes = await ExhibitorType.find({
        eventId,
        status: "Active",
      }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        message:
          "Active Exhibitor Types fetched successfully",
        data: exhibitorTypes,
      });
    } catch (error) {
      console.error(
        "Get Active Exhibitor Types Error:",
        error
      );

      res.status(500).json({
        message: "Server Error",
      });
    }
  };

// =======================
// Update Exhibitor Type
// =======================
export const updateExhibitorType = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { exhibitorType, status } = req.body;

    const exhibitor =
      await ExhibitorType.findById(id);

    if (!exhibitor) {
      return res.status(404).json({
        message: "Exhibitor Type not found",
      });
    }

    if (exhibitorType)
      exhibitor.exhibitorType = exhibitorType;

    if (status)
      exhibitor.status = status;

    await exhibitor.save();

    res.status(200).json({
      success: true,
      message: "Exhibitor Type updated successfully",
      data: exhibitor,
    });
  } catch (error) {
    console.error(
      "Update Exhibitor Type Error:",
      error
    );

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Delete Exhibitor Type
// =======================
export const deleteExhibitorType = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const exhibitor =
      await ExhibitorType.findById(id);

    if (!exhibitor) {
      return res.status(404).json({
        message: "Exhibitor Type not found",
      });
    }

    await exhibitor.deleteOne();

    res.status(200).json({
      success: true,
      message:
        "Exhibitor Type deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Exhibitor Type Error:",
      error
    );

    res.status(500).json({
      message: "Server Error",
    });
  }
};