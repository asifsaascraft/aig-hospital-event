import express from "express";
import { submitAbstract } from "../controllers/abstractSubmitController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";
import { uploadAbstractPDF } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

/* =======================
   User: Submit Abstract
======================= */
router.post(
  "/events/:eventId/abstract-submit",
  protect,
  authorizeRoles("user"),
  uploadAbstractPDF.single("uploadFile"), 
  submitAbstract
);

export default router;
