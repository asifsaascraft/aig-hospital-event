import express from "express";
import {
  createAddRoom,
  getAddRoomsByEvent,
  getAddRoomById,
  updateAddRoom,
  deleteAddRoom,
} from "../controllers/addRoomController.js";

import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =======================
// GET (logged-in users)
// =======================
router.get(
  "/events/:eventId/add-rooms",
  protect,
  getAddRoomsByEvent
);

router.get(
  "/add-rooms/:id",
  protect,
  getAddRoomById
);


// =======================
// ADMIN (eventAdmin only)
// =======================
router.post(
  "/events/:eventId/add-rooms",
  protect,
  authorizeRoles("eventAdmin"),
  createAddRoom
);

router.put(
  "/add-rooms/:id",
  protect,
  authorizeRoles("eventAdmin"),
  updateAddRoom
);

router.delete(
  "/add-rooms/:id",
  protect,
  authorizeRoles("eventAdmin"),
  deleteAddRoom
);

export default router;