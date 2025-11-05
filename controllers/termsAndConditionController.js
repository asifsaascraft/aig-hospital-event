import TermsAndCondition from "../models/TermsAndCondition.js";
import Event from "../models/Event.js";

// =======================
// Create Terms & Conditions (EventAdmin Only)
// =======================
export const createTermsAndCondition = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { description } = req.body;

    // Validate event existence
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Create new Terms & Condition
    const terms = await TermsAndCondition.create({
      eventId,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Terms and Conditions created successfully",
      data: terms,
    });
  } catch (error) {
    console.error("Create TermsAndCondition error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Get All Terms & Conditions by Event ID (Public/User)
// =======================
export const getTermsAndConditionsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const terms = await TermsAndCondition.find({ eventId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Terms and Conditions fetched successfully",
      data: terms,
    });
  } catch (error) {
    console.error("Get TermsAndCondition error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Update Terms & Conditions (EventAdmin Only)
// =======================
export const updateTermsAndCondition = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const term = await TermsAndCondition.findById(id);
    if (!term) {
      return res.status(404).json({ message: "Terms and Condition not found" });
    }

    if (description) term.description = description;

    await term.save();

    res.status(200).json({
      success: true,
      message: "Terms and Conditions updated successfully",
      data: term,
    });
  } catch (error) {
    console.error("Update TermsAndCondition error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// =======================
// Delete Terms & Conditions (EventAdmin Only)
// =======================
export const deleteTermsAndCondition = async (req, res) => {
  try {
    const { id } = req.params;

    const term = await TermsAndCondition.findById(id);
    if (!term) {
      return res.status(404).json({ message: "Terms and Condition not found" });
    }

    await term.deleteOne();

    res.status(200).json({
      success: true,
      message: "Terms and Condition deleted successfully",
    });
  } catch (error) {
    console.error("Delete TermsAndCondition error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
