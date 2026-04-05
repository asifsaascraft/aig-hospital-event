// middlewares/protectUniversal.js

import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Sponsor from "../models/Sponsor.js";

export const protectUniversal = async (req, res, next) => {
  let token;

  try {
    // 1. Get token
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ===============================
    // 3. FIRST: Check User
    // ===============================
    const user = await User.findById(decoded.id).select("-password");

    if (user) {
      req.user = user;
      req.authType = "user";
      return next();
    }

    // ===============================
    // 4. SECOND: Check Sponsor
    // ===============================
    const sponsor = await Sponsor.findById(decoded.id).select("-password");

    if (sponsor) {
      req.sponsor = sponsor;
      req.authType = "sponsor";
      return next();
    }

    return res.status(401).json({
      success: false,
      message: "Invalid token user/sponsor not found",
    });

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};