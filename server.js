import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoutes.js";

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

//  Health check route (for browser test)
app.get("/", (req, res) => {
  res.send("AIG Hospital Event Backend is running!!!!!!!!!!!!!!!!!!!!!!");
});

// API Routes
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
