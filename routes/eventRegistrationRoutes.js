// routes/eventRegistrationRoutes.js
import express from "express";
import {
  getPrefilledRegistrationForm,
  registerForEvent,
  getMyRegistrations,
  getRegistrationById,
  getAllRegistrationsByEvent,
  updateRegistrationSuspension,
  registerForEventByEventAdmin,
  checkEmailRegister,
  bulkRegisterForEventByEventAdmin,
  getMyEventAdminRegistrations,
  updateEventRegistration,
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

// 6 Update Registration Suspension Status (Event Admin)
router.patch(
  "/event-admin/registrations/:registrationId/suspension",
  protect,
  authorizeRoles("eventAdmin"),
  updateRegistrationSuspension
);

// 7 Event Admin only :- Register User for an Event (eventId in URL, not body)
router.post(
  "/event-admin/events/:eventId/register",
  protect,
  authorizeRoles("eventAdmin"),
  eventUpload(),
  registerForEventByEventAdmin
);

// =====================================
//  8. CHECK EMAIL EXISTS FOR EVENT REGISTRATION (Protected) (for bulk registration)
// =====================================
router.post(
  "/event-admin/events/:eventId/check-email-exist",
  protect,
  authorizeRoles("eventAdmin"),
  checkEmailRegister
);

// ======================================
//  9. ADD EVENT REGISTRATION (Protected) (Bulk registration)
// ======================================
router.post(
  "/event-admin/events/:eventId/bulk-register",
  protect,
  authorizeRoles("eventAdmin"),
  bulkRegisterForEventByEventAdmin
);

// =====================================
//  10. Get Registrations (Only registrations created by logged-in eventAdmin)
// =====================================
router.get(
  "/event-admin/events/:eventId/my-registrations",
  protect,
  authorizeRoles("eventAdmin"),
  getMyEventAdminRegistrations
);

// =====================================
//  11. Update Registration (Only registrations created by logged-in eventAdmin)
// =====================================
router.put(
  "/event-admin/registrations/:registrationId",
  protect,
  authorizeRoles("eventAdmin"),
  updateEventRegistration
);

export default router;
