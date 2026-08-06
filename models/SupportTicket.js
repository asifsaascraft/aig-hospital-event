import mongoose from 'mongoose'

/* ============================================================
    ATTACHMENT
============================================================ */

const AttachmentSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
    },

    fileUrl: {
      type: String,
      required: true,
    },

    fileType: {
      type: String,
      required: true,
    },

    uploadedBy: {
      type: String,
      enum: ['event-admin', 'support-admin'],
      required: true,
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
)

/* ============================================================
    MESSAGE
============================================================ */

const MessageSchema = new mongoose.Schema(
  {
    senderType: {
      type: String,
      enum: ['event-admin', 'support-admin'],
      required: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    senderName: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    attachments: [AttachmentSchema],

    isInternal: {
      type: Boolean,
      default: false,
    },

    edited: {
      type: Boolean,
      default: false,
    },

    editedAt: Date,

    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

/* ============================================================
    ACTIVITY
============================================================ */

const ActivitySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        'Ticket Created',
        'Reply Added',
        'Assigned',
        'Status Changed',
        'Internal Note Added',
        'Reopened',
        'Closed',
        'Resolved',
        'Feedback Submitted',
      ],
    },

    performedBy: {
      userId: mongoose.Schema.Types.ObjectId,

      name: String,

      role: {
        type: String,
        enum: ['eventAdmin', 'supportAdmin'],
      },
    },

    oldValue: String,

    newValue: String,

    remarks: String,
  },
  {
    timestamps: true,
  },
)

/* ============================================================
    REOPEN HISTORY
============================================================ */

const ReopenHistorySchema = new mongoose.Schema(
  {
    reopenedBy: {
      userId: mongoose.Schema.Types.ObjectId,

      name: String,
    },

    reason: String,

    reopenedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
)

/* ============================================================
    SUPPORT TICKET
============================================================ */

const SupportTicketSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },

    moduleId: {
      type: String,
      required: true,
      trim: true,
    },

    subModuleId: {
      type: String,
      default: null,
      trim: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Low',
    },

    status: {
      type: String,
      enum: [
        'Pending',
        'Assigned',
        'Under Review',
        'Resolved',
        'Closed',
        'Reopened',
      ],
      default: 'Pending',
      index: true,
    },

    raisedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },

      name: {
        type: String,
        required: true,
      },
    },

    assignedTo: {
      userId: mongoose.Schema.Types.ObjectId,

      name: String,

      assignedAt: Date,
    },

    attachments: [AttachmentSchema],

    messages: [MessageSchema],

    activities: [ActivitySchema],

    resolution: {
      summary: String,

      resolvedBy: {
        userId: mongoose.Schema.Types.ObjectId,

        name: String,
      },

      resolvedAt: Date,
    },

    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },

      comment: {
        type: String,
        trim: true,
        maxlength: 500,
      },

      submittedBy: {
        userId: mongoose.Schema.Types.ObjectId,

        name: String,
      },

      submittedAt: Date,
    },

    reopenedCount: {
      type: Number,
      default: 0,
    },

    reopenedHistory: [ReopenHistorySchema],

    lastReplyBy: {
      type: String,
      enum: ['event-admin', 'support-admin'],
    },

    lastReplyAt: Date,

    lastSeenByEventAdmin: Date,

    lastSeenBySupportAdmin: Date,

    replyCount: {
      type: Number,
      default: 1,
    },

    attachmentCount: {
      type: Number,
      default: 0,
    },

    sla: {
      firstResponseAt: Date,

      dueDate: Date,

      breached: {
        type: Boolean,
        default: false,
      },
    },

    deleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: Date,

    deletedBy: {
      userId: mongoose.Schema.Types.ObjectId,

      name: String,
    },

    resolvedAt: Date,

    closedAt: Date,
  },
  {
    timestamps: true,
  },
)

/* ============================================================
    INDEXES

    Existing indexes kept as-is.
    Added below: indexes needed for query patterns that were
    previously doing collection scans (assigned-to-me, deleted
    filtering combined with eventId/status, raisedBy lookups).
============================================================ */

SupportTicketSchema.index({
  eventId: 1,
  status: 1,
})

SupportTicketSchema.index({
  eventId: 1,
  moduleId: 1,
})

// NEW: every list query filters deleted:false first — this
// lets Mongo use the index instead of scanning then filtering.
SupportTicketSchema.index({
  deleted: 1,
  eventId: 1,
  status: 1,
})

// NEW: supports "assigned to me" queries and assignment lookups
SupportTicketSchema.index({
  'assignedTo.userId': 1,
  status: 1,
})

// NEW: supports "my tickets" (event admin) queries
SupportTicketSchema.index({
  'raisedBy.userId': 1,
  status: 1,
})

export default mongoose.models.SupportTicket ||
  mongoose.model('SupportTicket', SupportTicketSchema)
