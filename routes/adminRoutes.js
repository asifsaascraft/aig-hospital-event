import express from "express";
import { registerAdmin, loginAdmin } from "../controllers/adminController.js";

const router = express.Router();

// POST /api/admin/register → create admin via Postman only
router.post("/register", registerAdmin);

// POST /api/admin/login → login admin
router.post("/login", loginAdmin);

export default router;
