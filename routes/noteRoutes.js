import express from "express";
import {
  getNote,
  createNote,
  updateNote,
  deleteNote,
} from "../controllers/noteController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// Get Note (Public))
// =======================
router.get(
  "/note",
  getNote
);

// =======================
// Event Admin Only
// =======================
router.post(
  "/event-admin/note",
  protect,
  authorizeRoles("eventAdmin"),
  createNote
);

router.put(
  "/event-admin/note",
  protect,
  authorizeRoles("eventAdmin"),
  updateNote
);

router.delete(
  "/event-admin/note",
  protect,
  authorizeRoles("eventAdmin"),
  deleteNote
);

export default router;