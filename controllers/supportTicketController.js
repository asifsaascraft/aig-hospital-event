import SupportTicket from '../models/SupportTicket.js'
import User from '../models/User.js'

import generateTicketNumber from '../utils/generateTicketNumber.js'
import sendEmailWithTemplate from '../utils/sendEmail.js'

/* ============================================================
    CONSTANTS
============================================================ */

export const STATUS = {
  PENDING: 'Pending',
  ASSIGNED: 'Assigned',
  UNDER_REVIEW: 'Under Review',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REOPENED: 'Reopened',
}

export const PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
}

/* ============================================================
    CREATE ACTIVITY
============================================================ */

const createActivity = ({
  action,
  user,
  oldValue = '',
  newValue = '',
  remarks = '',
}) => ({
  action,

  performedBy: {
    userId: user._id,
    name: user.name,
    role: user.role,
  },

  oldValue,

  newValue,

  remarks,
})


/* ============================================================
    CREATE ATTACHMENTS
============================================================ */

const createAttachments = (files = [], role) => {
  return files.map((file) => ({
    fileName: file.originalname,

    fileUrl: file.location,

    fileType: file.mimetype,

    uploadedBy:
      role === "supportAdmin"
        ? "support-admin"
        : "event-admin",

    uploadedAt: new Date(),
  }));
};

/* ============================================================
    CREATE MESSAGE
============================================================ */

const createMessage = ({
  senderType,
  senderId,
  senderName,
  message,
  attachments = [],
  isInternal = false,
}) => ({
  senderType,

  senderId,

  senderName,

  message,

  attachments,

  isInternal,
});

/* ============================================================
    NOTIFY SUPPORT ADMINS
============================================================ */

const notifySupportAdmins = async (ticket) => {
  try {
    const supportAdmins = await User.find({
      role: "supportAdmin",
      status: "Active",
    });

    if (!supportAdmins.length) return;

    await Promise.all(
      supportAdmins.map((admin) =>
        sendEmailWithTemplate({
          to: admin.email,

          name: admin.name,

          templateKey: process.env.SUPPORT_TICKET_TEMPLATE,

          mergeInfo: {
            supportAdminName: admin.name,

            ticketNumber: ticket.ticketNumber,

            module: ticket.moduleId,

            subject: ticket.subject,

            priority: ticket.priority,

            status: ticket.status,

            raisedBy: ticket.raisedBy.name,
          },
        })
      )
    );
  } catch (error) {
    console.error(
      "Support notification failed:",
      error
    );
  }
};

/* ============================================================
    NOTIFY EVENT ADMIN
============================================================ */

const notifyEventAdmin = async (ticket) => {
  try {
    const user = await User.findById(
      ticket.raisedBy.userId
    );

    if (!user) return;

    await sendEmailWithTemplate({
      to: user.email,

      name: user.name,

      templateKey:
        process.env.EVENT_TICKET_TEMPLATE,

      mergeInfo: {
        userName: user.name,

        ticketNumber: ticket.ticketNumber,

        status: ticket.status,

        subject: ticket.subject,
      },
    });
  } catch (error) {
    console.error(
      "Event notification failed:",
      error
    );
  }
};

/* ============================================================
    CHECK TICKET ACCESS
============================================================ */

const canAccessTicket = (ticket, user) => {
  if (user.role === "supportAdmin") {
    return true;
  }

  if (
    user.role === "eventAdmin" &&
    ticket.raisedBy.userId.toString() ===
      user._id.toString()
  ) {
    return true;
  }

  return false;
};

/* ============================================================
    UPDATE READ STATUS
============================================================ */

const updateReadStatus = (ticket, role) => {
  if (role === "eventAdmin") {
    ticket.lastSeenByEventAdmin = new Date();
  }

  if (role === "supportAdmin") {
    ticket.lastSeenBySupportAdmin = new Date();
  }
};

