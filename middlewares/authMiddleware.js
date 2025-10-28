import jwt from "jsonwebtoken";
import User from "../models/User.js";

// 🔐 Protect routes with JWT
export const protect = async (req, res, next) => {
  let token;

  try {
    // 1. Get token from Authorization header
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2. Or from cookies
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    // 3. No token found
    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token provided" });
    }

    // 4. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Attach user to request (excluding password)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// 🔐 Role-based authorization (reusable for any role)
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({
        //message: `Access denied. Allowed roles: ${roles.join(", ")}`
      });
    }
    next();
  };
};
