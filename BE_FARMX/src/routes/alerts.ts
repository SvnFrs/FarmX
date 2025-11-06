import { Router, Response } from "express";
import Alert from "../models/Alert";
import Farm from "../models/Farm";
import Pond from "../models/Pond";
import { authenticate, AuthRequest } from "../middleware/auth";
import { mongoIdValidation } from "../middleware/validation";
import { validationResult } from "express-validator";

const router = Router();

// All alert routes require authentication
router.use(authenticate);

/**
 * GET /api/alerts
 * Get all alerts for current user
 */
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resolved, type, severity, limit, isActive } = req.query;
    const query: any = {
      user: req.userId,
      isActive: isActive !== "false",
    };

    if (resolved !== undefined) {
      query.resolved = resolved === "true";
    }

    if (type) {
      query.type = type;
    }

    if (severity) {
      query.severity = severity;
    }

    const alerts = await Alert.find(query)
      .populate("relatedFarm", "name location")
      .populate("relatedPond", "name")
      .populate("relatedDevice", "name type")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string) || 50);

    res.json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: String(error) });
  }
});

/**
 * GET /api/alerts/:alertId
 * Get a single alert
 */
router.get(
  "/:alertId",
  mongoIdValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const alert = await Alert.findOne({
        _id: req.params.alertId,
        user: req.userId,
        isActive: true,
      })
        .populate("relatedFarm", "name location")
        .populate("relatedPond", "name")
        .populate("relatedDevice", "name type");

      if (!alert) {
        res.status(404).json({ message: "Alert not found" });
        return;
      }

      res.json({
        success: true,
        alert,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * PUT /api/alerts/:alertId/resolve
 * Resolve an alert
 */
router.put(
  "/:alertId/resolve",
  mongoIdValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const alert = await Alert.findOneAndUpdate(
        { _id: req.params.alertId, user: req.userId, isActive: true },
        {
          resolved: true,
          resolvedAt: new Date(),
        },
        { new: true }
      )
        .populate("relatedFarm", "name location")
        .populate("relatedPond", "name")
        .populate("relatedDevice", "name type");

      if (!alert) {
        res.status(404).json({ message: "Alert not found" });
        return;
      }

      res.json({
        success: true,
        message: "Alert resolved",
        alert,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * POST /api/alerts
 * Create a new alert (typically done by system, but can be created manually)
 */
router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      type,
      severity,
      title,
      message,
      relatedFarm,
      relatedPond,
      relatedDevice,
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

    const alert = await Alert.create({
      user: req.userId,
      type: type || "system",
      severity: severity || "medium",
      title,
      message,
      relatedFarm,
      relatedPond,
      relatedDevice,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      alert,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: String(error) });
  }
});

export default router;

