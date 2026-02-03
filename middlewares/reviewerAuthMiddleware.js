// middlewares/reviewerAuthMiddleware.js
import jwt from "jsonwebtoken";
import Reviewer from "../models/Reviewer.js";

export const protectReviewer = async (req, res, next) => {
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

    const reviewer = await Reviewer.findById(decoded.id).select("-password");
    if (!reviewer) {
      return res.status(401).json({ message: "Reviewer not found" });
    }

    req.reviewer = reviewer;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
