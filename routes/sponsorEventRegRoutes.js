import express from "express";
import { checkEmailExists } from "../controllers/sponsorEventRegController.js";
import { protectSponsor } from "../middlewares/sponsorAuthMiddleware.js";

const router = express.Router();

/*
==============================================================
  1. CHECK EMAIL EXISTS FOR EVENT REGISTRATION (Protected)
==============================================================
  @route   POST /api/sponsor/event/:eventId/check-email
  @access  Protected (Sponsor only)
==============================================================
*/
router.post(
  "/sponsor/event/:eventId/check-email", 
  protectSponsor, 
  checkEmailExists
);

/*
==============================================================
  2. (Future) ADD SPONSOR EVENT REGISTRATION (Protected)
==============================================================
  @route   POST /api/sponsor/event/:eventId/register
  @access  Protected (Sponsor only)
==============================================================
*/
// router.post("/event/:eventId/register", protectSponsor, registerSponsorForEvent);

/*
==============================================================
  3. (Future) GET SPONSOR'S EVENT REGISTRATIONS (Protected)
==============================================================
  @route   GET /api/sponsor/event/my-registrations
  @access  Protected (Sponsor only)
==============================================================
*/
// router.get("/event/my-registrations", protectSponsor, getMyEventRegistrations);

export default router;
