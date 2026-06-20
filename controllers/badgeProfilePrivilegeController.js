import mongoose from 'mongoose'
import BadgeProfilePrivilege from '../models/BadgeProfilePrivilege.js'
import CardProfile from '../models/CardProfile.js'
import ScanType from '../models/ScanType.js'

//======================================================
// CREATE PRIVILEGE
//======================================================
export const createPrivilege = async (req, res) => {
  try {
    const { eventId } = req.params
    const { badgeProfileId, scanTypeId, isAllowed, note, status } = req.body

    if (!badgeProfileId || !scanTypeId) {
      return res.status(400).json({
        success: false,
        message: 'badgeProfileId and scanTypeId are required',
      })
    }

    // CHECK BADGE PROFILE
    const badgeProfile = await CardProfile.findById(badgeProfileId)
    if (!badgeProfile) {
      return res.status(404).json({
        success: false,
        message: 'Badge profile not found',
      })
    }

    // CHECK SCAN TYPE
    const scanType = await ScanType.findById(scanTypeId)
    if (!scanType) {
      return res.status(404).json({
        success: false,
        message: 'Scan type not found',
      })
    }

    // DUPLICATE CHECK
    const existing = await BadgeProfilePrivilege.findOne({
      eventId,
      badgeProfileId,
      scanTypeId,
      isDeleted: false,
    })

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Privilege already exists',
      })
    }

    const data = await BadgeProfilePrivilege.create({
      eventId,
      badgeProfileId,
      scanTypeId,
      isAllowed: isAllowed ?? false,
      note: note || '',
      status: status || 'Active',
    })

    return res.status(201).json({
      success: true,
      message: 'Privilege created successfully',
      data,
    })
  } catch (error) {
    console.error('CREATE PRIVILEGE ERROR:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to create privilege',
      error: error.message,
    })
  }
}

//======================================================
// BULK ASSIGN PRIVILEGES
//======================================================
export const bulkAssignPrivileges = async (req, res) => {
  try {
    const { eventId } = req.params
    const { privileges } = req.body

    if (!Array.isArray(privileges) || privileges.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Privileges array is required',
      })
    }

    const operations = []

    for (const item of privileges) {
      const { badgeProfileId, scanTypeId, isAllowed } = item
      if (!badgeProfileId || !scanTypeId) {
        continue;
      }
      operations.push({
        updateOne: {
          filter: {
            eventId,
            badgeProfileId,
            scanTypeId,
          },

          update: {
            $set: {
              eventId,
              badgeProfileId,
              scanTypeId,
              isAllowed: isAllowed ?? false,
              isDeleted: false,
              status: 'Active',
            },
          },

          upsert: true,
        },
      })
    }

    if (operations.length > 0) {
      await BadgeProfilePrivilege.bulkWrite(operations)
    }

    return res.status(200).json({
      success: true,
      message: 'Privileges assigned successfully',
    })
  } catch (error) {
    console.error('BULK ASSIGN PRIVILEGES ERROR:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to assign privileges',
      error: error.message,
    })
  }
}

//======================================================
// GET PRIVILEGES BY BADGE PROFILE
//======================================================
export const getPrivilegesByBadgeProfile = async (req, res) => {
  try {
    const { eventId, badgeProfileId } = req.params

    const data = await BadgeProfilePrivilege.find({
      eventId,
      badgeProfileId,
      isDeleted: false,
    })
      .populate('badgeProfileId', 'CardProfileName')
      .populate('scanTypeId', 'scanType scanCode scanMode')
      .sort({
        createdAt: -1,
      })

    return res.status(200).json({
      success: true,
      total: data.length,
      data,
    })
  } catch (error) {
    console.error('GET PRIVILEGES ERROR:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch privileges',
      error: error.message,
    })
  }
}

//======================================================
// GET ALL PRIVILEGES MATRIX
//======================================================
export const getPrivilegeMatrix = async (req, res) => {
  try {
    const { eventId } = req.params
    const data = await BadgeProfilePrivilege.find({
      eventId,
      isDeleted: false,
    })
      .populate('badgeProfileId', 'CardProfileName')
      .populate('scanTypeId', 'scanType scanCode scanMode')

    return res.status(200).json({
      success: true,
      total: data.length,
      data,
    })
  } catch (error) {
    console.error('GET PRIVILEGE MATRIX ERROR:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch privilege matrix',
      error: error.message,
    })
  }
}

//======================================================
// UPDATE PRIVILEGE
//======================================================
export const updatePrivilege = async (req, res) => {
  try {
    const { id } = req.params
    const { isAllowed, note, status } = req.body
    const privilege = await BadgeProfilePrivilege.findById(id)

    if (!privilege || privilege.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Privilege not found',
      })
    }

    privilege.isAllowed = isAllowed ?? privilege.isAllowed
    privilege.note = note ?? privilege.note
    privilege.status = status || privilege.status

    await privilege.save()

    return res.status(200).json({
      success: true,
      message: 'Privilege updated successfully',
      data: privilege,
    })
  } catch (error) {
    console.error('UPDATE PRIVILEGE ERROR:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to update privilege',
      error: error.message,
    })
  }
}

//======================================================
// DELETE PRIVILEGE
//======================================================
export const deletePrivilege = async (req, res) => {
  try {
    const { id } = req.params
    const privilege = await BadgeProfilePrivilege.findById(id)

    if (!privilege || privilege.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Privilege not found',
      })
    }

    // SOFT DELETE
    privilege.isDeleted = true

    await privilege.save()

    return res.status(200).json({
      success: true,
      message: 'Privilege deleted successfully',
    })
  } catch (error) {
    console.error('DELETE PRIVILEGE ERROR:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to delete privilege',
      error: error.message,
    })
  }
}
