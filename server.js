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

connectDB();

const app = express();

// =======================
// CORS setup for multiple frontends
// =======================
const allowedOrigins = [
  "http://localhost:3000",
  process.env.ADMIN_FRONTEND_URL,
  process.env.EVENT_ADMIN_FRONTEND_URL,
];

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like Postman or server-to-server)
    if (!origin) return callback(null, true);

    // check if origin exists in allowedOrigins
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Blocked CORS request from:", origin); // debug log
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true,
};


app.use(express.json());
app.use(cors({ origin: "*", credentials: true }));
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
// =======================
// Start server
// =======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
