import User from '../models/User.js'
import sendEmailWithTemplate from '../utils/sendEmail.js'

/* ============================================================
    TEMPLATE KEYS

    Each event has its own template key, pulled from env so you
    can wire up real IDs later without touching code.

    NOTE: TICKET_CREATED_SUPPORT_ADMIN keeps the original
    hardcoded ID from the existing code — that template already
    works in production, so it's left untouched rather than
    swapped for an env var.
============================================================ */

const TEMPLATE_KEYS = {
  TICKET_CREATED_EVENT_ADMIN:
    '2518b.554b0da719bc314.k1.ff937dd0-9185-11f1-8e34-d2cf08f4ca8c.19fd6bb162d',

  TICKET_CREATED_SUPPORT_ADMIN:
    '2518b.554b0da719bc314.k1.0fd4f820-88f0-11f1-b343-8e9a6c33ddc2.19f9e76b0a2',

  TICKET_ASSIGNED_EVENT_ADMIN:
    '2518b.554b0da719bc314.k1.8f7c1e30-9185-11f1-98a3-cabf48e1bf81.19fd6b83793',

  TICKET_ASSIGNED_SUPPORT_ADMIN:
    '2518b.554b0da719bc314.k1.cad2b340-9185-11f1-98a3-cabf48e1bf81.19fd6b9bc74',

  TICKET_REPLY_EVENT_ADMIN:
    '2518b.554b0da719bc314.k1.7d832d30-9186-11f1-acfd-8e9a6c33ddc2.19fd6be4f83',

  TICKET_REPLY_SUPPORT_ADMIN:
    '2518b.554b0da719bc314.k1.a9702420-9186-11f1-94bd-ae9c7e0b6a9f.19fd6bf6f62',

  TICKET_STATUS_UPDATED:
    '2518b.554b0da719bc314.k1.cef899c0-9186-11f1-94bd-ae9c7e0b6a9f.19fd6c0655c',

  TICKET_REOPENED:
    '2518b.554b0da719bc314.k1.529ad500-9186-11f1-98a3-cabf48e1bf81.19fd6bd3650',

  TICKET_FEEDBACK:
    '2518b.554b0da719bc314.k1.2bfe3040-9186-11f1-98a3-cabf48e1bf81.19fd6bc3944',
}

/* ============================================================
    HELPERS
============================================================ */

const truncate = (text = '', length = 140) => {
  const clean = text.trim()

  if (clean.length <= length) return clean

  return `${clean.slice(0, length)}...`
}

const getActiveSupportAdmins = () =>
  User.find({ role: 'supportAdmin', status: 'Active' }).select('name email')

const getUserById = (userId) => User.findById(userId).select('name email')

const safeSend = async (label, sendFn) => {
  try {
    await sendFn()
  } catch (error) {
    // Notifications must never break the request that triggered them.
    console.error(`[Notification] ${label} failed:`, error)
  }
}

/* ============================================================
    1. TICKET CREATED -> EVENT ADMIN (confirmation)
============================================================ */

export const sendTicketCreatedToEventAdmin = (ticket) =>
  safeSend('sendTicketCreatedToEventAdmin', async () => {
    const user = await getUserById(ticket.raisedBy.userId)

    if (!user) return

    await sendEmailWithTemplate({
      to: user.email,
      name: user.name,
      templateKey: TEMPLATE_KEYS.TICKET_CREATED_EVENT_ADMIN,

      mergeInfo: {
        userName: user.name,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        moduleId: ticket.moduleId,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt?.toLocaleString?.() || '',
        description: ticket.description,
      },
    })
  })

/* ============================================================
    2. TICKET CREATED -> SUPPORT ADMINS
    (existing flow, kept as-is, now reusable in one place)
============================================================ */

