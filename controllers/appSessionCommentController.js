import mongoose from 'mongoose'

import Event from '../models/Event.js'
import EventRegistration from '../models/EventRegistration.js'
import LiveSession from '../models/AppSession.js'
import LiveSessionComment from '../models/AppSessionComment.js'

/*
========================================================
  Get Live Session Comments
  Public
========================================================
*/
export const getLiveSessionComments = async (req, res) => {
  try {
    const { sessionId } = req.params

    // Validate sessionId
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

    const comments = await LiveSessionComment.find({
      sessionId,
    })
      .populate('userId', 'name')
      .sort({ createdAt: 1 })
      .lean()

    const formattedComments = comments.map((item) => ({
      _id: item._id,
      sessionId: item.sessionId,
      eventId: item.eventId,
      comment: item.isDeleted ? null : item.comment,
      isDeleted: item.isDeleted,
      createdAt: item.createdAt,
      user: item.userId
        ? {
            _id: item.userId._id,
            name: item.userId.name,
          }
        : null,
    }))

    return res.status(200).json({
      success: true,
      message: 'Live session comments fetched successfully',
      data: formattedComments,
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
========================================================
*/
export const addLiveSessionComment = async (req, res) => {
  try {
    const { sessionId } = req.params
    const userId = req.user._id

    const { comment } = req.body

    // Validate sessionId
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid live session ID',
      })
    }

    // Validate comment
    if (!comment?.trim()) {
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

    // Session must be Active
    if (liveSession.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Comments are disabled for this live session',
      })
    }

    // Check session live window
    const now = new Date()

    if (now < liveSession.startDateTime || now > liveSession.endDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Comments are allowed only while the session is live',
      })
    }

    // Validate event
    const event = await Event.findById(liveSession.eventId)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    // Validate paid event registration
    const registration = await EventRegistration.findOne({
      userId,
      eventId: liveSession.eventId,
      isPaid: true,
      isSuspended: false,
    })

    if (!registration) {
      return res.status(403).json({
        success: false,
        message: 'You are not eligible to comment on this session',
      })
    }

    // Maximum 5 comments created by this user for this session
    const commentCount = await LiveSessionComment.countDocuments({
      sessionId,
      userId,
    })

    if (commentCount >= 5) {
      return res.status(400).json({
        success: false,
        message: 'You can add a maximum of 5 comments for this session',
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
      .populate('userId', 'name')
      .lean()

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: populatedComment
        ? {
            _id: populatedComment._id,
            sessionId: populatedComment.sessionId,
            eventId: populatedComment.eventId,
            comment: populatedComment.comment,
            isDeleted: populatedComment.isDeleted,
            createdAt: populatedComment.createdAt,
            user: populatedComment.userId
              ? {
                  _id: populatedComment.userId._id,
                  name: populatedComment.userId.name,
                }
              : null,
          }
        : null,
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
  Delete Own Comment
  Logged-in User
========================================================
*/
export const deleteLiveSessionComment = async (req, res) => {
  try {
    const { commentId } = req.params
    const userId = req.user._id

    // Validate commentId
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

    // Only comment owner can delete
    if (liveSessionComment.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can delete only your own comment',
      })
    }

    // Already deleted
    if (liveSessionComment.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Comment has already been removed',
      })
    }

    // Soft delete
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
