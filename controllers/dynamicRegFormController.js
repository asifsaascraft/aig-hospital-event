import DynamicRegForm from "../models/DynamicRegForm.js";
import Event from "../models/Event.js";

// =======================
// Create Dynamic Form (Only Once Per Event)
// =======================
export const createDynamicRegForm = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, fields } = req.body;

    // Check event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if form already exists for this event
    const existingForm = await DynamicRegForm.findOne({ eventId });
    if (existingForm) {
      return res.status(400).json({
        success: false,
        message: "Form already created for this event. You can only update it.",
      });
    }

    const form = await DynamicRegForm.create({
      eventId,
      title: title || "Dynamic Registration Form",
      fields: Array.isArray(fields) ? fields : [],
    });

    res.status(201).json({
      success: true,
      message: "Dynamic registration form created successfully",
      data: form,
    });

  } catch (error) {
    console.error("Create dynamic form error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


// =======================
// Get Dynamic Form By Event
// =======================
export const getDynamicRegFormByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const form = await DynamicRegForm.findOne({ eventId });

    res.status(200).json({
      success: true,
      message: "Dynamic form fetched successfully",
      data: form || {},
    });

  } catch (error) {
    console.error("Get dynamic form error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


// =======================
// Update Dynamic Form
// =======================
export const updateDynamicRegForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, fields } = req.body;

    const form = await DynamicRegForm.findById(id);
    if (!form) {
      return res
        .status(404)
        .json({ message: "No form exists for this event. Create first." });
    }

    if (title !== undefined) form.title = title;
    if (fields !== undefined)
      form.fields = Array.isArray(fields) ? fields : [];

    await form.save();

    res.status(200).json({
      success: true,
      message: "Dynamic form updated successfully",
      data: form,
    });

  } catch (error) {
    console.error("Update dynamic form error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


// =======================
// Delete Dynamic Form
// =======================
export const deleteDynamicRegForm = async (req, res) => {
  try {
    const { id } = req.params;

    const form = await DynamicRegForm.findById(id);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    await form.deleteOne();

    res.status(200).json({
      success: true,
      message: "Dynamic form deleted successfully",
    });

  } catch (error) {
    console.error("Delete dynamic form error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
