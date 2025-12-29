import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { findById } from "../models/userModel.js";

dotenv.config();

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // check both decoded.id and decoded.userId
      const userId = decoded.id || decoded.userId;

      const user = await findById(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found or no longer exists" });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Auth Error:", error.message);
      return res.status(401).json({ message: "Not authorized, token invalid or expired" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }
};

// ✅ rename this to match your import
export const admin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: admin only" });
  }
  next();
};
