// routes/eventRegistrationRoutes.js
import express from "express";
import {
  getPrefilledRegistrationForm,
  registerForEvent,
  getMyRegistrations,
  getRegistrationById,
  getAllRegistrationsByEvent,
  updateRegistrationSuspension,
  updateRegistrationCardProfile,
  getCardProfileUpdatedRegistrations,
  registerForEventByEventAdmin,
  checkEmailRegister,
  bulkRegisterForEventByEventAdmin,
  onSpotRegisterForEventByEventAdmin,
  getMyEventAdminRegistrations,
  getAllSpotRegistrationsByEvent,
  updateEventRegistration,
  getEventVisitorsNotRegistered,
  sendReminderEmails,
  sendReminderEmailToSingleUser,
} from "../controllers/eventRegistrationController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";
import { eventUpload } from "../middlewares/eventUploadMiddleware.js";


const router = express.Router();


// 1 Get Prefilled Registration Form (User)
router.get(
  "/events/:eventId/prefilled",
  protect,
  authorizeRoles("user"),
  getPrefilledRegistrationForm
);

// 2 Register User for an Event (eventId in URL, not body)
router.post(
  "/events/:eventId/register",
  protect,
  authorizeRoles("user"),
  eventUpload(),
  registerForEvent
);

// 3 Get All Registrations of Logged-in User
router.get(
  "/my/registrations",
  protect,
  authorizeRoles("user"),
  getMyRegistrations
);

// 4 Get a registration by ID
router.get(
  "/registrations/:registrationId",
  protect,
  authorizeRoles("user"),
  getRegistrationById
);

// 5 Get All Paid Registrations for an Event (Event Admin)
router.get(
  "/event-admin/events/:eventId/registrations",
  protect,
  authorizeRoles("eventAdmin"),
  getAllRegistrationsByEvent
);
// 6 Get All User who's not registered for an Event (Event Admin)
router.get(
  "/event-admin/events/:eventId/visitors",
  protect,
  authorizeRoles("eventAdmin"),
  getEventVisitorsNotRegistered
);

// 7 Update Registration Suspension Status (Event Admin)
router.patch(
  "/event-admin/registrations/:registrationId/suspension",
  protect,
  authorizeRoles("eventAdmin"),
  updateRegistrationSuspension
);

// 8 Event Admin only :- Register User for an Event (eventId in URL, not body)
router.post(
  "/event-admin/events/:eventId/register",
  protect,
  authorizeRoles("eventAdmin"),
  eventUpload(),
  registerForEventByEventAdmin
);

// =====================================
//  9. CHECK EMAIL EXISTS FOR EVENT REGISTRATION (Protected) (for bulk registration)
// =====================================
router.post(
  "/event-admin/events/:eventId/check-email-exist",
  protect,
  authorizeRoles("eventAdmin"),
  checkEmailRegister
);

// ======================================
//  10. ADD EVENT REGISTRATION (Protected) (Bulk registration)
// ======================================
router.post(
  "/event-admin/events/:eventId/bulk-register",
  protect,
  authorizeRoles("eventAdmin"),
  bulkRegisterForEventByEventAdmin
);

// ======================================
//  11. ADD EVENT REGISTRATION (Protected) (On-Spot registration)
// ======================================
router.post(
  "/event-admin/events/:eventId/spot-register",
  protect,
  authorizeRoles("eventAdmin"),
  onSpotRegisterForEventByEventAdmin
);

// =====================================
//  12. Get Registrations (Only registrations created by logged-in eventAdmin)
// =====================================
router.get(
  "/event-admin/events/:eventId/my-registrations",
  protect,
  authorizeRoles("eventAdmin"),
  getMyEventAdminRegistrations
);

// Get All Spot Registrations for an Event (Event Admin)
router.get(
  "/event-admin/events/:eventId/spot-registrations",
  protect,
  authorizeRoles("eventAdmin"),
  getAllSpotRegistrationsByEvent
);

// =====================================
//  13. Update Registration (Only registrations created by logged-in eventAdmin)
// =====================================
router.put(
  '/event-admin/registrations/:registrationId',
  protect,
  authorizeRoles('eventAdmin'),
  eventUpload(),
  updateEventRegistration,
)

// =====================================
//  14. Update Registration Card Profile
// =====================================
router.put(
  "/event-admin/events/:eventId/update-card-profile",
  protect,
  authorizeRoles("eventAdmin"),
  updateRegistrationCardProfile
);

// =====================================
//  15. Get All Card Profile Updated Registrations
// =====================================
router.get(
  "/event-admin/events/:eventId/updated-card-profile",
  protect,
  authorizeRoles("eventAdmin"),
  getCardProfileUpdatedRegistrations
);

// =====================================
//  16. Send reminder email
// =====================================
router.post(
  "/event-admin/events/:eventId/send-reminders",
  protect,
  authorizeRoles("eventAdmin"),
  sendReminderEmails
);

 // =====================================
 //  17. Send reminder email to single user
 // =====================================
router.post(
  "/event-admin/events/:eventId/send-reminder",
  protect,
  authorizeRoles("eventAdmin"),
  sendReminderEmailToSingleUser
);

export default router;
