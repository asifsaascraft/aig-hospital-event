import mongoose from 'mongoose'

import ScanType from '../models/ScanType.js'
import Event from '../models/Event.js'

//======================================================
// CREATE SCAN TYPE
//======================================================

export const createScanType = async (req, res) => {
  try {
    const { eventId } = req.params

    const {
      scanType,
      scanCode,
      description,
      scanMode,
      allowReEntry,
      scanStartTime,
      scanEndTime,
      status,
    } = req.body

    /**
     * VALIDATION
     */

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,

        message: 'Invalid event id',
      })
    }

    if (!scanType) {
      return res.status(400).json({
        success: false,

        message: 'scanType is required',
      })
    }

    if (!scanCode) {
      return res.status(400).json({
        success: false,

        message: 'scanCode is required',
      })
    }

    /**
     * EVENT CHECK
     */

    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({
        success: false,

        message: 'Event not found',
      })
    }

    /**
     * DUPLICATE CHECK
     */

    const existing = await ScanType.findOne({
      eventId,

      scanCode: scanCode.toUpperCase(),

      isDeleted: false,
    })

    if (existing) {
      return res.status(409).json({
        success: false,

        message: 'Scan code already exists for this event',
      })
    }

    /**
     * CREATE
     */

    const data = await ScanType.create({
      eventId,

      scanType: scanType.trim(),

      scanCode: scanCode.trim().toUpperCase(),

      description: description || '',

      scanMode: scanMode || 'single',

      allowReEntry: allowReEntry || false,

      scanStartTime: scanStartTime || null,

      scanEndTime: scanEndTime || null,

      status: status || 'Active',
    })

    return res.status(201).json({
      success: true,

      message: 'Scan type created successfully',

      data,
    })
  } catch (error) {
    console.error('CREATE SCAN TYPE ERROR:', error)

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,

        message: 'Duplicate scan code for this event',
      })
    }

    return res.status(500).json({
      success: false,

      message: 'Failed to create scan type',

      error: error.message,
    })
  }
}

//======================================================
// GET ALL SCAN TYPES
//======================================================

export const getScanTypes = async (req, res) => {
  try {
    const { eventId } = req.params

    const data = await ScanType.find({
      eventId,

      isDeleted: false,
    }).sort({
      createdAt: -1,
    })

    return res.status(200).json({
      success: true,

      message: 'Scan types fetched successfully',

      total: data.length,

      data,
    })
  } catch (error) {
    console.error('GET SCAN TYPES ERROR:', error)

    return res.status(500).json({
      success: false,

      message: 'Failed to fetch scan types',

      error: error.message,
    })
  }
}

//======================================================
// GET ACTIVE SCAN TYPES
//======================================================

export const getActiveScanTypes = async (req, res) => {
  try {
    const { eventId } = req.params

    const data = await ScanType.find({
      eventId,

      status: 'Active',

      isDeleted: false,
    }).sort({
      createdAt: -1,
    })

    return res.status(200).json({
      success: true,

      message: 'Active scan types fetched successfully',

      total: data.length,

      data,
    })
  } catch (error) {
    console.error('GET ACTIVE SCAN TYPES ERROR:', error)

    return res.status(500).json({
      success: false,

      message: 'Failed to fetch active scan types',

      error: error.message,
    })
  }
}

//======================================================
// GET SINGLE SCAN TYPE
//======================================================

export const getSingleScanType = async (req, res) => {
  try {
    const { id } = req.params

    const data = await ScanType.findOne({
      _id: id,

      isDeleted: false,
    })

    if (!data) {
      return res.status(404).json({
        success: false,

        message: 'Scan type not found',
      })
    }

    return res.status(200).json({
      success: true,

      data,
    })
  } catch (error) {
    console.error('GET SINGLE SCAN TYPE ERROR:', error)

    return res.status(500).json({
      success: false,

      message: 'Failed to fetch scan type',

      error: error.message,
    })
  }
}

//======================================================
// UPDATE SCAN TYPE
//======================================================

export const updateScanType = async (req, res) => {
  try {
    const { id } = req.params

    const {
      scanType,
      scanCode,
      description,
      scanMode,
      allowReEntry,
      scanStartTime,
      scanEndTime,
      status,
    } = req.body

    /**
     * FIND EXISTING
     */

    const existing = await ScanType.findById(id)

    if (!existing || existing.isDeleted) {
      return res.status(404).json({
        success: false,

        message: 'Scan type not found',
      })
    }

    /**
     * FINAL VALUES
     */

    const finalScanCode = scanCode
      ? scanCode.trim().toUpperCase()
      : existing.scanCode

    /**
     * DUPLICATE CHECK
     */

    const duplicate = await ScanType.findOne({
      eventId: existing.eventId,

      scanCode: finalScanCode,

      _id: {
        $ne: id,
      },

      isDeleted: false,
    })

    if (duplicate) {
      return res.status(409).json({
        success: false,

        message: 'Scan code already exists for this event',
      })
    }

    /**
     * UPDATE
     */

    existing.scanType = scanType?.trim() || existing.scanType

    existing.scanCode = finalScanCode

    existing.description = description ?? existing.description

    existing.scanMode = scanMode || existing.scanMode

    existing.allowReEntry = allowReEntry ?? existing.allowReEntry

    existing.scanStartTime = scanStartTime ?? existing.scanStartTime

    existing.scanEndTime = scanEndTime ?? existing.scanEndTime

    existing.status = status || existing.status

    await existing.save()

    return res.status(200).json({
      success: true,

      message: 'Scan type updated successfully',

      data: existing,
    })
  } catch (error) {
    console.error('UPDATE SCAN TYPE ERROR:', error)

    return res.status(500).json({
      success: false,

      message: 'Failed to update scan type',

      error: error.message,
    })
  }
}

//======================================================
// DELETE SCAN TYPE (SOFT DELETE)
//======================================================

export const deleteScanType = async (req, res) => {
  try {
    const { id } = req.params

    const scanType = await ScanType.findById(id)

    if (!scanType || scanType.isDeleted) {
      return res.status(404).json({
        success: false,

        message: 'Scan type not found',
      })
    }

    /**
     * SOFT DELETE
     */

    scanType.isDeleted = true

    await scanType.save()

    return res.status(200).json({
      success: true,

      message: 'Scan type deleted successfully',
    })
  } catch (error) {
    console.error('DELETE SCAN TYPE ERROR:', error)

    return res.status(500).json({
      success: false,

      message: 'Failed to delete scan type',

      error: error.message,
    })
  }
}
