import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

// Routes
import adminRoutes from "./routes/adminRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js"; 
import organizerRoutes from "./routes/organizerRoutes.js";
import venueRoutes from "./routes/venueRoutes.js";

dotenv.config();
connectDB();

const app = express();

// =======================
// CORS setup for multiple frontends
// =======================
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",");
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true, // allow cookies
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
app.use("/api", announcementRoutes);
app.use("/api", departmentRoutes);
app.use("/api", organizerRoutes);
app.use("/api", venueRoutes);
// =======================
// Start server
// =======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
