import SupportTicket from "../models/SupportTicket.js";
import User from "../models/User.js";
import generateTicketNumber from "../utils/generateTicketNumber.js";
import sendEmailWithTemplate from "../utils/sendEmail.js";

// =======================
// Create Support Ticket (Public)
// =======================
export const createSupportTicket = async (req, res) => {
  try {
    const { moduleId, subModuleId, subject, description } = req.body;

    const attachments =
      req.files?.map((file) => file.location) || [];

    // Create Ticket
    const supportTicket = await SupportTicket.create({
      moduleId,
      subModuleId,
      subject,
      description,
      ticketNumber: generateTicketNumber(),
      priority: "Low",
      status: "Pending",
      attachments,
    });

    // Find Support Admin
    const supportAdmin = await User.findOne({
      role: "supportAdmin",
      status: "Active",
    });

    // Send email only if Support Admin exists
    if (supportAdmin) {
      await sendEmailWithTemplate({
        to: supportAdmin.email,
        name: supportAdmin.name,
        templateKey:
          "2518b.554b0da719bc314.k1.0fd4f820-88f0-11f1-b343-8e9a6c33ddc2.19f9e76b0a2",
        mergeInfo: {
          supportAdminName: supportAdmin.name,
          ticketNumber: supportTicket.ticketNumber,
          moduleId: supportTicket.moduleId,
          subject: supportTicket.subject,
          description: supportTicket.description,
          priority: supportTicket.priority,
          status: supportTicket.status,
          createdAt: supportTicket.createdAt.toLocaleString(),
        },
      });
    }

    res.status(201).json({
      message: "Support ticket created successfully",
      data: supportTicket,
    });
  } catch (error) {
    console.error("Create Support Ticket Error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================
// Get All Tickets
// =======================
export const getSupportTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find().sort({
      createdAt: -1,
    });

    res.json({
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================
// Get Single Ticket
// =======================
export const getSupportTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        message: "Support ticket not found",
      });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================
// Update Ticket
// =======================
export const updateSupportTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        message: "Support ticket not found",
      });
    }

    ticket.moduleId = req.body.moduleId ?? ticket.moduleId;

    ticket.subModuleId = req.body.subModuleId ?? ticket.subModuleId;

    ticket.subject = req.body.subject ?? ticket.subject;

    ticket.description = req.body.description ?? ticket.description;

    if (req.files && req.files.length > 0) {
      ticket.attachments = req.files.map((file) => file.location);
    }

    await ticket.save();

    res.json({
      message: "Support ticket updated successfully",
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================
// Delete Ticket
// =======================
export const deleteSupportTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        message: "Support ticket not found",
      });
    }

    await ticket.deleteOne();

    res.json({
      message: "Support ticket deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================
// Update Ticket Status
// (Support Admin Only)
// =======================
export const updateSupportTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatus = ["Pending", "Under Review", "Resolved", "Closed"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        message: "Support ticket not found",
      });
    }

    ticket.status = status;

    await ticket.save();

    res.json({
      message: "Ticket status updated successfully",
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
