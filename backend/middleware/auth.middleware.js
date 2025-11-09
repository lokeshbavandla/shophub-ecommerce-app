import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import logger from "../lib/logger.js";

// Authentication middleware for protected routes
// Validates JWT tokens from HTTP-only cookies for enhanced security
export const protectRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No access token provided" });
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user;

      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Unauthorized - Access token expired" });
      }
      throw error;
    }
  } catch (error) {
    logger.error({ error: error.message }, "Error in protectRoute middleware");
    return res
      .status(401)
      .json({ message: "Unauthorized - Invalid access token" });
  }
};

// Authorization middleware for admin-only routes
export const adminRoute = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Access denied - Admin only" });
  }
};
