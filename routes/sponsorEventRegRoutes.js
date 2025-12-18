import express from "express";
import { 
  checkEmailExists,
  sponsorRegisterForEvent,
  getAllRegistrationsByEvent,
  getSponsorQuotaSummary,
  updateSponsorEventRegistration,

 } from "../controllers/sponsorEventRegController.js";
import { protectSponsor } from "../middlewares/sponsorAuthMiddleware.js";

const router = express.Router();

/*
==============================================================
  1. CHECK EMAIL EXISTS FOR EVENT REGISTRATION (Protected)
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
*/
router.get(
  "/sponsor/event/:eventId/quota-summary",
  protectSponsor,
  getSponsorQuotaSummary
);

/*
==============================================================
  5. UPDATE SPONSOR EVENT REGISTRATION (Protected)
==============================================================
*/
router.put(
  "/sponsor/event/:eventId/registration/:registrationId",
  protectSponsor,
  updateSponsorEventRegistration
);


export default router;
