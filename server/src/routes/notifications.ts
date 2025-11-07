import { Router, Response } from "express";
import Alert from "../models/Alert";
import { authenticate, AuthRequest } from "../middleware/auth";
import { mongoIdValidation } from "../middleware/validation";
import { validationResult } from "express-validator";

const router = Router();

// All notification routes require authentication
router.use(authenticate);

/**
 * POST /api/notifications/subscribe
 * Subscribe to push notifications (simplified - stores preference)
 */
router.post(
  "/subscribe",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { deviceToken, platform } = req.body;

      // In a real implementation, you would store device tokens
      // For now, we'll just return success
      res.json({
        success: true,
        message: "Subscribed to notifications",
        deviceToken,
        platform,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /api/notifications
 * Get recent notifications (alerts)
 */
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit = 20, resolved } = req.query;
    const query: any = { user: req.userId };

    if (resolved !== undefined) {
      query.resolved = resolved === "true";
    }

    // Get recent alerts as notifications
    const notifications = await Alert.find(query)
      .populate("relatedFarm", "name")
      .populate("relatedPond", "name")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string));

    res.json({
      success: true,
      count: notifications.length,
      notifications: notifications.map((alert) => ({
        id: alert._id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        relatedFarm: alert.relatedFarm,
        relatedPond: alert.relatedPond,
        resolved: alert.resolved,
        createdAt: alert.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: String(error) });
  }
});

/**
 * GET /api/notifications/:id
 * Get a single notification
 */
router.get(
  "/:id",
  mongoIdValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const notification = await Alert.findOne({
        _id: req.params.id,
        user: req.userId,
      })
        .populate("relatedFarm", "name location")
        .populate("relatedPond", "name")
        .populate("relatedDevice", "name type");

      if (!notification) {
        res.status(404).json({ message: "Notification not found" });
        return;
      }

      res.json({
        success: true,
        notification: {
          id: notification._id,
          type: notification.type,
          severity: notification.severity,
          title: notification.title,
          message: notification.message,
          relatedFarm: notification.relatedFarm,
          relatedPond: notification.relatedPond,
          relatedDevice: notification.relatedDevice,
          resolved: notification.resolved,
          resolvedAt: notification.resolvedAt,
          createdAt: notification.createdAt,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read (resolve alert)
 */
router.put(
  "/:id/read",
  mongoIdValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const notification = await Alert.findOneAndUpdate(
        { _id: req.params.id, user: req.userId },
        {
          resolved: true,
          resolvedAt: new Date(),
        },
        { new: true }
      )
        .populate("relatedFarm", "name")
        .populate("relatedPond", "name");

      if (!notification) {
        res.status(404).json({ message: "Notification not found" });
        return;
      }

      res.json({
        success: true,
        message: "Notification marked as read",
        notification: {
          id: notification._id,
          resolved: notification.resolved,
          resolvedAt: notification.resolvedAt,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete(
  "/:id",
  mongoIdValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const notification = await Alert.findOneAndDelete({
        _id: req.params.id,
        user: req.userId,
      });

      if (!notification) {
        res.status(404).json({ message: "Notification not found" });
        return;
      }

      res.json({
        success: true,
        message: "Notification deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * DELETE /api/notifications
 * Clear all notifications
 */
router.delete("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resolved } = req.query;
    const query: any = { user: req.userId };

    if (resolved !== undefined) {
      query.resolved = resolved === "true";
    }

    const result = await Alert.deleteMany(query);

    res.json({
      success: true,
      message: `${result.deletedCount} notification(s) deleted`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: String(error) });
  }
});

export default router;
