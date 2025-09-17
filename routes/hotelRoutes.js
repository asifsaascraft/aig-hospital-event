// routes/hotelRoutes.js
import express from "express";
import {
  getHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
} from "../controllers/hotelController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";
import { uploadHotelImage } from "../middlewares/uploadMiddleware.js";


const router = express.Router();

// Public: anyone logged-in can view hotels
router.get("/hotels", protect, getHotels);
router.get("/hotels/:id", protect, getHotelById);

// Admin-only: Create hotel
router.post(
  "/admin/hotels",
  protect,
  authorizeRoles("admin"),
  uploadHotelImage.single("hotelImage"),
  createHotel
);

// Admin-only: Update hotel
router.put(
  "/admin/hotels/:id",
  protect,
  authorizeRoles("admin"),
  uploadHotelImage.single("hotelImage"),
  updateHotel
);

// Admin-only: Delete hotel
router.delete(
  "/admin/hotels/:id",
  protect,
  authorizeRoles("admin"),
  deleteHotel
);

export default router;
