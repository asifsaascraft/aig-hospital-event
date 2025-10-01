// config/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // v6+ no need for useNewUrlParser or useUnifiedTopology
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
