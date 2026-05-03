import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema(
  {
    termAndCondition: {
      type: String,
      required: [true, "Term & condition is required"],
    },

    note: {
      type: String,
      required: [true, "Note is required"],
    },

    bankDetail: {
      type: String,
      required: [true, "Bank details is required"],
    },

  },
  { timestamps: true }
);

export default mongoose.models.Note ||
  mongoose.model("Note", NoteSchema);
