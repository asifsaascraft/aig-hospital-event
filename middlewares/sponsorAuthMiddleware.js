// middlewares/sponsorAuthMiddleware.js
import jwt from "jsonwebtoken";
import Sponsor from "../models/Sponsor.js";

// 🔐 Protect routes for Sponsor
export const protectSponsor = async (req, res, next) => {
  let token;

  try {
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const sponsor = await Sponsor.findById(decoded.id).select("-password");
    if (!sponsor) {
      return res.status(401).json({ message: "Sponsor not found" });
    }

    req.sponsor = sponsor;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
