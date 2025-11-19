// middlewares/exhibitorAuthMiddleware.js
import jwt from "jsonwebtoken";
import Exhibitor from "../models/Exhibitor.js";

// 🔐 Protect routes for Exhibitor
export const protectExhibitor = async (req, res, next) => {
  let token;

  try {
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res
        .status(401)
        .json({ message: "Not authorized, no token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const exhibitor = await Exhibitor.findById(decoded.id).select("-password");
    if (!exhibitor) {
      return res.status(401).json({ message: "Exhibitor not found" });
    }

    req.exhibitor = exhibitor;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
