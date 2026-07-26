// models/Venue.js
import mongoose from "mongoose";

const SupportTicketSchema = new mongoose.Schema(
  {
    moduleId: {
      type: String,
      required: [true, "Module is required"],
      trim: true,
    },
    subModuleId: {
      type: String,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    ticketNumber: {
      type: String, // generate from backend 8 character number and character
      required: [true, "Ticket is required"],
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
      required: [true, "Priority is required"],
    },
    status: {
      type: String,
      enum: ["Pending", "Under Review", "Resolved", "Closed"],
      default: "Pending",
      required: [true, "Status is required"],
    },
    attachments: [
      {
        type: String, // store file path or URL
      },
    ],
    comments: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }, // automatically adds createdAt & updatedAt
);

// Avoid model overwrite during hot reload
export default mongoose.models.SupportTicket ||
  mongoose.model("SupportTicket", SupportTicketSchema);
