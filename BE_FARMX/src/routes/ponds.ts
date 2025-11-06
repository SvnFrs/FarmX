import { Router, Response } from "express";
import Pond from "../models/Pond";
import Farm from "../models/Farm";
import ScanResult from "../models/ScanResult";
import { authenticate, AuthRequest } from "../middleware/auth";
import {
  createPondValidation,
  updatePondValidation,
  mongoIdValidation,
  analyticsQueryValidation,
} from "../middleware/validation";
import { validationResult } from "express-validator";
import { Types } from "mongoose";

const router = Router();

// All pond routes require authentication
router.use(authenticate);

/**
 * POST /farms/:farmId/ponds
 * Create a new pond in a farm
 */
router.post(
  "/:farmId/ponds",
  createPondValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { farmId } = req.params;
      const { name, area } = req.body;

      // Verify farm exists and belongs to user
      const farm = await Farm.findOne({ _id: farmId, owner: req.userId });
      if (!farm) {
        res.status(404).json({ message: "Farm not found" });
        return;
      }

      const pond = await Pond.create({
        name,
        farm: farmId,
        area,
        isActive: true,
      });

      res.status(201).json({
        success: true,
        pond,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /farms/:farmId/ponds
 * Get all ponds in a farm
 */
router.get(
  "/:farmId/ponds",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { farmId } = req.params;

      // Verify farm exists and belongs to user
      const farm = await Farm.findOne({
        _id: farmId,
        owner: req.userId,
        isActive: true,
      });
      if (!farm) {
        res.status(404).json({ message: "Farm not found" });
        return;
      }

      const { isActive } = req.query;
      const query: any = {
        farm: farmId,
        isActive: isActive !== "false",
      };

      const ponds = await Pond.find(query).sort({ createdAt: -1 });

      res.json({
        success: true,
        count: ponds.length,
        ponds,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /ponds
 * Get all ponds for current user (across all farms)
 */
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get all active farms for user
    const farms = await Farm.find({
      owner: req.userId,
      isActive: true,
    }).select("_id");
    const farmIds = farms.map((f) => f._id);

    if (farmIds.length === 0) {
      res.json({
        success: true,
        count: 0,
        ponds: [],
      });
      return;
    }

    const { isActive, status, farmId } = req.query;
    const query: any = {
      farm: { $in: farmIds },
      isActive: isActive !== "false",
    };

    // Filter by specific farm if provided
    if (farmId) {
      // Verify farm belongs to user
      const farm = await Farm.findOne({
        _id: farmId,
        owner: req.userId,
        isActive: true,
      });
      if (farm) {
        query.farm = farmId;
      }
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    const ponds = await Pond.find(query)
      .populate("farm", "name location")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: ponds.length,
      ponds,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: String(error) });
  }
});

/**
 * GET /ponds/:pondId
 * Get a single pond
 */
router.get(
  "/:pondId",
  mongoIdValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const pond = await Pond.findOne({
        _id: req.params.pondId,
        isActive: true,
      }).populate("farm");

      if (!pond) {
        res.status(404).json({ message: "Pond not found" });
        return;
      }

      // Verify farm belongs to user
      const farm = await Farm.findOne({
        _id: pond.farm,
        owner: req.userId,
        isActive: true,
      });
      if (!farm) {
        res.status(403).json({ message: "Access denied" });
        return;
      }

      res.json({
        success: true,
        pond,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * PUT /ponds/:pondId
 * Update a pond
 */
router.put(
  "/:pondId",
  mongoIdValidation,
  updatePondValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { name, area, status } = req.body;

      const pond = await Pond.findById(req.params.pondId);
      if (!pond) {
        res.status(404).json({ message: "Pond not found" });
        return;
      }

      // Verify farm belongs to user
      const farm = await Farm.findOne({ _id: pond.farm, owner: req.userId });
      if (!farm) {
        res.status(403).json({ message: "Access denied" });
        return;
      }

      if (name !== undefined) pond.name = name;
      if (area !== undefined) pond.area = area;
      if (status !== undefined) pond.status = status;
      await pond.save();

      res.json({
        success: true,
        pond,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * DELETE /ponds/:pondId
 * Delete a pond
 */
router.delete(
  "/:pondId",
  mongoIdValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const pond = await Pond.findOne({
        _id: req.params.pondId,
        isActive: true,
      });
      if (!pond) {
        res.status(404).json({ message: "Pond not found" });
        return;
      }

      // Verify farm belongs to user
      const farm = await Farm.findOne({
        _id: pond.farm,
        owner: req.userId,
        isActive: true,
      });
      if (!farm) {
        res.status(403).json({ message: "Access denied" });
        return;
      }

      // Soft delete all scans associated with this pond
      await ScanResult.updateMany({ pond: pond._id }, { isActive: false });

      // Soft delete pond
      pond.isActive = false;
      await pond.save();

      res.json({
        success: true,
        message: "Pond and its scans deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /ponds/:pondId/scans
 * Get all scans for a pond with pagination
 */
router.get(
  "/:pondId/scans",
  mongoIdValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { pondId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Verify pond exists and user has access
      const pond = await Pond.findById(pondId);
      if (!pond) {
        res.status(404).json({ message: "Pond not found" });
        return;
      }

      const farm = await Farm.findOne({ _id: pond.farm, owner: req.userId });
      if (!farm) {
        res.status(403).json({ message: "Access denied" });
        return;
      }

      const { isActive: scanActive } = req.query;
      const scanQuery: any = {
        pond: pondId,
        isActive: scanActive !== "false",
      };

      const scans = await ScanResult.find(scanQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await ScanResult.countDocuments(scanQuery);

      res.json({
        success: true,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        scans,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /ponds/:pondId/analytics
 * Get analytics for a pond
 */
router.get(
  "/:pondId/analytics",
  mongoIdValidation,
  analyticsQueryValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { pondId } = req.params;
      const fromDate = req.query.from
        ? new Date(req.query.from as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const toDate = req.query.to
        ? new Date(req.query.to as string)
        : new Date();

      // Verify pond exists and user has access
      const pond = await Pond.findOne({ _id: pondId, isActive: true });
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

      // Get all scans in date range
      const scans = await ScanResult.find({
        pond: new Types.ObjectId(pondId),
        isActive: true,
        createdAt: { $gte: fromDate, $lte: toDate },
      });

      const totalScans = scans.length;

      // Calculate average metrics
      const metricsSum: Record<string, number> = {};
      const metricsCount: Record<string, number> = {};

      scans.forEach((scan) => {
        Object.entries(scan.metrics).forEach(([key, value]) => {
          if (typeof value === "number") {
            metricsSum[key] = (metricsSum[key] || 0) + value;
            metricsCount[key] = (metricsCount[key] || 0) + 1;
          }
        });
      });

      const avgMetrics: Record<string, number> = {};
      Object.keys(metricsSum).forEach((key) => {
        avgMetrics[key] = metricsSum[key] / metricsCount[key];
      });

      // Group by date for trend analysis
      const trendMap: Record<string, any> = {};

      scans.forEach((scan) => {
        const dateStr = scan.createdAt.toISOString().split("T")[0];

        if (!trendMap[dateStr]) {
          trendMap[dateStr] = {
            date: dateStr,
            count: 0,
            metrics: {} as Record<string, number[]>,
          };
        }

        trendMap[dateStr].count++;

        Object.entries(scan.metrics).forEach(([key, value]) => {
          if (typeof value === "number") {
            if (!trendMap[dateStr].metrics[key]) {
              trendMap[dateStr].metrics[key] = [];
            }
            trendMap[dateStr].metrics[key].push(value);
          }
        });
      });

      // Calculate daily averages
      const trend = Object.values(trendMap)
        .map((day: any) => {
          const avgDayMetrics: Record<string, number> = {};

          Object.entries(day.metrics).forEach(
            ([key, values]: [string, any]) => {
              avgDayMetrics[key] =
                values.reduce((a: number, b: number) => a + b, 0) /
                values.length;
            }
          );

          return {
            date: day.date,
            count: day.count,
            avgMetrics: avgDayMetrics,
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date));

      res.json({
        success: true,
        analytics: {
          period: {
            from: fromDate.toISOString().split("T")[0],
            to: toDate.toISOString().split("T")[0],
          },
          totalScans,
          avgMetrics,
          trend,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

export default router;
