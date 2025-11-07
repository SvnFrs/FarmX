import { Router, Response } from "express";
import Support from "../models/Support";
import User from "../models/User";
import Subscription from "../models/Subscription";
import Farm from "../models/Farm";
import Pond from "../models/Pond";
import { authenticate, AuthRequest } from "../middleware/auth";
import { isAdmin } from "../middleware/auth";
import { mongoIdValidation } from "../middleware/validation";
import { validationResult } from "express-validator";

const router = Router();

// All support routes require authentication
router.use(authenticate);

/**
 * POST /api/support/questions
 * Submit a question (Premium feature)
 */
router.post(
  "/questions",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Check if user has premium subscription
      const subscription = await Subscription.findOne({
        user: req.userId,
        status: "active",
        isActive: true,
      });

      if (!subscription || subscription.plan === "free") {
        res.status(403).json({
          message: "Premium subscription required for expert support",
        });
        return;
      }

      const {
        type,
        subject,
        message,
        relatedFarm,
        relatedPond,
        attachments,
        priority,
      } = req.body;

      // Verify related resources belong to user
      if (relatedFarm) {
        const farm = await Farm.findOne({
          _id: relatedFarm,
          owner: req.userId,
          isActive: true,
        });
        if (!farm) {
          res.status(403).json({ message: "Access denied to farm" });
          return;
        }
      }

      if (relatedPond) {
        const pond = await Pond.findOne({
          _id: relatedPond,
          isActive: true,
        });
        if (pond) {
          const farm = await Farm.findOne({
            _id: pond.farm,
            owner: req.userId,
            isActive: true,
          });
          if (!farm) {
            res.status(403).json({ message: "Access denied to pond" });
            return;
          }
        }
      }

      const question = await Support.create({
        user: req.userId,
        type: type || "question",
        subject,
        message,
        relatedFarm,
        relatedPond,
        attachments,
        priority: priority || "medium",
        status: "open",
        isActive: true,
      });

      res.status(201).json({
        success: true,
        message: "Question submitted successfully",
        question,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /api/support/questions/:id
 * Get a specific question
 */
router.get(
  "/questions/:id",
  mongoIdValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const question = await Support.findOne({
        _id: req.params.id,
        isActive: true,
      })
        .populate("user", "username email")
        .populate("expertId", "username fullName")
        .populate("relatedFarm", "name location")
        .populate("relatedPond", "name");

      if (!question) {
        res.status(404).json({ message: "Question not found" });
        return;
      }

      // Verify user owns this question or is admin/expert
      if (
        question.user.toString() !== req.userId &&
        req.user?.role !== "admin" &&
        req.user?.role !== "expert"
      ) {
        res.status(403).json({ message: "Access denied" });
        return;
      }

      res.json({
        success: true,
        question,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /api/support/conversations
 * Get all conversations/questions for user
 */
router.get(
  "/conversations",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { status, type } = req.query;
      const query: any = { user: req.userId };

      if (status) {
        query.status = status;
      }

      if (type) {
        query.type = type;
      }

      const conversations = await Support.find(query)
        .populate("expertId", "username fullName")
        .populate("relatedFarm", "name")
        .populate("relatedPond", "name")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        count: conversations.length,
        conversations,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * PUT /api/support/questions/:id/answer
 * Answer a question (Expert/Admin only)
 */
router.put(
  "/questions/:id/answer",
  mongoIdValidation,
  isAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { expertResponse, status } = req.body;

      const question = await Support.findOne({
        _id: req.params.id,
        isActive: true,
      });

      if (!question) {
        res.status(404).json({ message: "Question not found" });
        return;
      }

      question.expertResponse = expertResponse;
      question.expertId = req.userId as any;
      if (status) {
        question.status = status as "open" | "answered" | "closed";
      } else if (expertResponse) {
        question.status = "answered";
      }

      await question.save();

      res.json({
        success: true,
        message: "Response added",
        question,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

export default router;