/* ============================================================
    UPDATE COUNTERS
============================================================ */

const updateCounters = (
  ticket,
  attachments = [],
  increaseReply = true
) => {
  if (increaseReply) {
    ticket.replyCount += 1;
  }

  if (attachments.length) {
    ticket.attachmentCount += attachments.length;
  }
};

/* ============================================================
    CREATE SUPPORT TICKET
============================================================ */

export const createSupportTicket = async (req, res) => {
  try {
    const {
      eventId,
      moduleId,
      subModuleId,
      subject,
      description,
      priority = PRIORITY.LOW,
    } = req.body;

    /* ==========================================
        VALIDATION
    ========================================== */

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event is required.",
      });
    }

    if (!moduleId) {
      return res.status(400).json({
        success: false,
        message: "Module is required.",
      });
    }

    if (!subject?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subject is required.",
      });
    }

    if (!description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Description is required.",
      });
    }

    /* ==========================================
        ATTACHMENTS
    ========================================== */

    const attachments = createAttachments(
      req.files || [],
      req.user.role
    );

    /* ==========================================
        CREATE TICKET
    ========================================== */

    const ticket = new SupportTicket({
      eventId,

      ticketNumber: generateTicketNumber(),

      moduleId,

      subModuleId: subModuleId || null,

      subject: subject.trim(),

      description: description.trim(),

      priority,

      status: STATUS.PENDING,

      raisedBy: {
        userId: req.user._id,
        name: req.user.name,
      },

      attachments,

      lastReplyBy: "event-admin",

      lastReplyAt: new Date(),

      lastSeenByEventAdmin: new Date(),

      replyCount: 1,

      attachmentCount: attachments.length,
    });

    /* ==========================================
        FIRST MESSAGE
    ========================================== */

    ticket.messages.push(
      createMessage({
        senderType: "event-admin",

        senderId: req.user._id,

        senderName: req.user.name,

        message: description.trim(),

        attachments,
      })
    );

    /* ==========================================
        FIRST ACTIVITY
    ========================================== */

    ticket.activities.push(
      createActivity({
        action: "Ticket Created",

        user: req.user,

        newValue: STATUS.PENDING,
      })
    );

    /* ==========================================
        SAVE
    ========================================== */

    await ticket.save();

    /* ==========================================
        EMAIL
    ========================================== */

    await notifySupportAdmins(ticket);

    /* ==========================================
        RESPONSE
    ========================================== */

    return res.status(201).json({
      success: true,
      message: "Support ticket created successfully.",
      data: ticket,
    });
  } catch (error) {
    console.error("Create Ticket Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
    GET ALL SUPPORT TICKETS
    (Support Admin)
============================================================ */

export const getSupportTickets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      priority,
      moduleId,
      eventId,
      assignedTo,
    } = req.query;

    const query = {
      deleted: false,
    };

    /* ==========================================
        FILTERS
    ========================================== */

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (moduleId) {
      query.moduleId = moduleId;
    }

    if (eventId) {
      query.eventId = eventId;
    }

    if (assignedTo) {
      query["assignedTo.userId"] = assignedTo;
    }

    if (search?.trim()) {
      query.$or = [
        {
          ticketNumber: {
            $regex: search,
            $options: "i",
          },
        },
        {
          subject: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
        {
          "raisedBy.name": {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    /* ==========================================
        PAGINATION
    ========================================== */

    const skip =
      (Number(page) - 1) * Number(limit);

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .sort({
          updatedAt: -1,
        })
        .skip(skip)
        .limit(Number(limit)),

      SupportTicket.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,

      data: tickets,

      pagination: {
        page: Number(page),

        limit: Number(limit),

        total,

        totalPages: Math.ceil(
          total / Number(limit)
        ),
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
    GET MY SUPPORT TICKETS
    (Event Admin)
============================================================ */

export const getMySupportTickets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      priority,
    } = req.query;

    const query = {
      deleted: false,

      "raisedBy.userId": req.user._id,
    };

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (search?.trim()) {
      query.$or = [
        {
          ticketNumber: {
            $regex: search,
            $options: "i",
          },
        },
        {
          subject: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const skip =
      (Number(page) - 1) * Number(limit);

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .sort({
          updatedAt: -1,
        })
        .skip(skip)
        .limit(Number(limit)),

      SupportTicket.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,

      data: tickets,

      pagination: {
        page: Number(page),

        limit: Number(limit),

        total,

        totalPages: Math.ceil(
          total / Number(limit)
        ),
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
    GET SINGLE SUPPORT TICKET
============================================================ */

export const getSupportTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await SupportTicket.findOne({
      _id: id,
      deleted: false,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    /* ==========================================
        PERMISSION
    ========================================== */

    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to view this ticket.",
      });
    }

    /* ==========================================
        UPDATE LAST SEEN
    ========================================== */

    updateReadStatus(ticket, req.user.role);

    await ticket.save();

    /* ==========================================
        HIDE INTERNAL NOTES
        FOR EVENT ADMIN
    ========================================== */

    const response = ticket.toObject();

    if (req.user.role === "eventAdmin") {
      response.messages = response.messages.filter(
        (message) => !message.isInternal
      );
    }

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
    REPLY SUPPORT TICKET
============================================================ */

export const replySupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    /* ==========================================
        FIND TICKET
    ========================================== */

    const ticket = await SupportTicket.findOne({
      _id: id,
      deleted: false,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    /* ==========================================
        PERMISSION
    ========================================== */

    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to reply.",
      });
    }

    /* ==========================================
        VALIDATION

        Either message or attachment required
    ========================================== */

    const attachments = createAttachments(
      req.files || [],
      req.user.role
    );

    if (
      !message?.trim() &&
      attachments.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Reply message or attachment is required.",
      });
    }

    /* ==========================================
        CLOSED TICKET
    ========================================== */

    if (ticket.status === STATUS.CLOSED) {
      return res.status(400).json({
        success: false,
        message:
          "Closed ticket cannot receive replies.",
      });
    }

    /* ==========================================
        MESSAGE
    ========================================== */

    const senderType =
      req.user.role === "supportAdmin"
        ? "support-admin"
        : "event-admin";

    ticket.messages.push(
      createMessage({
        senderType,

        senderId: req.user._id,

        senderName: req.user.name,

        message: message?.trim() || "",

        attachments,
      })
    );

    /* ==========================================
        COUNTERS
    ========================================== */

    updateCounters(ticket, attachments);

    /* ==========================================
        LAST REPLY
    ========================================== */

    ticket.lastReplyBy = senderType;

    ticket.lastReplyAt = new Date();

    updateReadStatus(ticket, req.user.role);

    /* ==========================================
        FIRST RESPONSE SLA
    ========================================== */

    if (
      req.user.role === "supportAdmin" &&
      !ticket.sla.firstResponseAt
    ) {
      ticket.sla.firstResponseAt =
        new Date();
    }

    /* ==========================================
        AUTO STATUS CHANGE
    ========================================== */

    const previousStatus = ticket.status;

    if (
      req.user.role === "supportAdmin"
    ) {
      if (
        ticket.status === STATUS.PENDING ||
        ticket.status === STATUS.REOPENED
      ) {
        ticket.status =
          STATUS.UNDER_REVIEW;
      }
    }

    /* ==========================================
        ACTIVITY
    ========================================== */

    ticket.activities.push(
      createActivity({
        action: "Reply Added",

        user: req.user,

        remarks:
          message?.trim() ||
          "Attachment uploaded",
      })
    );

    if (
      previousStatus !== ticket.status
    ) {
      ticket.activities.push(
        createActivity({
          action: "Status Changed",

          user: req.user,

          oldValue: previousStatus,

          newValue: ticket.status,
        })
      );
    }

    /* ==========================================
        SAVE
    ========================================== */

    await ticket.save();

    /* ==========================================
        EMAIL
    ========================================== */

    if (
      req.user.role === "supportAdmin"
    ) {
      await notifyEventAdmin(ticket);
    } else {
      await notifySupportAdmins(ticket);
    }

    /* ==========================================
        RESPONSE
    ========================================== */

    return res.status(200).json({
      success: true,
      message:
        "Reply added successfully.",
      data: ticket,
    });
  } catch (error) {
    console.error(
      "Reply Ticket Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
    ASSIGN SUPPORT TICKET
============================================================ */

export const assignSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { supportAdminId } = req.body;

    /* ==========================================
        ONLY SUPPORT ADMIN
    ========================================== */

    if (req.user.role !== "supportAdmin") {
      return res.status(403).json({
        success: false,
        message: "Only Support Admin can assign tickets.",
      });
    }

    /* ==========================================
        VALIDATION
    ========================================== */

    if (!supportAdminId) {
      return res.status(400).json({
        success: false,
        message: "Support Admin is required.",
      });
    }

    /* ==========================================
        FIND TICKET
    ========================================== */

    const ticket = await SupportTicket.findOne({
      _id: id,
      deleted: false,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    /* ==========================================
        FIND SUPPORT ADMIN
    ========================================== */

    const supportAdmin = await User.findOne({
      _id: supportAdminId,
      role: "supportAdmin",
      status: "Active",
    });

    if (!supportAdmin) {
      return res.status(404).json({
        success: false,
        message: "Support Admin not found.",
      });
    }

    /* ==========================================
        PREVENT DUPLICATE ASSIGNMENT
    ========================================== */

    if (
      ticket.assignedTo?.userId &&
      ticket.assignedTo.userId.toString() ===
        supportAdmin._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Ticket is already assigned to this Support Admin.",
      });
    }

    const previousAssignee =
      ticket.assignedTo?.name || "";

    const previousStatus = ticket.status;

    /* ==========================================
        ASSIGN / REASSIGN
    ========================================== */

    ticket.assignedTo = {
      userId: supportAdmin._id,
      name: supportAdmin.name,
      assignedAt: new Date(),
    };

    if (ticket.status === STATUS.PENDING) {
      ticket.status = STATUS.ASSIGNED;
    }

    ticket.lastReplyBy = "support-admin";
    ticket.lastReplyAt = new Date();

    updateReadStatus(ticket, req.user.role);

    /* ==========================================
        ACTIVITY
    ========================================== */

    ticket.activities.push(
      createActivity({
        action: "Assigned",

        user: req.user,

        oldValue: previousAssignee,

        newValue: supportAdmin.name,

        remarks: previousAssignee
          ? `Ticket reassigned from ${previousAssignee} to ${supportAdmin.name}`
          : `Ticket assigned to ${supportAdmin.name}`,
      })
    );

    if (previousStatus !== ticket.status) {
      ticket.activities.push(
        createActivity({
          action: "Status Changed",

          user: req.user,

          oldValue: previousStatus,

          newValue: ticket.status,
        })
      );
    }

    /* ==========================================
        SYSTEM MESSAGE
    ========================================== */

    ticket.messages.push(
      createMessage({
        senderType: "support-admin",

        senderId: req.user._id,

        senderName: req.user.name,

        message: previousAssignee
          ? `Ticket reassigned to ${supportAdmin.name}.`
          : `Ticket assigned to ${supportAdmin.name}.`,
      })
    );

    updateCounters(ticket, [], true);

    /* ==========================================
        SAVE
    ========================================== */

    await ticket.save();

    /* ==========================================
        EMAIL NOTIFICATIONS
    ========================================== */

    await Promise.all([
      notifyEventAdmin(ticket),

      sendEmailWithTemplate({
        to: supportAdmin.email,

        name: supportAdmin.name,

        templateKey:
          process.env.SUPPORT_TICKET_TEMPLATE,

        mergeInfo: {
          supportAdminName: supportAdmin.name,
          ticketNumber: ticket.ticketNumber,
          module: ticket.moduleId,
          subject: ticket.subject,
          priority: ticket.priority,
          status: ticket.status,
          raisedBy: ticket.raisedBy.name,
        },
      }),
    ]);

    /* ==========================================
        RESPONSE
    ========================================== */

    return res.status(200).json({
      success: true,
      message: previousAssignee
        ? "Support ticket reassigned successfully."
        : "Support ticket assigned successfully.",
      data: ticket,
    });
  } catch (error) {
    console.error(
      "Assign Ticket Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
    UPDATE SUPPORT TICKET STATUS
============================================================ */

export const updateSupportTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      status,
      resolutionSummary,
    } = req.body;

    /* ==========================================
        ONLY SUPPORT ADMIN
    ========================================== */

    if (req.user.role !== "supportAdmin") {
      return res.status(403).json({
        success: false,
        message:
          "Only Support Admin can update ticket status.",
      });
    }

    /* ==========================================
        FIND TICKET
    ========================================== */

    const ticket = await SupportTicket.findOne({
      _id: id,
      deleted: false,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    /* ==========================================
        VALID STATUS
    ========================================== */

    const allowedStatus = [
      STATUS.PENDING,
      STATUS.ASSIGNED,
      STATUS.UNDER_REVIEW,
      STATUS.RESOLVED,
      STATUS.CLOSED,
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket status.",
      });
    }

    /* ==========================================
        SAME STATUS
    ========================================== */

    if (ticket.status === status) {
      return res.status(400).json({
        success: false,
        message: `Ticket is already ${status}.`,
      });
    }

    /* ==========================================
        VALID TRANSITIONS
    ========================================== */

    const transitions = {
      [STATUS.PENDING]: [
        STATUS.ASSIGNED,
        STATUS.UNDER_REVIEW,
      ],

      [STATUS.ASSIGNED]: [
        STATUS.UNDER_REVIEW,
      ],

      [STATUS.UNDER_REVIEW]: [
        STATUS.RESOLVED,
      ],

      [STATUS.RESOLVED]: [
        STATUS.CLOSED,
      ],

      [STATUS.REOPENED]: [
        STATUS.UNDER_REVIEW,
      ],

      [STATUS.CLOSED]: [],
    };

    if (
      !transitions[ticket.status]?.includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from "${ticket.status}" to "${status}".`,
      });
    }

    const oldStatus = ticket.status;

    /* ==========================================
        UPDATE STATUS
    ========================================== */

    ticket.status = status;

    ticket.lastReplyBy = "support-admin";

    ticket.lastReplyAt = new Date();

    updateReadStatus(ticket, req.user.role);

    /* ==========================================
        RESOLUTION
    ========================================== */

    if (status === STATUS.RESOLVED) {
      ticket.resolution = {
        summary:
          resolutionSummary?.trim() || "",

        resolvedBy: {
          userId: req.user._id,
          name: req.user.name,
        },

        resolvedAt: new Date(),
      };

      ticket.resolvedAt = new Date();
    }

    /* ==========================================
        CLOSED
    ========================================== */

    if (status === STATUS.CLOSED) {
      ticket.closedAt = new Date();
    }

    /* ==========================================
        CLEAR RESOLUTION
    ========================================== */

    if (status === STATUS.UNDER_REVIEW) {
      ticket.resolvedAt = null;
      ticket.closedAt = null;
      ticket.resolution = {};
    }

    /* ==========================================
        ACTIVITY
    ========================================== */

    ticket.activities.push(
      createActivity({
        action: "Status Changed",

        user: req.user,

        oldValue: oldStatus,

        newValue: status,
      })
    );

    /* ==========================================
        SYSTEM MESSAGE
    ========================================== */

    ticket.messages.push(
      createMessage({
        senderType: "support-admin",

        senderId: req.user._id,

        senderName: req.user.name,

        message: `Ticket status changed from "${oldStatus}" to "${status}".`,
      })
    );

    updateCounters(ticket, [], true);

    /* ==========================================
        SAVE
    ========================================== */

    await ticket.save();

    /* ==========================================
        EMAIL
    ========================================== */

    await notifyEventAdmin(ticket);

    /* ==========================================
        RESPONSE
    ========================================== */

    return res.status(200).json({
      success: true,
      message:
        "Ticket status updated successfully.",
      data: ticket,
    });
  } catch (error) {
    console.error(
      "Update Ticket Status Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
    REOPEN SUPPORT TICKET
============================================================ */

export const reopenSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    /* ==========================================
        ONLY EVENT ADMIN
    ========================================== */

    if (req.user.role !== "eventAdmin") {
      return res.status(403).json({
        success: false,
        message: "Only Event Admin can reopen tickets.",
      });
    }

    /* ==========================================
        VALIDATION
    ========================================== */

    if (!reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reopen reason is required.",
      });
    }

    /* ==========================================
        FIND TICKET
    ========================================== */

    const ticket = await SupportTicket.findOne({
      _id: id,
      deleted: false,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    /* ==========================================
        PERMISSION
    ========================================== */

    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to reopen this ticket.",
      });
    }

    /* ==========================================
        VALID STATUS
    ========================================== */

    if (
      ticket.status !== STATUS.RESOLVED &&
      ticket.status !== STATUS.CLOSED
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only resolved or closed tickets can be reopened.",
      });
    }

    const previousStatus = ticket.status;

    /* ==========================================
        STATUS
    ========================================== */

    ticket.status = STATUS.REOPENED;

    ticket.lastReplyBy = "event-admin";

    ticket.lastReplyAt = new Date();

    updateReadStatus(ticket, req.user.role);

    /* ==========================================
        REOPEN HISTORY
    ========================================== */

    ticket.reopenedCount += 1;

    ticket.reopenedHistory.push({
      reopenedBy: {
        userId: req.user._id,
        name: req.user.name,
      },

      reason: reason.trim(),

      reopenedAt: new Date(),
    });

    /* ==========================================
        CLEAR RESOLUTION
    ========================================== */

    ticket.resolution = {};

    ticket.resolvedAt = null;

    ticket.closedAt = null;

    /* ==========================================
        MESSAGE
    ========================================== */

    ticket.messages.push(
      createMessage({
        senderType: "event-admin",

        senderId: req.user._id,

        senderName: req.user.name,

        message: reason.trim(),
      })
    );

    /* ==========================================
        COUNTERS
    ========================================== */

    updateCounters(ticket, [], true);

    /* ==========================================
        ACTIVITY
    ========================================== */

    ticket.activities.push(
      createActivity({
        action: "Reopened",

        user: req.user,

        oldValue: previousStatus,

        newValue: STATUS.REOPENED,

        remarks: reason.trim(),
      })
    );

    /* ==========================================
        SAVE
    ========================================== */

    await ticket.save();

    /* ==========================================
        EMAIL
    ========================================== */

    await notifySupportAdmins(ticket);

    /* ==========================================
        RESPONSE
    ========================================== */

    return res.status(200).json({
      success: true,
      message: "Ticket reopened successfully.",
      data: ticket,
    });
  } catch (error) {
    console.error(
      "Reopen Ticket Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
    ADD INTERNAL NOTE
============================================================ */

export const addInternalNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    /* ==========================================
        ONLY SUPPORT ADMIN
    ========================================== */

    if (req.user.role !== "supportAdmin") {
      return res.status(403).json({
        success: false,
        message: "Only Support Admin can add internal notes.",
      });
    }

    /* ==========================================
        VALIDATION
    ========================================== */

    const attachments = createAttachments(
      req.files || [],
      req.user.role
    );

    if (!note?.trim() && attachments.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Internal note or attachment is required.",
      });
    }

    /* ==========================================
        FIND TICKET
    ========================================== */

    const ticket = await SupportTicket.findOne({
      _id: id,
      deleted: false,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    /* ==========================================
        CLOSED TICKET
    ========================================== */

    if (ticket.status === STATUS.CLOSED) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot add internal notes to a closed ticket.",
      });
    }

    /* ==========================================
        ADD INTERNAL NOTE
    ========================================== */

    ticket.messages.push(
      createMessage({
        senderType: "support-admin",

        senderId: req.user._id,

        senderName: req.user.name,

        message: note?.trim() || "",

        attachments,

        isInternal: true,
      })
    );

    /* ==========================================
        COUNTERS
    ========================================== */

    updateCounters(ticket, attachments, true);

    /* ==========================================
        LAST ACTIVITY
    ========================================== */

    ticket.lastReplyBy = "support-admin";

    ticket.lastReplyAt = new Date();

    updateReadStatus(ticket, req.user.role);

    /* ==========================================
        ACTIVITY
    ========================================== */

    ticket.activities.push(
      createActivity({
        action: "Internal Note Added",

        user: req.user,

        remarks:
          note?.trim() || "Attachment uploaded",
      })
    );

    /* ==========================================
        SAVE
    ========================================== */

    await ticket.save();

    return res.status(200).json({
      success: true,
      message:
        "Internal note added successfully.",
      data: ticket,
    });
  } catch (error) {
    console.error(
      "Internal Note Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
    SUBMIT TICKET FEEDBACK
============================================================ */

export const submitTicketFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment = "" } = req.body;

    /* ==========================================
        ONLY EVENT ADMIN
    ========================================== */

    if (req.user.role !== "eventAdmin") {
      return res.status(403).json({
        success: false,
        message: "Only Event Admin can submit feedback.",
      });
    }

    /* ==========================================
        VALIDATION
    ========================================== */

    if (!rating) {
      return res.status(400).json({
        success: false,
        message: "Rating is required.",
      });
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5.",
      });
    }

    /* ==========================================
        FIND TICKET
    ========================================== */

    const ticket = await SupportTicket.findOne({
      _id: id,
      deleted: false,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    /* ==========================================
        PERMISSION
    ========================================== */

    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to submit feedback for this ticket.",
      });
    }

    /* ==========================================
        TICKET MUST BE CLOSED
    ========================================== */

    if (ticket.status !== STATUS.CLOSED) {
      return res.status(400).json({
        success: false,
        message:
          "Feedback can only be submitted after the ticket is closed.",
      });
    }

    /* ==========================================
        ONLY ONCE
    ========================================== */

    if (ticket.feedback?.submittedAt) {
      return res.status(400).json({
        success: false,
        message: "Feedback has already been submitted.",
      });
    }

    /* ==========================================
        SAVE FEEDBACK
    ========================================== */

    ticket.feedback = {
      rating: Number(rating),

      comment: comment.trim(),

      submittedBy: {
        userId: req.user._id,
        name: req.user.name,
      },

      submittedAt: new Date(),
    };

    /* ==========================================
        ACTIVITY
    ========================================== */

    ticket.activities.push(
      createActivity({
        action: "Feedback Submitted",

        user: req.user,

        remarks: `Rating: ${rating}${
          comment ? ` | ${comment.trim()}` : ""
        }`,
      })
    );

    /* ==========================================
        SAVE
    ========================================== */

    await ticket.save();

    /* ==========================================
        RESPONSE
    ========================================== */

    return res.status(200).json({
      success: true,
      message: "Thank you for your feedback.",
      data: ticket.feedback,
    });
  } catch (error) {
    console.error(
      "Submit Feedback Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

