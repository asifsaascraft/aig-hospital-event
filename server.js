// Configure DNS first
import "./config/dns.js";

import dotenv from "dotenv";
dotenv.config();

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import multer from "multer";

import connectDB from "./config/db.js";

// Routes
import accompanyRoutes from "./routes/accompanyRoutes.js";
import addRoomRoutes from "./routes/addRoomRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import allExpenseRoutes from "./routes/allExpenseRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import appAuthRoutes from "./routes/appAuthRoutes.js";
import appFeedbackResponseRoutes from "./routes/appFeedbackResponseRoutes.js";
import appFeedbackRoutes from "./routes/appFeedbackRoutes.js";
import appOrganizerRoutes from "./routes/appOrganizerRoutes.js";
import appOrganizerTypeRoutes from "./routes/appOrganizerTypeRoutes.js";
import appPollRoutes from "./routes/appPollRoutes.js";
import appQuizRoutes from "./routes/appQuizRoutes.js";
import appSessionCommentRoutes from "./routes/appSessionCommentRoutes.js";
import appSessionRoutes from "./routes/appSessionRoutes.js";
import appVenueRoutes from "./routes/appVenueRoutes.js";
import assignAccomodationServiceRoutes from "./routes/assignAccomodationServiceRoutes.js";
import assignBoothToSponsorRoutes from "./routes/assignBoothToSponsorRoutes.js";
import assignTravelRoutes from "./routes/assignTravelRoutes.js";
import assignTravelServiceRoutes from "./routes/assignTravelServiceRoutes.js";
import badgeProfilePrivilegeRoutes from "./routes/badgeProfilePrivilegeRoutes.js";
import banquetRegistrationRoutes from "./routes/banquetRegistrationRoutes.js";
import banquetRoutes from "./routes/banquetRoutes.js";
import cardProfileRoutes from "./routes/cardProfileRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import createUserRoutes from "./routes/createUserRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import discountCodeRoutes from "./routes/discountCodeRoutes.js";
import downloadRoutes from "./routes/downloadRoutes.js";
import dynamicRegFormRoutes from "./routes/dynamicRegFormRoutes.js";
import eventAdminRoutes from "./routes/eventAdminRoutes.js";
import eventAdminSummaryRoutes from "./routes/eventAdminSummaryRoutes.js";
import eventAssignRoutes from "./routes/eventAssignRoutes.js";
import eventGroupRoutes from "./routes/eventGroupRoutes.js";
import eventInfoRoutes from "./routes/eventInfoRoutes.js";
import eventRegistrationRoutes from "./routes/eventRegistrationRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import exhibitorRoutes from "./routes/exhibitorRoutes.js";
import exhibitorTypeRoutes from "./routes/exhibitorTypeRoutes.js";
import expenseCategoryRoutes from "./routes/expenseCategoryRoutes.js";
import expenseHeadRoutes from "./routes/expenseHeadRoutes.js";
import expenseRecordRoutes from "./routes/expenseRecordRoutes.js";
import facultyCategoryRoutes from "./routes/facultyCategoryRoutes.js";
import hotelRoutes from "./routes/hotelRoutes.js";
import incomeRecordRoutes from "./routes/incomeRecordRoutes.js";
import incomeRoutes from "./routes/incomeRoutes.js";
import loginGenerateTokenRoutes from "./routes/loginGenerateTokenRoutes.js";
import marketingTeamRoutes from "./routes/marketingTeamRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import onsiteAuthRoutes from "./routes/onsiteAuthRoutes.js";
import onsiteBadgeRoutes from "./routes/onsiteBadgeRoutes.js";
import onsiteScanRoutes from "./routes/onsiteScanRoutes.js";
import organizerRoutes from "./routes/organizerRoutes.js";
import otherTeamRoutes from "./routes/otherTeamRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import pollResponseRoutes from "./routes/pollResponseRoutes.js";
import pollRoutes from "./routes/pollRoutes.js";
import quickLinkRoutes from "./routes/quickLinkRoutes.js";
import registrationSettingRoutes from "./routes/registrationSettingRoutes.js";
import registrationSlabRoutes from "./routes/registrationSlabRoutes.js";
import roomCategoryRoutes from "./routes/roomCategoryRoutes.js";
import scanTypeRoutes from "./routes/scanTypeRoutes.js";
import sessionHallRoutes from "./routes/sessionHallRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import sessionTrackRoutes from "./routes/sessionTrackRoutes.js";
import speakerRoutes from "./routes/speakerRoutes.js";
import speakerTypeRoutes from "./routes/speakerTypeRoutes.js";
import sponsorAccomodationQuotaRoutes from "./routes/sponsorAccomodationQuotaRoutes.js";
import sponsorAccomodationRoutes from "./routes/sponsorAccomodationRoutes.js";
import sponsorAuthRoutes from "./routes/sponsorAuthRoutes.js";
import sponsorBoothRoutes from "./routes/sponsorBoothRoutes.js";
import sponsorCategoryRoutes from "./routes/sponsorCategoryRoutes.js";
import sponsorEventRegRoutes from "./routes/sponsorEventRegRoutes.js";
import sponsorHallRoutes from "./routes/sponsorHallRoutes.js";
import sponsorQuotaRoutes from "./routes/sponsorQuotaRoutes.js";
import sponsorRegistrationQuotaRoutes from "./routes/sponsorRegistrationQuotaRoutes.js";
import sponsorRoutes from "./routes/sponsorRoutes.js";
import sponsorTravelQuotaRoutes from "./routes/sponsorTravelQuotaRoutes.js";
import sponsorTravelRoutes from "./routes/sponsorTravelRoutes.js";
import sponsorWorkshopQuotaRoutes from "./routes/sponsorWorkshopQuotaRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import supportAdminRoutes from "./routes/supportAdminRoutes.js";
import supportTicketRoutes from "./routes/supportTicketRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import termsAndConditionRoutes from "./routes/termsAndConditionRoutes.js";
import topicRoutes from "./routes/topicRoutes.js";
import travelAgentRoutes from "./routes/travelAgentRoutes.js";
import travelRoutes from "./routes/travelRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import venueRoutes from "./routes/venueRoutes.js";
import workshopCategoryRoutes from "./routes/workshopCategoryRoutes.js";
import workshopRegistrationRoutes from "./routes/workshopRegistrationRoutes.js";
import workshopRoutes from "./routes/workshopRoutes.js";

