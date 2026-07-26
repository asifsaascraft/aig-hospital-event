import express from "express";
import cookieParser from "cookie-parser";

import {
  registerSupportAdmin,
  loginSupportAdmin,
  refreshSupportAdminAccessToken,
  logoutSupportAdmin,
} from "../controllers/supportAdminController.js";

import {
  protect,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(cookieParser());

// Register
router.post("/register", registerSupportAdmin);

// Login
router.post("/login", loginSupportAdmin);

// Refresh Token
router.get(
  "/refresh-token",
  refreshSupportAdminAccessToken
);

// Logout
router.post(
  "/logout",
  protect,
  authorizeRoles("supportAdmin"),
  logoutSupportAdmin
);


export default router;