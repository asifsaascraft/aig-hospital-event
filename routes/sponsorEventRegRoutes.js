import express from "express";
import { 
  checkEmailExists,
  sponsorRegisterForEvent,
  getAllRegistrationsByEvent,
  getSponsorQuotaSummary,

 } from "../controllers/sponsorEventRegController.js";
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
  2. ADD SPONSOR EVENT REGISTRATION (Protected)
==============================================================
  @route   POST /api/sponsor/event/:eventId/register
  @access  Protected (Sponsor only)
==============================================================
*/
router.post(
  "/sponsor/event/:eventId/register",
  protectSponsor,
  sponsorRegisterForEvent
);

/*
==============================================================
  3. GET ALL REGISTRATIONS BY EVENT (Protected)
==============================================================
  @route   GET /api/sponsor/event/:eventId/registrations
  @access  Protected (Sponsor only)
==============================================================
*/
router.get(
  "/sponsor/event/:eventId/registrations",
  protectSponsor,
  getAllRegistrationsByEvent
);

/*
==============================================================
  4. GET SPONSOR QUOTA SUMMARY (Protected)
==============================================================
  @route   GET /api/sponsor/event/:eventId/quota-summary
  @access  Protected (Sponsor only)
==============================================================
*/
router.get(
  "/sponsor/event/:eventId/quota-summary",
  protectSponsor,
  getSponsorQuotaSummary
);


export default router;