await connectDB();

const app = express();

// =======================
// CORS setup for multiple frontends
// =======================
const allowedOrigins = [
  "http://localhost:3000",
  process.env.ADMIN_FRONTEND_URL,
  process.env.EVENT_ADMIN_FRONTEND_URL,
  process.env.USER_FRONTEND_URL,
  process.env.SPONSOR_FRONTEND_URL,
];

const corsOptions = {
  origin: (origin, callback) => {
    // allow any origin (including browser requests)
    callback(null, true);
  },
  credentials: true,
};

app.use(
  express.json({
    verify: (req, res, buf) => {
      if (req.originalUrl === "/api/payments/webhook") {
        req.rawBody = buf;
      }
    },
  }),
);

app.use(cors(corsOptions));
app.use(cookieParser()); // Needed to read cookies (refresh token)
app.use(morgan("dev"));

// =======================
// Health check
// =======================
app.get("/", (req, res) => {
  res.send("AIG Hospital Event Backend by SaaScraft Studio (India) Pvt. Ltd.");
});


// =======================
// API Routes
// =======================
app.use("/api", accompanyRoutes);
app.use("/api", addRoomRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", allExpenseRoutes);
app.use("/api", announcementRoutes);
app.use("/api/users/app", appAuthRoutes);
app.use("/api", appFeedbackResponseRoutes);
app.use("/api", appFeedbackRoutes);
app.use("/api", appOrganizerRoutes);
app.use("/api", appOrganizerTypeRoutes);
app.use("/api", appPollRoutes);
app.use("/api", appQuizRoutes);
app.use("/api", appSessionCommentRoutes);
app.use("/api", appSessionRoutes);
app.use("/api", appVenueRoutes);
app.use("/api/onsite", onsiteAuthRoutes);
app.use("/api/sponsors", sponsorAuthRoutes);
app.use("/api", assignAccomodationServiceRoutes);
app.use("/api", assignBoothToSponsorRoutes);
app.use("/api", assignTravelRoutes);
app.use("/api", assignTravelServiceRoutes);
app.use("/api", badgeProfilePrivilegeRoutes);
app.use("/api", banquetRegistrationRoutes);
app.use("/api", banquetRoutes);
app.use("/api", cardProfileRoutes);
app.use("/api", contactRoutes);
app.use("/api", createUserRoutes);
app.use("/api", departmentRoutes);
app.use("/api", discountCodeRoutes);
app.use("/api", downloadRoutes);
app.use("/api", dynamicRegFormRoutes);
app.use("/api/event-admin", eventAdminRoutes);
app.use("/api", eventAdminSummaryRoutes);
app.use("/api", eventAssignRoutes);
app.use("/api", eventGroupRoutes);
app.use("/api", eventInfoRoutes);
app.use("/api", eventRegistrationRoutes);
app.use("/api", eventRoutes);
app.use("/api", exhibitorRoutes);
app.use("/api", exhibitorTypeRoutes);
app.use("/api", expenseCategoryRoutes);
app.use("/api", expenseHeadRoutes);
app.use("/api", expenseRecordRoutes);
app.use("/api", facultyCategoryRoutes);
app.use("/api", hotelRoutes);
app.use("/api", incomeRecordRoutes);
app.use("/api", incomeRoutes);
app.use("/api", loginGenerateTokenRoutes);
app.use("/api", marketingTeamRoutes);
app.use("/api", noteRoutes);
app.use("/api", onsiteBadgeRoutes);
app.use("/api", onsiteScanRoutes);
app.use("/api", organizerRoutes);
app.use("/api", otherTeamRoutes);
app.use("/api", paymentRoutes);
app.use("/api", pollResponseRoutes);
app.use("/api", pollRoutes);
app.use("/api", quickLinkRoutes);
app.use("/api", registrationSettingRoutes);
app.use("/api", registrationSlabRoutes);
app.use("/api", roomCategoryRoutes);
app.use("/api", scanTypeRoutes);
app.use("/api", sessionHallRoutes);
app.use("/api", sessionRoutes);
app.use("/api", sessionTrackRoutes);
app.use("/api", speakerRoutes);
app.use("/api", speakerTypeRoutes);
app.use("/api", sponsorAccomodationQuotaRoutes);
app.use("/api", sponsorAccomodationRoutes);
app.use("/api", sponsorBoothRoutes);
app.use("/api", sponsorCategoryRoutes);
app.use("/api", sponsorEventRegRoutes);
app.use("/api", sponsorHallRoutes);
app.use("/api", sponsorQuotaRoutes);
app.use("/api", sponsorRegistrationQuotaRoutes);
app.use("/api", sponsorRoutes);
app.use("/api", sponsorTravelQuotaRoutes);
app.use("/api", sponsorTravelRoutes);
app.use("/api", sponsorWorkshopQuotaRoutes);
app.use("/api", supplierRoutes);
app.use("/api/support-admin", supportAdminRoutes);
app.use("/api", supportTicketRoutes);
app.use("/api", teamRoutes);
app.use("/api", termsAndConditionRoutes);
app.use("/api", topicRoutes);
app.use("/api", travelAgentRoutes);
app.use("/api", travelRoutes);
app.use("/api/users", userRoutes);
app.use("/api", venueRoutes);
app.use("/api", workshopCategoryRoutes);
app.use("/api", workshopRegistrationRoutes);
app.use("/api", workshopRoutes);

// =======================
// Multer & File Upload Error Handler
// =======================
app.use((err, req, res, next) => {
  // Multer file size error
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size must be less than 10MB.",
      });
    }
  }

  // Custom file filter errors (PDF validation etc.)
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "File upload error.",
    });
  }

  next();
});


// =======================
// Start server
// =======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
