import dotenv from "dotenv";
dotenv.config();
import multer from "multer";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

// Routes
import adminRoutes from "./routes/adminRoutes.js";
import eventAdminRoutes from "./routes/eventAdminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import sponsorAuthRoutes from "./routes/sponsorAuthRoutes.js";
import onsiteAuthRoutes from "./routes/onsiteAuthRoutes.js";

import announcementRoutes from "./routes/announcementRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import eventGroupRoutes from "./routes/eventGroupRoutes.js";
import organizerRoutes from "./routes/organizerRoutes.js";
import marketingTeamRoutes from "./routes/marketingTeamRoutes.js";
import otherTeamRoutes from "./routes/otherTeamRoutes.js";
import venueRoutes from "./routes/venueRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import hotelRoutes from "./routes/hotelRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import addRoomRoutes from "./routes/addRoomRoutes.js";
import eventAssignRoutes from "./routes/eventAssignRoutes.js";
import eventAdminSummaryRoutes from "./routes/eventAdminSummaryRoutes.js";
import dynamicRegFormRoutes from "./routes/dynamicRegFormRoutes.js";
import registrationSlabRoutes from "./routes/registrationSlabRoutes.js";
import banquetRoutes from "./routes/banquetRoutes.js";
import banquetRegistrationRoutes from "./routes/banquetRegistrationRoutes.js";
import accompanyRoutes from "./routes/accompanyRoutes.js";
import workshopCategoryRoutes from "./routes/workshopCategoryRoutes.js";
import workshopRoutes from "./routes/workshopRoutes.js";
import workshopRegistrationRoutes from "./routes/workshopRegistrationRoutes.js";
import termsAndConditionRoutes from "./routes/termsAndConditionRoutes.js";
import createUserRoutes from "./routes/createUserRoutes.js";
import discountCodeRoutes from "./routes/discountCodeRoutes.js";
import registrationSettingRoutes from "./routes/registrationSettingRoutes.js";
import facultyCategoryRoutes from "./routes/facultyCategoryRoutes.js";
import travelAgentRoutes from "./routes/travelAgentRoutes.js";
import travelRoutes from "./routes/travelRoutes.js";
import assignTravelRoutes from "./routes/assignTravelRoutes.js"; 
import sponsorHallRoutes from "./routes/sponsorHallRoutes.js";
import sponsorBoothRoutes from "./routes/sponsorBoothRoutes.js";
import sponsorCategoryRoutes from "./routes/sponsorCategoryRoutes.js";
import sponsorRoutes from "./routes/sponsorRoutes.js";
import assignBoothToSponsorRoutes from "./routes/assignBoothToSponsorRoutes.js";
import sponsorRegistrationQuotaRoutes from "./routes/sponsorRegistrationQuotaRoutes.js";
import sponsorAccomodationQuotaRoutes from "./routes/sponsorAccomodationQuotaRoutes.js";
import sponsorTravelQuotaRoutes from "./routes/sponsorTravelQuotaRoutes.js";
import sponsorWorkshopQuotaRoutes from "./routes/sponsorWorkshopQuotaRoutes.js";
import sponsorTravelRoutes from "./routes/sponsorTravelRoutes.js";
import eventRegistrationRoutes from "./routes/eventRegistrationRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import sponsorEventRegRoutes from "./routes/sponsorEventRegRoutes.js";
import expenseCategoryRoutes from "./routes/expenseCategoryRoutes.js";
import expenseHeadRoutes from "./routes/expenseHeadRoutes.js";
import expenseRecordRoutes from "./routes/expenseRecordRoutes.js";
import allExpenseRoutes from "./routes/allExpenseRoutes.js";
import incomeRecordRoutes from "./routes/incomeRecordRoutes.js";
import incomeRoutes from "./routes/incomeRoutes.js";
import cardProfileRoutes from "./routes/cardProfileRoutes.js";
import assignTravelServiceRoutes from "./routes/assignTravelServiceRoutes.js";
import assignAccomodationServiceRoutes from "./routes/assignAccomodationServiceRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import sponsorAccomodationRoutes from "./routes/sponsorAccomodationRoutes.js";
import scanTypeRoutes from "./routes/scanTypeRoutes.js";
import onsiteBadgeRoutes from "./routes/onsiteBadgeRoutes.js";
import badgeProfilePrivilegeRoutes from './routes/badgeProfilePrivilegeRoutes.js'
import loginGenerateTokenRoutes from "./routes/loginGenerateTokenRoutes.js";
import onsiteScanRoutes from "./routes/onsiteScanRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import committeeTypeRoutes from "./routes/committeeTypeRoutes.js";
import committeeMemberRoutes from "./routes/committeeMemberRoutes.js";
import sessionHallRoutes from "./routes/sessionHallRoutes.js";
import sessionTrackRoutes from "./routes/sessionTrackRoutes.js";
import speakerTypeRoutes from "./routes/speakerTypeRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import speakerRoutes from "./routes/speakerRoutes.js";
import downloadRoutes from "./routes/downloadRoutes.js";


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