export const sendTicketCreatedToSupportAdmins = (ticket) =>
  safeSend('sendTicketCreatedToSupportAdmins', async () => {
    const supportAdmins = await getActiveSupportAdmins()

    if (!supportAdmins.length) return

    await Promise.all(
      supportAdmins.map((admin) =>
        sendEmailWithTemplate({
          to: admin.email,
          name: admin.name,
          templateKey: TEMPLATE_KEYS.TICKET_CREATED_SUPPORT_ADMIN,

          mergeInfo: {
            supportAdminName: admin.name,
            ticketNumber: ticket.ticketNumber,
            moduleId: ticket.moduleId,
            subject: ticket.subject,
            description: ticket.description,
            priority: ticket.priority,
            status: ticket.status,
            createdAt: ticket.createdAt?.toLocaleString?.() || '',
          },
        }),
      ),
    )
  })

/* ============================================================
    3. TICKET ASSIGNED -> EVENT ADMIN
    Also notifies the newly assigned Support Admin (useful
    addition beyond the original 8 flows — remove the second
    call below if you don't want it).
============================================================ */

export const sendTicketAssigned = (ticket, { supportAdmin } = {}) =>
  safeSend('sendTicketAssigned', async () => {
    const eventAdminUser = await getUserById(ticket.raisedBy.userId)

    const sends = []

    if (eventAdminUser) {
      sends.push(
        sendEmailWithTemplate({
          to: eventAdminUser.email,
          name: eventAdminUser.name,
          templateKey: TEMPLATE_KEYS.TICKET_ASSIGNED_EVENT_ADMIN,

          mergeInfo: {
            userName: eventAdminUser.name,
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
            assignedTo: ticket.assignedTo?.name || '',
            assignedDate:
              ticket.assignedTo?.assignedAt?.toLocaleString?.() || '',
            priority: ticket.priority,
            status: ticket.status,
          },
        }),
      )
    }

    if (supportAdmin) {
      sends.push(
        sendEmailWithTemplate({
          to: supportAdmin.email,
          name: supportAdmin.name,
          templateKey: TEMPLATE_KEYS.TICKET_ASSIGNED_SUPPORT_ADMIN,

          mergeInfo: {
            supportAdminName: supportAdmin.name,
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
            moduleId: ticket.moduleId,
            priority: ticket.priority,
            status: ticket.status,
            raisedBy: ticket.raisedBy.name,
          },
        }),
      )
    }

    await Promise.all(sends)
  })

/* ============================================================
    4 & 5. TICKET REPLY
    - support-admin replies -> event admin
    - event-admin replies -> assigned support admin,
      or ALL active support admins if unassigned
============================================================ */

export const sendTicketReply = (ticket, { actorRole, message }) =>
  safeSend('sendTicketReply', async () => {
    const messagePreview = truncate(message)

    if (actorRole === 'supportAdmin') {
      const eventAdminUser = await getUserById(ticket.raisedBy.userId)

      if (!eventAdminUser) return

      await sendEmailWithTemplate({
        to: eventAdminUser.email,
        name: eventAdminUser.name,
        templateKey: TEMPLATE_KEYS.TICKET_REPLY_EVENT_ADMIN,

        mergeInfo: {
          userName: eventAdminUser.name,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          replyBy: ticket.assignedTo?.name || 'Support Team',
          replyTime: new Date().toLocaleString(),
          messagePreview,
        },
      })

      return
    }

    // event-admin replied
    if (ticket.assignedTo?.userId) {
      const assignedAdmin = await getUserById(ticket.assignedTo.userId)

      if (!assignedAdmin) return

      await sendEmailWithTemplate({
        to: assignedAdmin.email,
        name: assignedAdmin.name,
        templateKey: TEMPLATE_KEYS.TICKET_REPLY_SUPPORT_ADMIN,

        mergeInfo: {
          supportAdminName: assignedAdmin.name,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          replyBy: ticket.raisedBy.name,
          replyTime: new Date().toLocaleString(),
          messagePreview,
        },
      })

      return
    }

    // unassigned -> notify all active support admins
    const supportAdmins = await getActiveSupportAdmins()

    if (!supportAdmins.length) return

    await Promise.all(
      supportAdmins.map((admin) =>
        sendEmailWithTemplate({
          to: admin.email,
          name: admin.name,
          templateKey: TEMPLATE_KEYS.TICKET_REPLY_SUPPORT_ADMIN,

          mergeInfo: {
            supportAdminName: admin.name,
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
            replyBy: ticket.raisedBy.name,
            replyTime: new Date().toLocaleString(),
            messagePreview,
          },
        }),
      ),
    )
  })

