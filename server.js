import dotenv from "dotenv";
dotenv.config();
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
import announcementRoutes from "./routes/announcementRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js"; 
import organizerRoutes from "./routes/organizerRoutes.js";
import venueRoutes from "./routes/venueRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import hotelRoutes from "./routes/hotelRoutes.js"; 
import supplierRoutes from "./routes/supplierRoutes.js";
import roomCategoryRoutes from "./routes/roomCategoryRoutes.js";
import eventAssignRoutes from "./routes/eventAssignRoutes.js";
import mealPreferenceRoutes from "./routes/mealPreferenceRoutes.js";
import registrationSlabRoutes from "./routes/registrationSlabRoutes.js";
import banquetRoutes from "./routes/banquetRoutes.js";
import accompanyRoutes from "./routes/accompanyRoutes.js";
import workshopCategoryRoutes from "./routes/workshopCategoryRoutes.js";
import workshopRoutes from "./routes/workshopRoutes.js";
import workshopRegistrationRoutes from "./routes/workshopRegistrationRoutes.js";
import termsAndConditionRoutes from "./routes/termsAndConditionRoutes.js";
import discountCodeRoutes from "./routes/discountCodeRoutes.js";
import sponsorHallRoutes from "./routes/sponsorHallRoutes.js";
import sponsorBoothRoutes from "./routes/sponsorBoothRoutes.js";
import sponsorCategoryRoutes from "./routes/sponsorCategoryRoutes.js";
import sponsorRoutes from "./routes/sponsorRoutes.js";
import sponsorRegistrationQuotaRoutes from "./routes/sponsorRegistrationQuotaRoutes.js";
import eventRegistrationRoutes from "./routes/eventRegistrationRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
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
  res.send("AIG Hospital Event Backend is running ..... ");
});

// =======================
// API Routes
// =======================
app.use("/api/admin", adminRoutes);
app.use("/api/event-admin", eventAdminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/sponsors", sponsorAuthRoutes);

app.use("/api", announcementRoutes);
app.use("/api", departmentRoutes);
app.use("/api", organizerRoutes);
app.use("/api", venueRoutes);
app.use("/api", teamRoutes);
app.use("/api", eventRoutes);
app.use("/api", hotelRoutes); 
app.use("/api", supplierRoutes);
app.use("/api", roomCategoryRoutes);
app.use("/api", eventAssignRoutes); 
app.use("/api", mealPreferenceRoutes);
app.use("/api", registrationSlabRoutes);
app.use("/api", banquetRoutes);
app.use("/api", accompanyRoutes);
app.use("/api", workshopCategoryRoutes);
app.use("/api", workshopRoutes);
app.use("/api", workshopRegistrationRoutes);
app.use("/api", termsAndConditionRoutes);
app.use("/api", discountCodeRoutes);
app.use("/api", sponsorHallRoutes);
app.use("/api", sponsorBoothRoutes);
app.use("/api", sponsorCategoryRoutes);
app.use("/api", sponsorRoutes);
app.use("/api", sponsorRegistrationQuotaRoutes);
app.use("/api", eventRegistrationRoutes);
app.use("/api", paymentRoutes);
// =======================
// Start server
// =======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