app.use(express.json());
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
app.use("/api/admin", adminRoutes);
app.use("/api/event-admin", eventAdminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/sponsors", sponsorAuthRoutes);
app.use("/api/onsite", onsiteAuthRoutes);

app.use("/api", announcementRoutes);
app.use("/api", departmentRoutes);
app.use("/api", eventGroupRoutes);
app.use("/api", organizerRoutes);
app.use("/api", marketingTeamRoutes);
app.use("/api", otherTeamRoutes);
app.use("/api", venueRoutes);
app.use("/api", teamRoutes);
app.use("/api", eventRoutes);
app.use("/api", hotelRoutes);
app.use("/api", supplierRoutes);
app.use("/api", addRoomRoutes);
app.use("/api", eventAssignRoutes);
app.use("/api", eventAdminSummaryRoutes);
app.use("/api", dynamicRegFormRoutes);
app.use("/api", registrationSlabRoutes);
app.use("/api", banquetRoutes);
app.use("/api", banquetRegistrationRoutes);
app.use("/api", accompanyRoutes);
app.use("/api", workshopCategoryRoutes);
app.use("/api", workshopRoutes);
app.use("/api", workshopRegistrationRoutes);
app.use("/api", termsAndConditionRoutes);
app.use("/api", createUserRoutes);
app.use("/api", discountCodeRoutes);
app.use("/api", registrationSettingRoutes);
app.use("/api", facultyCategoryRoutes);
app.use("/api", travelAgentRoutes);
app.use("/api", travelRoutes);
app.use("/api", assignTravelRoutes);
app.use("/api", sponsorHallRoutes);
app.use("/api", sponsorBoothRoutes);
app.use("/api", sponsorCategoryRoutes);
app.use("/api", sponsorRoutes);
app.use("/api", assignBoothToSponsorRoutes);
app.use("/api", sponsorRegistrationQuotaRoutes);
app.use("/api", sponsorAccomodationQuotaRoutes);
app.use("/api", sponsorTravelQuotaRoutes);
app.use("/api", sponsorWorkshopQuotaRoutes);
app.use("/api", sponsorTravelRoutes);
app.use("/api", eventRegistrationRoutes);
app.use("/api", paymentRoutes);
app.use("/api", sponsorEventRegRoutes);
app.use("/api", expenseCategoryRoutes);
app.use("/api", expenseHeadRoutes);
app.use("/api", expenseRecordRoutes);
app.use("/api", allExpenseRoutes);
app.use("/api", incomeRecordRoutes);
app.use("/api", incomeRoutes);
app.use("/api", cardProfileRoutes);
app.use("/api", assignTravelServiceRoutes);
app.use("/api", assignAccomodationServiceRoutes);
app.use("/api", noteRoutes);
app.use("/api", sponsorAccomodationRoutes);
app.use("/api", scanTypeRoutes);
app.use('/api', onsiteBadgeRoutes)
app.use('/api', badgeProfilePrivilegeRoutes)
app.use('/api', loginGenerateTokenRoutes)
app.use('/api', onsiteScanRoutes)
app.use('/api', messageRoutes)
app.use('/api', committeeTypeRoutes)
app.use('/api', committeeMemberRoutes)
app.use('/api', sessionHallRoutes)
app.use('/api', sessionTrackRoutes)
app.use('/api', speakerTypeRoutes)
app.use('/api', sessionRoutes)
app.use('/api', speakerRoutes)
app.use('/api', downloadRoutes)


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