/* ============================================================
    6. STATUS UPDATED -> EVENT ADMIN
============================================================ */

export const sendTicketStatusUpdated = (ticket, { oldStatus, updatedBy }) =>
  safeSend('sendTicketStatusUpdated', async () => {
    const user = await getUserById(ticket.raisedBy.userId)

    if (!user) return

    await sendEmailWithTemplate({
      to: user.email,
      name: user.name,
      templateKey: TEMPLATE_KEYS.TICKET_STATUS_UPDATED,

      mergeInfo: {
        userName: user.name,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        oldStatus,
        newStatus: ticket.status,
        updatedBy,
        updatedTime: new Date().toLocaleString(),
        resolutionSummary: ticket.resolution?.summary || '',
      },
    })
  })

/* ============================================================
    7. TICKET REOPENED -> ASSIGNED SUPPORT ADMIN
    (or all active support admins if unassigned)
============================================================ */

export const sendTicketReopened = (
  ticket,
  { previousStatus, reason, reopenedBy },
) =>
  safeSend('sendTicketReopened', async () => {
    const commonMergeInfo = {
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      previousStatus,
      reason,
      reopenedBy,
      priority: ticket.priority,
    }

    if (ticket.assignedTo?.userId) {
      const assignedAdmin = await getUserById(ticket.assignedTo.userId)

      if (!assignedAdmin) return

      await sendEmailWithTemplate({
        to: assignedAdmin.email,
        name: assignedAdmin.name,
        templateKey: TEMPLATE_KEYS.TICKET_REOPENED,

        mergeInfo: {
          supportAdminName: assignedAdmin.name,
          ...commonMergeInfo,
        },
      })

      return
    }

    const supportAdmins = await getActiveSupportAdmins()

    if (!supportAdmins.length) return

    await Promise.all(
      supportAdmins.map((admin) =>
        sendEmailWithTemplate({
          to: admin.email,
          name: admin.name,
          templateKey: TEMPLATE_KEYS.TICKET_REOPENED,

          mergeInfo: {
            supportAdminName: admin.name,
            ...commonMergeInfo,
          },
        }),
      ),
    )
  })

/* ============================================================
    8. FEEDBACK SUBMITTED -> ASSIGNED SUPPORT ADMIN
    (or all active support admins if unassigned)
============================================================ */

export const sendTicketFeedback = (ticket) =>
  safeSend('sendTicketFeedback', async () => {
    const commonMergeInfo = {
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      rating: ticket.feedback?.rating,
      feedback: ticket.feedback?.comment || '',
      submittedBy: ticket.feedback?.submittedBy?.name || '',
    }

    if (ticket.assignedTo?.userId) {
      const assignedAdmin = await getUserById(ticket.assignedTo.userId)

      if (!assignedAdmin) return

      await sendEmailWithTemplate({
        to: assignedAdmin.email,
        name: assignedAdmin.name,
        templateKey: TEMPLATE_KEYS.TICKET_FEEDBACK,

        mergeInfo: {
          supportAdminName: assignedAdmin.name,
          ...commonMergeInfo,
        },
      })

      return
    }

    const supportAdmins = await getActiveSupportAdmins()

    if (!supportAdmins.length) return

    await Promise.all(
      supportAdmins.map((admin) =>
        sendEmailWithTemplate({
          to: admin.email,
          name: admin.name,
          templateKey: TEMPLATE_KEYS.TICKET_FEEDBACK,

          mergeInfo: {
            supportAdminName: admin.name,
            ...commonMergeInfo,
          },
        }),
      ),
    )
  })
