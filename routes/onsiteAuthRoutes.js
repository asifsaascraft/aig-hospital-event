import express from "express";

import { loginOnsite } from "../controllers/onsiteAuthController.js";

const router = express.Router();

router.post("/login", loginOnsite);

export default router;