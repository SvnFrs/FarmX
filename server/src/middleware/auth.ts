import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import logger from "../utils/logger";

export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
  params: any;
  query: any;
  body: any;
  headers: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    // Extract token - handle cases where "Bearer" might be duplicated
    // Split by space and take the last part (the actual token)
    const parts = authHeader.trim().split(/\s+/);
    const token = parts[parts.length - 1];

    if (!token) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || "changeme_dev_secret";

    const decoded = jwt.verify(token, jwtSecret) as { userId: string };

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      res.status(401).json({ message: "Invalid token - user not found" });
      return;
    }

    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (error) {
    logger.error("Authentication error:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const isAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return;
  }

  next();
};
