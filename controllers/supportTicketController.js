import SupportTicket from '../models/SupportTicket.js'
import User from '../models/User.js'

import generateTicketNumber from '../utils/generateTicketNumber.js'

import {
  sendTicketCreatedToEventAdmin,
  sendTicketCreatedToSupportAdmins,
  sendTicketAssigned,
  sendTicketReply,
  sendTicketStatusUpdated,
  sendTicketReopened,
  sendTicketFeedback,
} from './notificationService.js'

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

    uploadedBy: role === 'supportAdmin' ? 'support-admin' : 'event-admin',

    uploadedAt: new Date(),
  }))
}

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
})

/* ============================================================
    CHECK TICKET ACCESS
============================================================ */

const canAccessTicket = (ticket, user) => {
  if (user.role === 'supportAdmin') {
    return true
  }

  if (
    user.role === 'eventAdmin' &&
    ticket.raisedBy.userId.toString() === user._id.toString()
  ) {
    return true
  }

  return false
}

/* ============================================================
    READ STATUS FIELD FOR ROLE
============================================================ */

const readStatusField = (role) =>
  role === 'eventAdmin' ? 'lastSeenByEventAdmin' : 'lastSeenBySupportAdmin'

/* ============================================================
    CREATE SUPPORT TICKET

    FIX: ticketNumber generation now retries on collision
    (duplicate key error) instead of failing the whole request
    if two tickets are created in the same instant.
============================================================ */

const MAX_TICKET_NUMBER_RETRIES = 3

