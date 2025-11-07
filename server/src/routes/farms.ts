import { Router, Response } from "express";
import Farm from "../models/Farm";
import Pond from "../models/Pond";
import ScanResult from "../models/ScanResult";
import { authenticate, AuthRequest } from "../middleware/auth";
import {
  createFarmValidation,
  mongoIdValidation,
} from "../middleware/validation";
import { validationResult } from "express-validator";

const router = Router();

// All farm routes require authentication
router.use(authenticate);

/**
 * POST /farms
 * Create a new farm
 */
router.post(
  "/",
  createFarmValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { name, location } = req.body;

      const farm = await Farm.create({
        name,
        location,
        owner: req.userId,
        isActive: true,
      });

      res.status(201).json({
        success: true,
        farm,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /farms
 * Get all farms for current user
 */
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isActive } = req.query;
    const query: any = {
      owner: req.userId,
      isActive: isActive !== "false",
    };

    const farms = await Farm.find(query).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: farms.length,
      farms,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: String(error) });
  }
});

/**
 * GET /farms/:id
 * Get a single farm with its ponds
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

      const farm = await Farm.findOne({
        _id: req.params.id,
        owner: req.userId,
        isActive: true,
      });

      if (!farm) {
        res.status(404).json({ message: "Farm not found" });
        return;
      }

      const ponds = await Pond.find({
        farm: farm._id,
        isActive: true,
      }).sort({ createdAt: -1 });

      res.json({
        success: true,
        farm: {
          ...farm.toObject(),
          ponds,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * PUT /farms/:id
 * Update a farm
 */
router.put(
  "/:id",
  mongoIdValidation,
  createFarmValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { name, location } = req.body;

      const farm = await Farm.findOneAndUpdate(
        { _id: req.params.id, owner: req.userId, isActive: true },
        { name, location },
        { new: true, runValidators: true }
      );

      if (!farm) {
        res.status(404).json({ message: "Farm not found" });
        return;
      }

      res.json({
        success: true,
        farm,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * DELETE /farms/:id
 * Delete a farm and all its ponds
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

      const farm = await Farm.findOne({
        _id: req.params.id,
        owner: req.userId,
        isActive: true,
      });

      if (!farm) {
        res.status(404).json({ message: "Farm not found" });
        return;
      }

      // Soft delete all ponds associated with this farm
      await Pond.updateMany({ farm: farm._id }, { isActive: false });

      // Soft delete farm
      farm.isActive = false;
      await farm.save();

      res.json({
        success: true,
        message: "Farm and its ponds deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /farms/:id/stats
 * Get statistics for a farm
 */
router.get(
  "/:id/stats",
  mongoIdValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const farm = await Farm.findOne({
        _id: req.params.id,
        owner: req.userId,
        isActive: true,
      });

      if (!farm) {
        res.status(404).json({ message: "Farm not found" });
        return;
      }

      // Get all active ponds for this farm
      const ponds = await Pond.find({ farm: farm._id, isActive: true });
      const pondIds = ponds.map((p) => p._id);

      // Get total ponds
      const totalPonds = ponds.length;
      const activePonds = ponds.filter((p) => p.status === "active").length;

      // Get scans for this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyScans = await ScanResult.countDocuments({
        pond: { $in: pondIds },
        isActive: true,
        createdAt: { $gte: startOfMonth },
      });

      // Calculate average health score
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

      res.json({
        success: true,
        stats: {
          farmId: farm._id,
          farmName: farm.name,
          totalPonds,
          activePonds,
          monthlyScans,
          avgHealthScore,
          status: farm.status,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

export default router;
