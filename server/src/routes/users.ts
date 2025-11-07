import { Router, Response } from "express";
import User from "../models/User";
import { authenticate, AuthRequest, isAdmin } from "../middleware/auth";
import {
  updateSubscriptionValidation,
  mongoIdValidation,
} from "../middleware/validation";
import { validationResult, body } from "express-validator";

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * GET /users/:id
 * Get user information (own profile or admin)
 */
router.get(
  "/:id",
  mongoIdValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;

      // Users can only view their own profile unless they're admin
      if (id !== req.userId && req.user?.role !== "admin") {
        res.status(403).json({ message: "Access denied" });
        return;
      }

      const { isActive } = req.query;
      const query: any = { _id: id };
      if (isActive !== undefined) {
        query.isActive = isActive !== "false";
      }

      const user = await User.findOne(query)
        .select("-password")
        .populate("ownedProducts");

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * POST /users/:id/subscription
 * Update user subscription level
 */
router.post(
  "/:id/subscription",
  mongoIdValidation,
  updateSubscriptionValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const { subLevel } = req.body;

      // Users can only update their own subscription or admin can update any
      if (id !== req.userId && req.user?.role !== "admin") {
        res.status(403).json({ message: "Access denied" });
        return;
      }

      const user = await User.findOneAndUpdate(
        { _id: id, isActive: true },
        { subLevel },
        { new: true, runValidators: true }
      ).select("-password");

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.json({
        success: true,
        message: "Subscription level updated",
        user,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /users
 * Get all users (admin only) with search and filtering
 */
router.get(
  "/",
  isAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const { isActive, role, search, subLevel } = req.query;
      const query: any = { isActive: isActive !== "false" };

      // Filter by role
      if (role) {
        if (["user", "admin", "expert"].includes(role as string)) {
          query.role = role;
        }
      }

      // Filter by subscription level
      if (subLevel !== undefined) {
        query.subLevel = parseInt(subLevel as string);
      }

      // Search by username, email, or fullName
      if (search) {
        const searchRegex = new RegExp(search as string, "i");
        query.$or = [
          { username: searchRegex },
          { email: searchRegex },
          { fullName: searchRegex },
        ];
      }

      const users = await User.find(query)
        .select("-password -refreshToken")
        .populate("subscription")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(query);

      res.json({
        success: true,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        users,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * PUT /users/:id
 * Update user information (own profile or admin)
 */
router.put(
  "/:id",
  mongoIdValidation,
  [
    body("email")
      .optional()
      .isEmail()
      .withMessage("Invalid email format"),
    body("fullName")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Full name must not exceed 100 characters"),
    body("phone")
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage("Phone must not exceed 20 characters"),
    body("role")
      .optional()
      .isIn(["user", "admin", "expert"])
      .withMessage("Invalid role"),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const { email, fullName, phone, role } = req.body;

      // Users can only update their own profile unless they're admin
      if (id !== req.userId && req.user?.role !== "admin") {
        res.status(403).json({ message: "Access denied" });
        return;
      }

      // Only admin can change role
      if (role && req.user?.role !== "admin") {
        res.status(403).json({ message: "Only admin can change user role" });
        return;
      }

      const updateData: any = {};
      if (email !== undefined) updateData.email = email.toLowerCase();
      if (fullName !== undefined) updateData.fullName = fullName;
      if (phone !== undefined) updateData.phone = phone;
      if (role !== undefined && req.user?.role === "admin")
        updateData.role = role;

      const user = await User.findOneAndUpdate(
        { _id: id, isActive: true },
        updateData,
        {
          new: true,
          runValidators: true,
        }
      )
        .select("-password -refreshToken")
        .populate("subscription")
        .populate("ownedProducts");

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.json({
        success: true,
        message: "User updated successfully",
        user,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * DELETE /users/:id
 * Delete a user (admin only or own account)
 */
router.delete(
  "/:id",
  mongoIdValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;

      // Users can only delete their own account unless they're admin
      if (id !== req.userId && req.user?.role !== "admin") {
        res.status(403).json({ message: "Access denied" });
        return;
      }

      // Prevent admin from deleting themselves
      if (id === req.userId && req.user?.role === "admin") {
        res.status(400).json({
          message: "Admin cannot delete their own account",
        });
        return;
      }

      const user = await User.findOneAndUpdate(
        { _id: id, isActive: true },
        { isActive: false },
        { new: true }
      );

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.json({
        success: true,
        message: "User deleted successfully",
        user,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

export default router;
