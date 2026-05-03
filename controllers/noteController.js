import Note from "../models/Note.js";

// =======================
// Get Note (Public)
// =======================
export const getNote = async (req, res) => {
  try {
    const note = await Note.findOne();

    return res.status(200).json({
      success: true,
      data: note || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch note",
      error: error.message,
    });
  }
};

// =======================
// Create Note (event admin only - only one allowed)
// =======================
export const createNote = async (req, res) => {
  try {
    const { termAndCondition, note, bankDetail } = req.body;

    // Validation
    if (!termAndCondition || !note || !bankDetail) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check if already exists
    const existingNote = await Note.findOne();
    if (existingNote) {
      return res.status(400).json({
        success: false,
        message: "Note already exists.",
      });
    }

    const newNote = await Note.create({
      termAndCondition,
      note,
      bankDetail,
    });

    return res.status(201).json({
      success: true,
      message: "Note created successfully",
      data: newNote,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create note",
      error: error.message,
    });
  }
};

// =======================
// Update Note (event admin only)
// =======================
export const updateNote = async (req, res) => {
  try {
    const { termAndCondition, note, bankDetail } = req.body;

    const existingNote = await Note.findOne();

    if (!existingNote) {
      return res.status(404).json({
        success: false,
        message: "Note not found. Please add",
      });
    }

    // Update fields (partial update allowed)
    if (termAndCondition !== undefined)
      existingNote.termAndCondition = termAndCondition;

    if (note !== undefined)
      existingNote.note = note;

    if (bankDetail !== undefined)
      existingNote.bankDetail = bankDetail;

    await existingNote.save();

    return res.status(200).json({
      success: true,
      message: "Note updated successfully",
      data: existingNote,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update note",
      error: error.message,
    });
  }
};

// =======================
// Delete Note (admin only)
// =======================
export const deleteNote = async (req, res) => {
  try {
    const existingNote = await Note.findOne();

    if (!existingNote) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    await existingNote.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Note deleted successfully",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete note",
      error: error.message,
    });
  }
};