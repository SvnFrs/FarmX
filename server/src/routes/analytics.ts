import { Router, Response } from "express";
import ScanResult from "../models/ScanResult";
import Pond from "../models/Pond";
import Farm from "../models/Farm";
import { authenticate, AuthRequest } from "../middleware/auth";
import { Types } from "mongoose";

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

/**
 * GET /api/analytics/health-trends
 * Get health score trends over time
 */
router.get(
  "/health-trends",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { pondId, days = 30 } = req.query;
      const daysNum = parseInt(days as string);

      // Get all active farms for user
      const farms = await Farm.find({
        owner: req.userId,
        isActive: true,
      });
      const farmIds = farms.map((f) => f._id);

      // Get ponds
      let pondIds: Types.ObjectId[] = [];
      if (pondId) {
        const pond = await Pond.findOne({
          _id: pondId,
          isActive: true,
        });
        if (!pond) {
          res.status(404).json({ message: "Pond not found" });
          return;
        }

        const farm = await Farm.findOne({
          _id: pond.farm,
          owner: req.userId,
          isActive: true,
        });
        if (!farm) {
          res.status(403).json({ message: "Access denied" });
          return;
        }

        pondIds = [new Types.ObjectId(pondId as string)];
      } else {
        const ponds = await Pond.find({
          farm: { $in: farmIds },
          isActive: true,
        });
        pondIds = ponds.map((p) => p._id);
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);

      // Get scans with health scores
      const scans = await ScanResult.find({
        pond: { $in: pondIds },
        isActive: true,
        healthScore: { $exists: true },
        createdAt: { $gte: startDate, $lte: endDate },
      })
        .select("healthScore createdAt")
        .sort({ createdAt: 1 });

      // Group by date
      const trendMap: Record<string, number[]> = {};

      scans.forEach((scan) => {
        const dateStr = scan.createdAt.toISOString().split("T")[0];
        if (!trendMap[dateStr]) {
          trendMap[dateStr] = [];
        }
        if (scan.healthScore) {
          trendMap[dateStr].push(scan.healthScore);
        }
      });

      // Calculate daily averages
      const trends = Object.entries(trendMap)
        .map(([date, scores]) => ({
          date,
          avgHealthScore: Math.round(
            scores.reduce((a, b) => a + b, 0) / scores.length
          ),
          count: scores.length,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      res.json({
        success: true,
        period: {
          from: startDate.toISOString().split("T")[0],
          to: endDate.toISOString().split("T")[0],
        },
        trends,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /api/analytics/scan-frequency
 * Get scan frequency statistics
 */
router.get(
  "/scan-frequency",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { pondId, days = 30 } = req.query;
      const daysNum = parseInt(days as string);

      // Get all active farms for user
      const farms = await Farm.find({
        owner: req.userId,
        isActive: true,
      });
      const farmIds = farms.map((f) => f._id);

      // Get ponds
      let pondIds: Types.ObjectId[] = [];
      if (pondId) {
        const pond = await Pond.findOne({
          _id: pondId,
          isActive: true,
        });
        if (!pond) {
          res.status(404).json({ message: "Pond not found" });
          return;
        }

        const farm = await Farm.findOne({
          _id: pond.farm,
          owner: req.userId,
          isActive: true,
        });
        if (!farm) {
          res.status(403).json({ message: "Access denied" });
          return;
        }

        pondIds = [new Types.ObjectId(pondId as string)];
      } else {
        const ponds = await Pond.find({
          farm: { $in: farmIds },
          isActive: true,
        });
        pondIds = ponds.map((p) => p._id);
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);

      // Get scans
      const scans = await ScanResult.find({
        pond: { $in: pondIds },
        isActive: true,
        createdAt: { $gte: startDate, $lte: endDate },
      }).select("createdAt");

      // Group by date
      const frequencyMap: Record<string, number> = {};

      scans.forEach((scan) => {
        const dateStr = scan.createdAt.toISOString().split("T")[0];
        frequencyMap[dateStr] = (frequencyMap[dateStr] || 0) + 1;
      });

      // Convert to array
      const frequency = Object.entries(frequencyMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const totalScans = scans.length;
      const avgDailyScans = totalScans / daysNum;

      res.json({
        success: true,
        period: {
          from: startDate.toISOString().split("T")[0],
          to: endDate.toISOString().split("T")[0],
        },
        totalScans,
        avgDailyScans: Math.round(avgDailyScans * 100) / 100,
        frequency,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /api/analytics/export
 * Export analytics data (simplified - returns JSON)
 */
router.get(
  "/export",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { format = "json", days = 30 } = req.query;
      const daysNum = parseInt(days as string);

      // Get all active farms for user
      const farms = await Farm.find({
        owner: req.userId,
        isActive: true,
      });
      const farmIds = farms.map((f) => f._id);

      // Get all active ponds
      const ponds = await Pond.find({
        farm: { $in: farmIds },
        isActive: true,
      });
      const pondIds = ponds.map((p) => p._id);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);

      // Get scans
      const scans = await ScanResult.find({
        pond: { $in: pondIds },
        isActive: true,
        createdAt: { $gte: startDate, $lte: endDate },
      })
        .populate("pond", "name")
        .sort({ createdAt: -1 });

      // Format data
      const exportData = {
        period: {
          from: startDate.toISOString(),
          to: endDate.toISOString(),
        },
        farms: farms.length,
        ponds: ponds.length,
        totalScans: scans.length,
        scans: scans.map((scan) => ({
          id: scan._id,
          pond: scan.pond,
          healthScore: scan.healthScore,
          diseasePrediction: scan.diseasePrediction,
          metrics: scan.metrics,
          createdAt: scan.createdAt,
        })),
      };

      if (format === "json") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="analytics-${Date.now()}.json"`
        );
        res.json(exportData);
      } else {
        res.json({
          success: true,
          message: "Only JSON format is currently supported",
          data: exportData,
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

export default router;
