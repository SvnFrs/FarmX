import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Subscription from "../models/Subscription";
import { authenticate, AuthRequest } from "../middleware/auth";
import {
  loginValidation,
  registerValidation,
  updateProfileValidation,
} from "../middleware/validation";
import { validationResult } from "express-validator";

const router = Router();

/**
 * POST /auth/login
 * Login with username and password
 */
router.post(
  "/login",
  loginValidation,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { username, password } = req.body;

      const user = await User.findOne({ username: username.toLowerCase() });
      if (!user) {
        res.status(401).json({ message: "Invalid username or password" });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        res.status(401).json({ message: "Invalid username or password" });
        return;
      }

      const jwtSecret = process.env.JWT_SECRET || "changeme_dev_secret";
      const refreshSecret = process.env.JWT_REFRESH_SECRET || jwtSecret + "_refresh";

      const token = jwt.sign({ userId: user._id.toString() }, jwtSecret, {
        expiresIn: "7d",
      });

      const refreshToken = jwt.sign(
        { userId: user._id.toString() },
        refreshSecret,
        {
          expiresIn: "30d",
        }
      );

      // Save refresh token to user
      user.refreshToken = refreshToken;
      await user.save();

      res.json({
        success: true,
        token,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          subLevel: user.subLevel,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /auth/autologin
 * Auto-login with default user (for development/testing)
 */
router.get("/autologin", async (req: Request, res: Response): Promise<void> => {
  try {
    const username = process.env.DEFAULT_USER_USERNAME || "user";
    const user = await User.findOne({ username });

    if (!user) {
      res
        .status(500)
        .json({ message: "Default user not found. Please seed database." });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || "changeme_dev_secret";
    const token = jwt.sign({ userId: user._id.toString() }, jwtSecret, {
      expiresIn: "30d",
    });

    res.json({
      success: true,
      token,
      message: "Auto-login successful",
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        subLevel: user.subLevel,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: String(error) });
  }
});

/**
 * POST /auth/register
 * Register a new user
 */
router.post(
  "/register",
  registerValidation,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { username, password, email, fullName, phone } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        username: username.toLowerCase(),
      });
      if (existingUser) {
        res.status(400).json({ message: "Username already exists" });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        username: username.toLowerCase(),
        password: hashedPassword,
        email: email?.toLowerCase(),
        fullName,
        phone,
        role: "user",
        subLevel: 0,
      });

      // Create free subscription
      const subscription = await Subscription.create({
        user: user._id,
        plan: "free",
        status: "active",
        price: 0,
        currency: "USD",
      });

      // Update user with subscription
      user.subscription = subscription._id;
      await user.save();

      const jwtSecret = process.env.JWT_SECRET || "changeme_dev_secret";
      const refreshSecret = process.env.JWT_REFRESH_SECRET || jwtSecret + "_refresh";

      const token = jwt.sign({ userId: user._id.toString() }, jwtSecret, {
        expiresIn: "7d",
      });

      const refreshToken = jwt.sign(
        { userId: user._id.toString() },
        refreshSecret,
        {
          expiresIn: "30d",
        }
      );

      user.refreshToken = refreshToken;
      await user.save();

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        token,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          subLevel: user.subLevel,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * POST /auth/logout
 * Logout user (invalidate refresh token)
 */
router.post(
  "/logout",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      // Clear refresh token
      await User.findByIdAndUpdate(req.userId, { refreshToken: null });

      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * POST /auth/refresh-token
 * Refresh access token using refresh token
 */
router.post(
  "/refresh-token",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ message: "Refresh token is required" });
        return;
      }

      const jwtSecret = process.env.JWT_SECRET || "changeme_dev_secret";
      const refreshSecret = process.env.JWT_REFRESH_SECRET || jwtSecret + "_refresh";

      try {
        const decoded = jwt.verify(refreshToken, refreshSecret) as {
          userId: string;
        };

        const user = await User.findById(decoded.userId);

        if (!user || user.refreshToken !== refreshToken) {
          res.status(401).json({ message: "Invalid refresh token" });
          return;
        }

        // Generate new access token
        const newToken = jwt.sign({ userId: user._id.toString() }, jwtSecret, {
          expiresIn: "7d",
        });

        res.json({
          success: true,
          token: newToken,
        });
      } catch (error) {
        res.status(401).json({ message: "Invalid or expired refresh token" });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /auth/profile
 * Get current user profile
 */
router.get(
  "/profile",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const user = await User.findById(req.userId)
        .populate("subscription")
        .select("-password -refreshToken");

      res.json({
        success: true,
        user: {
          id: user?._id,
          username: user?.username,
          email: user?.email,
          fullName: user?.fullName,
          phone: user?.phone,
          role: user?.role,
          subLevel: user?.subLevel,
          subscription: user?.subscription,
          ownedProducts: user?.ownedProducts || [],
          createdAt: user?.createdAt,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * PUT /auth/profile
 * Update user profile
 */
router.put(
  "/profile",
  authenticate,
  updateProfileValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const { email, fullName, phone } = req.body;

      const updateData: any = {};
      if (email !== undefined) updateData.email = email.toLowerCase();
      if (fullName !== undefined) updateData.fullName = fullName;
      if (phone !== undefined) updateData.phone = phone;

      const user = await User.findByIdAndUpdate(
        req.userId,
        updateData,
        { new: true }
      )
        .populate("subscription")
        .select("-password -refreshToken");

      res.json({
        success: true,
        message: "Profile updated successfully",
        user: {
          id: user?._id,
          username: user?.username,
          email: user?.email,
          fullName: user?.fullName,
          phone: user?.phone,
          role: user?.role,
          subLevel: user?.subLevel,
          subscription: user?.subscription,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /auth/me
 * Get current user information (alias for /profile)
 */
router.get(
  "/me",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const user = await User.findById(req.userId)
        .populate("subscription")
        .select("-password -refreshToken");

      res.json({
        success: true,
        user: {
          id: user?._id,
          username: user?.username,
          email: user?.email,
          fullName: user?.fullName,
          phone: user?.phone,
          role: user?.role,
          subLevel: user?.subLevel,
          subscription: user?.subscription,
          ownedProducts: user?.ownedProducts || [],
          createdAt: user?.createdAt,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

export default router;
