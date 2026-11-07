import mongoose from 'mongoose'

import LiveSession from '../models/AppSession.js'
import LiveSessionComment from '../models/AppSessionComment.js'
import { getPagination, buildPaginationMeta } from '../utils/pagination.js'

const formatComment = (item) => ({
  _id: item._id,
  sessionId: item.sessionId,
  eventId: item.eventId,
  comment: item.isDeleted ? null : item.comment,
  isDeleted: item.isDeleted,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  user: item.userId
    ? {
        _id: item.userId._id,
        name: item.userId.name,
        profilePicture: item.userId.profilePicture || null,
      }
    : null,
})

/*
========================================================
  Get Live Session Comments
  Public
  Paginated
========================================================
*/
export const getLiveSessionComments = async (req, res) => {
  try {
    const { sessionId } = req.params

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid live session ID',
      })
    }

    const liveSession = await LiveSession.findById(sessionId)

    if (!liveSession) {
      return res.status(404).json({
        success: false,
        message: 'Live session not found',
      })
    }

    const { page, limit, skip } = getPagination(req)

    const query = { sessionId }

    const [comments, total, totalComments] = await Promise.all([
      LiveSessionComment.find(query)
        .populate({
  path: 'userId',
  select: 'name profilePicture',
})
        .sort({ createdAt: 1, _id: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      // Total conversation entries, including deleted placeholders.
      LiveSessionComment.countDocuments(query),

      // Actual visible comments for the frontend count.
      LiveSessionComment.countDocuments({
        sessionId,
        isDeleted: false,
      }),
    ])

    const pagination = buildPaginationMeta(total, page, limit)

    return res.status(200).json({
      success: true,
      message: 'Live session comments fetched successfully',
      data: comments.map(formatComment),
      totalComments,
      pagination,
    })
  } catch (error) {
    console.error('Get live session comments error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch live session comments',
    })
  }
}

/*
========================================================
  Add Comment To Live Session
  Logged-in User
  Maximum 5 active comments per user per session
========================================================
*/
export const addLiveSessionComment = async (req, res) => {
  try {
    const { sessionId } = req.params
    const userId = req.user._id
    const { comment } = req.body

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid live session ID',
      })
    }

    if (typeof comment !== 'string' || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required',
      })
    }

    const liveSession = await LiveSession.findById(sessionId)

    if (!liveSession) {
      return res.status(404).json({
        success: false,
        message: 'Live session not found',
      })
    }

    // Keep the existing session status restriction.
    // There is no startDateTime/endDateTime restriction.
    if (liveSession.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Comments are disabled for this live session',
      })
    }

    // No event registration or payment validation is required.
    const commentCount = await LiveSessionComment.countDocuments({
      sessionId,
      userId,
      isDeleted: false,
    })

    if (commentCount >= 5) {
      return res.status(400).json({
        success: false,
        message: 'You can have a maximum of 5 active comments for this session',
      })
    }

    const liveSessionComment = await LiveSessionComment.create({
      sessionId,
      eventId: liveSession.eventId,
      userId,
      comment: comment.trim(),
      isDeleted: false,
    })

    const populatedComment = await LiveSessionComment.findById(
      liveSessionComment._id,
    )
      .populate({
  path: 'userId',
  select: 'name profilePicture',
})
      .lean()

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: populatedComment ? formatComment(populatedComment) : null,
    })
  } catch (error) {
    console.error('Add live session comment error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to add comment',
    })
  }
}

/*
========================================================
  Edit Own Comment
  Logged-in User
========================================================
*/
export const editLiveSessionComment = async (req, res) => {
  try {
    const { commentId } = req.params
    const userId = req.user._id
    const { comment } = req.body

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID',
      })
    }

    if (typeof comment !== 'string' || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required',
      })
    }

    const liveSessionComment = await LiveSessionComment.findById(commentId)

    if (!liveSessionComment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      })
    }

    if (liveSessionComment.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can edit only your own comment',
      })
    }

    if (liveSessionComment.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Deleted comments cannot be edited',
      })
    }

    liveSessionComment.comment = comment.trim()
    await liveSessionComment.save()

    const updatedComment = await LiveSessionComment.findById(commentId)
      .populate({
  path: 'userId',
  select: 'name profilePicture',
})
      .lean()

    return res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: updatedComment ? formatComment(updatedComment) : null,
    })
  } catch (error) {
    console.error('Edit live session comment error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to update comment',
    })
  }
}

/*
========================================================
  Delete Own Comment
  Logged-in User
  Soft Delete
========================================================
*/
export const deleteLiveSessionComment = async (req, res) => {
  try {
    const { commentId } = req.params
    const userId = req.user._id

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID',
      })
    }

    const liveSessionComment = await LiveSessionComment.findById(commentId)

    if (!liveSessionComment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      })
    }

    if (liveSessionComment.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can delete only your own comment',
      })
    }

    if (liveSessionComment.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Comment has already been removed',
      })
    }

    liveSessionComment.isDeleted = true
    await liveSessionComment.save()

    return res.status(200).json({
      success: true,
      message: 'Comment removed successfully',
    })
  } catch (error) {
    console.error('Delete live session comment error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to remove comment',
    })
  }
}