export const createSupportTicket = async (req, res) => {
  try {
    const {
      eventId,
      moduleId,
      subModuleId,
      subject,
      description,
      priority = PRIORITY.LOW,
    } = req.body

    /* ==========================================
        VALIDATION
    ========================================== */

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event is required.',
      })
    }

    if (!moduleId) {
      return res.status(400).json({
        success: false,
        message: 'Module is required.',
      })
    }

    if (!subject?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Subject is required.',
      })
    }

    if (!description?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Description is required.',
      })
    }

    /* ==========================================
        ATTACHMENTS
    ========================================== */

    const attachments = createAttachments(req.files || [], req.user.role)

    /* ==========================================
        CREATE TICKET (with retry on ticketNumber collision)
    ========================================== */

    let ticket = null
    let lastError = null

    for (let attempt = 0; attempt < MAX_TICKET_NUMBER_RETRIES; attempt++) {
      try {
        const candidate = new SupportTicket({
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

          lastReplyBy: 'event-admin',

          lastReplyAt: new Date(),

          lastSeenByEventAdmin: new Date(),

          replyCount: 1,

          attachmentCount: attachments.length,
        })

        candidate.messages.push(
          createMessage({
            senderType: 'event-admin',

            senderId: req.user._id,

            senderName: req.user.name,

            message: description.trim(),

            attachments,
          }),
        )

        candidate.activities.push(
          createActivity({
            action: 'Ticket Created',

            user: req.user,

            newValue: STATUS.PENDING,
          }),
        )

        await candidate.save()

        ticket = candidate
        break
      } catch (error) {
        // 11000 = duplicate key -> ticketNumber collision, retry with a new one
        if (error?.code === 11000 && attempt < MAX_TICKET_NUMBER_RETRIES - 1) {
          lastError = error
          continue
        }

        throw error
      }
    }

    if (!ticket) {
      throw lastError || new Error('Failed to generate a unique ticket number.')
    }

    /* ==========================================
        EMAIL NOTIFICATIONS
    ========================================== */

    await Promise.all([
      sendTicketCreatedToEventAdmin(ticket),
      sendTicketCreatedToSupportAdmins(ticket),
    ])

    /* ==========================================
        RESPONSE
    ========================================== */

    return res.status(201).json({
      success: true,
      message: 'Support ticket created successfully.',
      data: ticket,
    })
  } catch (error) {
    console.error('Create Ticket Error:', error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}



/* ============================================================
    GET ALL SUPPORT TICKETS
    (Support Admin)
============================================================ */

export const getSupportTickets = async (req, res) => {
  try {
    const {
      search,
      status,
      priority,
      moduleId,
      eventId,
      assignedTo,
    } = req.query

    const query = {
      deleted: false,
    }

    if (status) query.status = status
    if (priority) query.priority = priority
    if (moduleId) query.moduleId = moduleId
    if (eventId) query.eventId = eventId
    if (assignedTo) query['assignedTo.userId'] = assignedTo

    if (search?.trim()) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'raisedBy.name': { $regex: search, $options: 'i' } },
      ]
    }

    const tickets = await SupportTicket.find(query)
      .sort({ updatedAt: -1 })

    return res.status(200).json({
      success: true,
      data: tickets,
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

/* ============================================================
    GET MY SUPPORT TICKETS
    (Event Admin)
============================================================ */

export const getMySupportTickets = async (req, res) => {
  try {
    const { search, status, priority } = req.query

    const query = {
      deleted: false,
      'raisedBy.userId': req.user._id,
    }

    if (status) query.status = status
    if (priority) query.priority = priority

    if (search?.trim()) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    const tickets = await SupportTicket.find(query)
      .sort({ updatedAt: -1 })

    return res.status(200).json({
      success: true,
      data: tickets,
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}


/* ============================================================
    GET TICKETS ASSIGNED TO ME
    (Support Admin)  -- NEW
============================================================ */

export const getAssignedToMeTickets = async (req, res) => {
  try {
    if (req.user.role !== 'supportAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Only Support Admin can view assigned tickets.',
      })
    }

    const { status, priority } = req.query

    const query = {
      deleted: false,
      'assignedTo.userId': req.user._id,
    }

    if (status) query.status = status
    if (priority) query.priority = priority

    const tickets = await SupportTicket.find(query)
      .sort({ updatedAt: -1 })

    return res.status(200).json({
      success: true,
      data: tickets,
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

/* ============================================================
    GET TICKET STATS
    (Support Admin)  -- NEW
============================================================ */

export const getTicketStats = async (req, res) => {
  try {
    if (req.user.role !== 'supportAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Only Support Admin can view ticket stats.',
      })
    }

    const { eventId } = req.query

    const matchStage = { deleted: false }
    if (eventId) matchStage.eventId = eventId

    const [statusCounts, priorityCounts, totals] = await Promise.all([
      SupportTicket.aggregate([
        { $match: matchStage },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      SupportTicket.aggregate([
        { $match: matchStage },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),

      SupportTicket.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unassigned: {
              $sum: {
                $cond: [{ $ifNull: ['$assignedTo.userId', false] }, 0, 1],
              },
            },
            breachedSla: {
              $sum: { $cond: ['$sla.breached', 1, 0] },
            },
          },
        },
      ]),
    ])

    const byStatus = statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {})

    const byPriority = priorityCounts.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {})

    return res.status(200).json({
      success: true,
      data: {
        total: totals[0]?.total || 0,
        unassigned: totals[0]?.unassigned || 0,
        breachedSla: totals[0]?.breachedSla || 0,
        byStatus,
        byPriority,
      },
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

/* ============================================================
    GET ACTIVE SUPPORT ADMIN LIST
    (for assignment dropdown)  -- NEW
============================================================ */

export const getSupportAdminList = async (req, res) => {
  try {
    if (req.user.role !== 'supportAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Only Support Admin can view the support admin list.',
      })
    }

    const supportAdmins = await User.find({
      role: 'supportAdmin',
      status: 'Active',
    })
      .select('name email')
      .sort({ name: 1 })

    return res.status(200).json({
      success: true,
      data: supportAdmins,
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

/* ============================================================
    GET SINGLE SUPPORT TICKET

    FIX: previously called ticket.save() on every read just to
    stamp lastSeen*, which also bumped updatedAt (schema has
    timestamps:true) and made viewed tickets jump to the top of
    lists sorted by updatedAt. Now uses updateOne with an
    explicit field so updatedAt is untouched.
============================================================ */

export const getSupportTicketById = async (req, res) => {
  try {
    const { id } = req.params

    const ticket = await SupportTicket.findOne({
      _id: id,
      deleted: false,
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found.',
      })
    }

    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this ticket.',
      })
    }

    /* ==========================================
        UPDATE LAST SEEN
        (does not touch updatedAt)
    ========================================== */

    await SupportTicket.updateOne(
      { _id: ticket._id },
      { $set: { [readStatusField(req.user.role)]: new Date() } },
      { timestamps: false },
    )

    /* ==========================================
        HIDE INTERNAL NOTES FOR EVENT ADMIN
    ========================================== */

    const response = ticket.toObject()

    if (req.user.role === 'eventAdmin') {
      response.messages = response.messages.filter(
        (message) => !message.isInternal,
      )
    }

    return res.status(200).json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

/* ============================================================
    GET TICKET TIMELINE
    Merged, chronologically sorted view of activities + messages
    -- NEW
============================================================ */

export const getTicketTimeline = async (req, res) => {
  try {
    const { id } = req.params

    const ticket = await SupportTicket.findOne({
      _id: id,
      deleted: false,
    }).select('activities messages raisedBy')

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found.',
      })
    }

    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this ticket.',
      })
    }

    const activityEvents = ticket.activities.map((activity) => ({
      type: 'activity',
      action: activity.action,
      performedBy: activity.performedBy,
      oldValue: activity.oldValue,
      newValue: activity.newValue,
      remarks: activity.remarks,
      at: activity.createdAt,
    }))

    const messageEvents = ticket.messages
      .filter(
        (message) => !message.isInternal || req.user.role === 'supportAdmin',
      )
      .map((message) => ({
        type: 'message',
        senderType: message.senderType,
        senderName: message.senderName,
        message: message.message,
        isInternal: message.isInternal,
        attachmentCount: message.attachments?.length || 0,
        at: message.createdAt,
      }))

    const timeline = [...activityEvents, ...messageEvents].sort(
      (a, b) => new Date(a.at) - new Date(b.at),
    )

    return res.status(200).json({
      success: true,
      data: timeline,
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

/* ============================================================
    REPLY SUPPORT TICKET

    FIX (race condition): converted from
    findOne -> mutate in memory -> save()
    to a single atomic findOneAndUpdate with $push/$inc/$set,
    so two simultaneous replies can no longer overwrite each
    other's message array update.

    FIX: attachments now also sync into ticket.attachments
    (previously only landed in the message, so the top-level
    attachment list silently missed everything after creation).

    FIX: notifies only the assigned support admin on an event-
    admin reply (falls back to all active admins if unassigned),
    instead of always emailing every support admin.
============================================================ */

export const replySupportTicket = async (req, res) => {
  try {
    const { id } = req.params
    const { message } = req.body

    const ticket = await SupportTicket.findOne({ _id: id, deleted: false })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found.',
      })
    }

    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to reply.',
      })
    }

    const attachments = createAttachments(req.files || [], req.user.role)

    if (!message?.trim() && attachments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reply message or attachment is required.',
      })
    }

    if (ticket.status === STATUS.CLOSED) {
      return res.status(400).json({
        success: false,
        message: 'Closed ticket cannot receive replies.',
      })
    }

    const senderType =
      req.user.role === 'supportAdmin' ? 'support-admin' : 'event-admin'

    const previousStatus = ticket.status

    let nextStatus = ticket.status
    if (
      req.user.role === 'supportAdmin' &&
      (ticket.status === STATUS.PENDING || ticket.status === STATUS.REOPENED)
    ) {
      nextStatus = STATUS.UNDER_REVIEW
    }

    const activities = [
      createActivity({
        action: 'Reply Added',
        user: req.user,
        remarks: message?.trim() || 'Attachment uploaded',
      }),
    ]

    if (previousStatus !== nextStatus) {
      activities.push(
        createActivity({
          action: 'Status Changed',
          user: req.user,
          oldValue: previousStatus,
          newValue: nextStatus,
        }),
      )
    }

    const setFields = {
      lastReplyBy: senderType,
      lastReplyAt: new Date(),
      status: nextStatus,
      [readStatusField(req.user.role)]: new Date(),
    }

    if (req.user.role === 'supportAdmin' && !ticket.sla.firstResponseAt) {
      setFields['sla.firstResponseAt'] = new Date()
    }

    const updatedTicket = await SupportTicket.findOneAndUpdate(
      { _id: id, deleted: false },
      {
        $push: {
          messages: createMessage({
            senderType,
            senderId: req.user._id,
            senderName: req.user.name,
            message: message?.trim() || '',
            attachments,
          }),
          activities: { $each: activities },
          // keep top-level attachments in sync with reply attachments
          ...(attachments.length
            ? { attachments: { $each: attachments } }
            : {}),
        },
        $set: setFields,
        $inc: {
          replyCount: 1,
          attachmentCount: attachments.length,
        },
      },
      { new: true },
    )

    /* ==========================================
        EMAIL
    ========================================== */

    await sendTicketReply(updatedTicket, {
      actorRole: req.user.role,
      message: message?.trim() || 'Attachment uploaded',
    })

    return res.status(200).json({
      success: true,
      message: 'Reply added successfully.',
      data: updatedTicket,
    })
  } catch (error) {
    console.error('Reply Ticket Error:', error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

/* ============================================================
    ASSIGN SUPPORT TICKET

    FIX: optimistic lock via matching the previously-read status
    in the update filter, so a status change that happens between
    the read and the write is not silently clobbered.
============================================================ */

export const assignSupportTicket = async (req, res) => {
  try {
    const { id } = req.params
    const { supportAdminId } = req.body

    if (req.user.role !== 'supportAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Only Support Admin can assign tickets.',
      })
    }

    if (!supportAdminId) {
      return res.status(400).json({
        success: false,
        message: 'Support Admin is required.',
      })
    }

    const ticket = await SupportTicket.findOne({ _id: id, deleted: false })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found.',
      })
    }

    const supportAdmin = await User.findOne({
      _id: supportAdminId,
      role: 'supportAdmin',
      status: 'Active',
    })

    if (!supportAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Support Admin not found.',
      })
    }

    if (
      ticket.assignedTo?.userId &&
      ticket.assignedTo.userId.toString() === supportAdmin._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Ticket is already assigned to this Support Admin.',
      })
    }

    const previousAssignee = ticket.assignedTo?.name || ''
    const previousStatus = ticket.status
    const nextStatus =
      ticket.status === STATUS.PENDING ? STATUS.ASSIGNED : ticket.status

    const activities = [
      createActivity({
        action: 'Assigned',
        user: req.user,
        oldValue: previousAssignee,
        newValue: supportAdmin.name,
        remarks: previousAssignee
          ? `Ticket reassigned from ${previousAssignee} to ${supportAdmin.name}`
          : `Ticket assigned to ${supportAdmin.name}`,
      }),
    ]

    if (previousStatus !== nextStatus) {
      activities.push(
        createActivity({
          action: 'Status Changed',
          user: req.user,
          oldValue: previousStatus,
          newValue: nextStatus,
        }),
      )
    }

    const updatedTicket = await SupportTicket.findOneAndUpdate(
      { _id: id, deleted: false, status: previousStatus },
      {
        $set: {
          assignedTo: {
            userId: supportAdmin._id,
            name: supportAdmin.name,
            assignedAt: new Date(),
          },
          status: nextStatus,
          lastReplyBy: 'support-admin',
          lastReplyAt: new Date(),
          [readStatusField(req.user.role)]: new Date(),
        },
        $push: {
          activities: { $each: activities },
          messages: createMessage({
            senderType: 'support-admin',
            senderId: req.user._id,
            senderName: req.user.name,
            message: previousAssignee
              ? `Ticket reassigned to ${supportAdmin.name}.`
              : `Ticket assigned to ${supportAdmin.name}.`,
          }),
        },
        $inc: { replyCount: 1 },
      },
      { new: true },
    )

    if (!updatedTicket) {
      return res.status(409).json({
        success: false,
        message:
          'This ticket was updated by someone else. Please refresh and try again.',
      })
    }

    /* ==========================================
        EMAIL
    ========================================== */

    await sendTicketAssigned(updatedTicket, { supportAdmin })

    return res.status(200).json({
      success: true,
      message: previousAssignee
        ? 'Support ticket reassigned successfully.'
        : 'Support ticket assigned successfully.',
      data: updatedTicket,
    })
  } catch (error) {
    console.error('Assign Ticket Error:', error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

/* ============================================================
    UPDATE SUPPORT TICKET STATUS

    FIX: "Pending -> Assigned" transition removed from the
    manual status endpoint. Assignment must go through
    assignSupportTicket, which is the only place that actually
    sets ticket.assignedTo — this prevents a ticket showing
    status "Assigned" with nobody assigned.
============================================================ */

export const updateSupportTicketStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, resolutionSummary } = req.body

    if (req.user.role !== 'supportAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Only Support Admin can update ticket status.',
      })
    }

    const ticket = await SupportTicket.findOne({ _id: id, deleted: false })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found.',
      })
    }

    const allowedStatus = [STATUS.UNDER_REVIEW, STATUS.RESOLVED, STATUS.CLOSED]

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ticket status.',
      })
    }

    if (ticket.status === status) {
      return res.status(400).json({
        success: false,
        message: `Ticket is already ${status}.`,
      })
    }

    const transitions = {
      [STATUS.PENDING]: [STATUS.UNDER_REVIEW],
      [STATUS.ASSIGNED]: [STATUS.UNDER_REVIEW],
      [STATUS.UNDER_REVIEW]: [STATUS.RESOLVED],
      [STATUS.RESOLVED]: [STATUS.CLOSED],
      [STATUS.REOPENED]: [STATUS.UNDER_REVIEW],
      [STATUS.CLOSED]: [],
    }

    if (!transitions[ticket.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from "${ticket.status}" to "${status}".`,
      })
    }

    const oldStatus = ticket.status

    const setFields = {
      status,
      lastReplyBy: 'support-admin',
      lastReplyAt: new Date(),
      [readStatusField(req.user.role)]: new Date(),
    }

    const unsetFields = {}

    if (status === STATUS.RESOLVED) {
      setFields.resolution = {
        summary: resolutionSummary?.trim() || '',
        resolvedBy: { userId: req.user._id, name: req.user.name },
        resolvedAt: new Date(),
      }
      setFields.resolvedAt = new Date()
    }

    if (status === STATUS.CLOSED) {
      setFields.closedAt = new Date()
    }

    if (status === STATUS.UNDER_REVIEW) {
      setFields.resolvedAt = null
      setFields.closedAt = null
      unsetFields.resolution = ''
    }

    const activity = createActivity({
      action: 'Status Changed',
      user: req.user,
      oldValue: oldStatus,
      newValue: status,
    })

    const message = createMessage({
      senderType: 'support-admin',
      senderId: req.user._id,
      senderName: req.user.name,
      message: `Ticket status changed from "${oldStatus}" to "${status}".`,
    })

    const updatedTicket = await SupportTicket.findOneAndUpdate(
      { _id: id, deleted: false, status: oldStatus },
      {
        $set: setFields,
        ...(Object.keys(unsetFields).length ? { $unset: unsetFields } : {}),
        $push: { activities: activity, messages: message },
        $inc: { replyCount: 1 },
      },
      { new: true },
    )

    if (!updatedTicket) {
      return res.status(409).json({
        success: false,
        message:
          'This ticket was updated by someone else. Please refresh and try again.',
      })
    }

    /* ==========================================
        EMAIL
    ========================================== */

    await sendTicketStatusUpdated(updatedTicket, {
      oldStatus,
      updatedBy: req.user.name,
    })

    return res.status(200).json({
      success: true,
      message: 'Ticket status updated successfully.',
      data: updatedTicket,
    })
  } catch (error) {
    console.error('Update Ticket Status Error:', error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

/* ============================================================
    REOPEN SUPPORT TICKET
============================================================ */

export const reopenSupportTicket = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    if (req.user.role !== 'eventAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Only Event Admin can reopen tickets.',
      })
    }

    if (!reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reopen reason is required.',
      })
    }

    const ticket = await SupportTicket.findOne({ _id: id, deleted: false })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found.',
      })
    }

    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to reopen this ticket.',
      })
    }

    if (ticket.status !== STATUS.RESOLVED && ticket.status !== STATUS.CLOSED) {
      return res.status(400).json({
        success: false,
        message: 'Only resolved or closed tickets can be reopened.',
      })
    }

    const previousStatus = ticket.status

    const activity = createActivity({
      action: 'Reopened',
      user: req.user,
      oldValue: previousStatus,
      newValue: STATUS.REOPENED,
      remarks: reason.trim(),
    })

    const message = createMessage({
      senderType: 'event-admin',
      senderId: req.user._id,
      senderName: req.user.name,
      message: reason.trim(),
    })

    const reopenEntry = {
      reopenedBy: { userId: req.user._id, name: req.user.name },
      reason: reason.trim(),
      reopenedAt: new Date(),
    }

    const updatedTicket = await SupportTicket.findOneAndUpdate(
      { _id: id, deleted: false, status: previousStatus },
      {
        $set: {
          status: STATUS.REOPENED,
          lastReplyBy: 'event-admin',
          lastReplyAt: new Date(),
          resolvedAt: null,
          closedAt: null,
          [readStatusField(req.user.role)]: new Date(),
        },
        $unset: { resolution: '' },
        $push: {
          activities: activity,
          messages: message,
          reopenedHistory: reopenEntry,
        },
        $inc: { reopenedCount: 1, replyCount: 1 },
      },
      { new: true },
    )

    if (!updatedTicket) {
      return res.status(409).json({
        success: false,
        message:
          'This ticket was updated by someone else. Please refresh and try again.',
      })
    }

    /* ==========================================
        EMAIL
    ========================================== */

    await sendTicketReopened(updatedTicket, {
      previousStatus,
      reason: reason.trim(),
      reopenedBy: req.user.name,
    })

    return res.status(200).json({
      success: true,
      message: 'Ticket reopened successfully.',
      data: updatedTicket,
    })
  } catch (error) {
    console.error('Reopen Ticket Error:', error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

/* ============================================================
    ADD INTERNAL NOTE

    FIX (race condition + attachment sync): same atomic-update
    treatment as replySupportTicket.
============================================================ */

export const addInternalNote = async (req, res) => {
  try {
    const { id } = req.params
    const { note } = req.body

    if (req.user.role !== 'supportAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Only Support Admin can add internal notes.',
      })
    }

    const attachments = createAttachments(req.files || [], req.user.role)

    if (!note?.trim() && attachments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Internal note or attachment is required.',
      })
    }

    const ticket = await SupportTicket.findOne({ _id: id, deleted: false })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found.',
      })
    }

    if (ticket.status === STATUS.CLOSED) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add internal notes to a closed ticket.',
      })
    }

    const message = createMessage({
      senderType: 'support-admin',
      senderId: req.user._id,
      senderName: req.user.name,
      message: note?.trim() || '',
      attachments,
      isInternal: true,
    })

    const activity = createActivity({
      action: 'Internal Note Added',
      user: req.user,
      remarks: note?.trim() || 'Attachment uploaded',
    })

    const updatedTicket = await SupportTicket.findOneAndUpdate(
      { _id: id, deleted: false },
      {
        $push: {
          messages: message,
          activities: activity,
          // internal note attachments are NOT synced to the
          // top-level ticket.attachments list, since those are
          // customer-facing and internal notes are support-only
        },
        $set: {
          lastReplyBy: 'support-admin',
          lastReplyAt: new Date(),
          [readStatusField(req.user.role)]: new Date(),
        },
        $inc: {
          replyCount: 1,
          attachmentCount: attachments.length,
        },
      },
      { new: true },
    )

    return res.status(200).json({
      success: true,
      message: 'Internal note added successfully.',
      data: updatedTicket,
    })
  } catch (error) {
    console.error('Internal Note Error:', error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

/* ============================================================
    SUBMIT TICKET FEEDBACK

    FIX: now actually sends the feedback notification email
    (was previously missing entirely).
============================================================ */

export const submitTicketFeedback = async (req, res) => {
  try {
    const { id } = req.params
    const { rating, comment = '' } = req.body

    if (req.user.role !== 'eventAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Only Event Admin can submit feedback.',
      })
    }

    if (!rating) {
      return res.status(400).json({
        success: false,
        message: 'Rating is required.',
      })
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5.',
      })
    }

    const ticket = await SupportTicket.findOne({ _id: id, deleted: false })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found.',
      })
    }

    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to submit feedback for this ticket.',
      })
    }

    if (ticket.status !== STATUS.CLOSED) {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be submitted after the ticket is closed.',
      })
    }

    if (ticket.feedback?.submittedAt) {
      return res.status(400).json({
        success: false,
        message: 'Feedback has already been submitted.',
      })
    }

    const feedback = {
      rating: Number(rating),
      comment: comment.trim(),
      submittedBy: { userId: req.user._id, name: req.user.name },
      submittedAt: new Date(),
    }

    const activity = createActivity({
      action: 'Feedback Submitted',
      user: req.user,
      remarks: `Rating: ${rating}${comment ? ` | ${comment.trim()}` : ''}`,
    })

    const updatedTicket = await SupportTicket.findOneAndUpdate(
      { _id: id, deleted: false },
      {
        $set: { feedback },
        $push: { activities: activity },
      },
      { new: true },
    )

    /* ==========================================
        EMAIL
    ========================================== */

    await sendTicketFeedback(updatedTicket)

    return res.status(200).json({
      success: true,
      message: 'Thank you for your feedback.',
      data: updatedTicket.feedback,
    })
  } catch (error) {
    console.error('Submit Feedback Error:', error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
