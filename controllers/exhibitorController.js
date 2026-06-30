import Exhibitor from "../models/Exhibitor.js";
import ExhibitorType from "../models/ExhibitorType.js";
import Event from "../models/Event.js";

// =======================
// Create Exhibitor (EventAdmin)
// =======================
export const createExhibitor = async (req, res) => {
  try {
    const { eventId } = req.params;

    const {
      name,
      stall,
      hall,
      description,
      exhibitorTypeId,
      status,
    } = req.body;

    // Validate Event
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // Validate Exhibitor Type
    const exhibitorType =
      await ExhibitorType.findById(
        exhibitorTypeId
      );

    if (!exhibitorType) {
      return res.status(404).json({
        message: "Exhibitor Type not found",
      });
    }

    let image = "";

    if (req.file) {
      image = req.file.location;
    }

    const exhibitor =
      await Exhibitor.create({
        eventId,
        name,
        stall,
        hall,
        description,
        image,
        exhibitorTypeId,
        status,
      });

    return res.status(201).json({
      success: true,
      message:
        "Exhibitor created successfully",
      data: exhibitor,
    });
  } catch (error) {
    console.error(
      "Create Exhibitor Error:",
      error
    );

    if (error.name === "ValidationError") {
      const errors = Object.values(
        error.errors
      ).map((err) => err.message);

      return res.status(400).json({
        message: errors.join(", "),
      });
    }

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// =======================
// Get All Exhibitors By Event
// =======================
export const getExhibitorsByEvent =
  async (req, res) => {
    try {
      const { eventId } = req.params;

      const exhibitors =
        await Exhibitor.find({
          eventId,
        })
          .populate(
            "exhibitorTypeId",
            "exhibitorType status"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        message:
          "Exhibitors fetched successfully",
        data: exhibitors,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Server Error",
      });
    }
  };

// =======================
// Get Active Exhibitors
// =======================
export const getActiveExhibitorsByEvent =
  async (req, res) => {
    try {
      const { eventId } = req.params;

      const exhibitors =
        await Exhibitor.find({
          eventId,
          status: "Active",
        })
          .populate(
            "exhibitorTypeId",
            "exhibitorType status"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        message:
          "Active Exhibitors fetched successfully",
        data: exhibitors,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Server Error",
      });
    }
  };

// =======================
// Get Exhibitor By Id
// =======================
export const getExhibitorById =
  async (req, res) => {
    try {
      const { id } = req.params;

      const exhibitor =
        await Exhibitor.findById(id).populate(
          "exhibitorTypeId",
          "exhibitorType status"
        );

      if (!exhibitor) {
        return res.status(404).json({
          message: "Exhibitor not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Exhibitor fetched successfully",
        data: exhibitor,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Server Error",
      });
    }
  };

// =======================
// Update Exhibitor
// =======================
export const updateExhibitor =
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        name,
        stall,
        hall,
        description,
        exhibitorTypeId,
        status,
      } = req.body;

      const exhibitor =
        await Exhibitor.findById(id);

      if (!exhibitor) {
        return res.status(404).json({
          message: "Exhibitor not found",
        });
      }

      if (exhibitorTypeId) {
        const exhibitorType =
          await ExhibitorType.findById(
            exhibitorTypeId
          );

        if (!exhibitorType) {
          return res.status(404).json({
            message:
              "Exhibitor Type not found",
          });
        }

        exhibitor.exhibitorTypeId =
          exhibitorTypeId;
      }

      if (name) {
        exhibitor.name = name;
      }

      if (stall) {
        exhibitor.stall = stall;
      }

      if (hall) {
        exhibitor.hall = hall;
      }

      if (description) {
        exhibitor.description =
          description;
      }

      if (status) {
        exhibitor.status = status;
      }

      if (req.file) {
        exhibitor.image =
          req.file.location;
      }

      await exhibitor.save();

      return res.status(200).json({
        success: true,
        message:
          "Exhibitor updated successfully",
        data: exhibitor,
      });
    } catch (error) {
      console.error(error);

      if (
        error.name === "ValidationError"
      ) {
        const errors = Object.values(
          error.errors
        ).map((err) => err.message);

        return res.status(400).json({
          message: errors.join(", "),
        });
      }

      return res.status(500).json({
        message: "Server Error",
      });
    }
  };

// =======================
// Delete Exhibitor
// =======================
export const deleteExhibitor =
  async (req, res) => {
    try {
      const { id } = req.params;

      const exhibitor =
        await Exhibitor.findById(id);

      if (!exhibitor) {
        return res.status(404).json({
          message: "Exhibitor not found",
        });
      }

      await exhibitor.deleteOne();

      return res.status(200).json({
        success: true,
        message:
          "Exhibitor deleted successfully",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Server Error",
      });
    }
  };