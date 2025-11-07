import { Router, Response } from "express";
import Farm from "../models/Farm";
import Pond from "../models/Pond";
import ScanResult from "../models/ScanResult";
import Alert from "../models/Alert";
import { authenticate, AuthRequest } from "../middleware/auth";
import { Types } from "mongoose";

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

/**
 * GET /api/dashboard/overview
 * Get dashboard overview with key metrics
 */
router.get(
  "/overview",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Get all active farms for user
      const farms = await Farm.find({
        owner: req.userId,
        isActive: true,
      });
      const farmIds = farms.map((f) => f._id);

      // Get active farms count
      const activeFarms = await Farm.countDocuments({
        owner: req.userId,
        status: "active",
        isActive: true,
      });

      // Get all active ponds from user's farms
      const ponds = await Pond.find({
        farm: { $in: farmIds },
        isActive: true,
      });
      const pondIds = ponds.map((p) => p._id);

      // Get total ponds count
      const totalPonds = ponds.length;

      // Get scans for current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyScans = await ScanResult.countDocuments({
        pond: { $in: pondIds },
        isActive: true,
        createdAt: { $gte: startOfMonth },
      });

      // Calculate average health score from recent scans
      const recentScans = await ScanResult.find({
        pond: { $in: pondIds },
        isActive: true,
        healthScore: { $exists: true },
        createdAt: { $gte: startOfMonth },
      })
        .select("healthScore")
        .limit(100);

      let avgHealthScore = 0;
      if (recentScans.length > 0) {
        const totalScore = recentScans.reduce(
          (sum, scan) => sum + (scan.healthScore || 0),
          0
        );
        avgHealthScore = Math.round(totalScore / recentScans.length);
      }

      // Get unresolved alerts count
      const alertsCount = await Alert.countDocuments({
        user: req.userId,
        resolved: false,
        isActive: true,
      });

      res.json({
        success: true,
        overview: {
          activeFarms,
          totalPonds,
          monthlyScans,
          avgHealthScore,
          alertsCount,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /api/dashboard/active-farms
 * Get count of active farms
 */
router.get(
  "/active-farms",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const activeFarms = await Farm.countDocuments({
        owner: req.userId,
        status: "active",
        isActive: true,
      });

      res.json({
        success: true,
        count: activeFarms,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /api/dashboard/alerts
 * Get list of alerts for user
 */
router.get(
  "/alerts",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { resolved, type, limit } = req.query;
      const query: any = {
        user: req.userId,
        isActive: true,
      };

      if (resolved !== undefined) {
        query.resolved = resolved === "true";
      }

      if (type) {
        query.type = type;
      }

      const alerts = await Alert.find(query)
        .populate("relatedFarm", "name")
        .populate("relatedPond", "name")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit as string) || 20);

      res.json({
        success: true,
        count: alerts.length,
        alerts,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

export default router;

