import express from "express";

import {
  createDownload,
  getDownloadsByEvent,
  getDownloadById,
  updateDownload,
  deleteDownload,
} from "../controllers/downloadController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

import {
  uploadDownloadFile,
} from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// EventAdmin: Create Download
router.post(
  "/event-admin/events/:eventId/downloads",
  protect,
  authorizeRoles("eventAdmin"),
  uploadDownloadFile.single("uploadFile"),
  createDownload
);

// Public/User: Get All Downloads
router.get(
  "/events/:eventId/downloads",
  getDownloadsByEvent
);

// Public/User: Get Download By Id
router.get(
  "/downloads/:id",
  getDownloadById
);

// EventAdmin: Update Download
router.put(
  "/event-admin/downloads/:id",
  protect,
  authorizeRoles("eventAdmin"),
  uploadDownloadFile.single("uploadFile"),
  updateDownload
);

// EventAdmin: Delete Download
router.delete(
  "/event-admin/downloads/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteDownload
);

export default router;