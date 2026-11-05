
import express from "express";

import {
  appLoginUser,
  appRefreshToken,
} from "../controllers/appAuthController.js";

const router = express.Router();

router.post("/login", appLoginUser);

router.post("/refresh-token", appRefreshToken);

export default router;
