import { Router, Response } from "express";
import ScanResult from "../models/ScanResult";
import Pond from "../models/Pond";
import Farm from "../models/Farm";
import { authenticate, AuthRequest } from "../middleware/auth";
import { createScanValidation, mongoIdValidation } from "../middleware/validation";
import { validationResult, body } from "express-validator";

const router = Router();

// All scan routes require authentication
router.use(authenticate);

/**
 * POST /scans
 * Create a new scan result
 * If saveToPondId is provided, the scan will be associated with that pond
 */
router.post(
  "/",
  createScanValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { deviceId, metrics, rawData, saveToPondId } = req.body;

      // If saveToPondId is provided, verify pond exists and user has access
      if (saveToPondId) {
        const pond = await Pond.findOne({
          _id: saveToPondId,
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
          res.status(403).json({ message: "Access denied to this pond" });
          return;
        }
      }

      const scan = await ScanResult.create({
        pond: saveToPondId || undefined,
        deviceId,
        metrics,
        rawData,
        isActive: true,
      });

      res.status(201).json({
        success: true,
        scan,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /scans
 * Get all scans (optionally filtered by pond)
 */
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pondId } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    let query: any = {};

    const { isActive } = req.query;

    if (pondId) {
      // Verify user has access to this pond
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

      query.pond = pondId;
    } else {
      // Get all active farms for user
      const farms = await Farm.find({
        owner: req.userId,
        isActive: true,
      }).select("_id");
      const farmIds = farms.map((f) => f._id);

      // Get all active ponds from user's farms
      const ponds = await Pond.find({
        farm: { $in: farmIds },
        isActive: true,
      }).select("_id");
      const pondIds = ponds.map((p) => p._id);

      query.pond = { $in: pondIds };
    }

    query.isActive = isActive !== "false";

    const scans = await ScanResult.find(query)
      .populate("pond")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ScanResult.countDocuments(query);

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
});

/**
 * GET /scans/history
 * Get scan history with pagination
 */
router.get(
  "/history",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { pondId, limit = 50, page = 1 } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Get all active farms for user
      const farms = await Farm.find({
        owner: req.userId,
        isActive: true,
      });
      const farmIds = farms.map((f) => f._id);

      // Get ponds
      let pondIds: any[] = [];
      if (pondId) {
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

        pondIds = [pondId];
      } else {
        const ponds = await Pond.find({
          farm: { $in: farmIds },
          isActive: true,
        });
        pondIds = ponds.map((p) => p._id);
      }

      // If no ponds found, return empty result
      if (pondIds.length === 0) {
        res.json({
          success: true,
          page: pageNum,
          limit: limitNum,
          total: 0,
          totalPages: 0,
          scans: [],
        });
        return;
      }

      const scans = await ScanResult.find({
        pond: { $in: pondIds },
        isActive: true,
      })
        .populate("pond", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      const total = await ScanResult.countDocuments({
        pond: { $in: pondIds },
        isActive: true,
      });

      res.json({
        success: true,
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        scans,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /scans/:id
 * Get a single scan result
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

      const scan = await ScanResult.findOne({
        _id: req.params.id,
        isActive: true,
      }).populate("pond");

    if (!scan) {
      res.status(404).json({ message: "Scan not found" });
      return;
    }

    // If scan is associated with a pond, verify user has access
    if (scan.pond) {
      const pond = await Pond.findOne({
        _id: scan.pond,
        isActive: true,
      });
      if (pond) {
        const farm = await Farm.findOne({
          _id: pond.farm,
          owner: req.userId,
          isActive: true,
        });
        if (!farm) {
          res.status(403).json({ message: "Access denied" });
          return;
        }
      }
    }

    res.json({
      success: true,
      scan,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: String(error) });
  }
});

/**
 * PUT /scans/:id
 * Update a scan result
 */
router.put(
  "/:id",
  mongoIdValidation,
  [
    body("metrics")
      .optional()
      .isObject()
      .withMessage("Metrics must be an object"),
    body("healthScore")
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage("Health score must be between 0 and 100"),
    body("diseasePrediction")
      .optional()
      .isObject()
      .withMessage("Disease prediction must be an object"),
    body("imageUrl")
      .optional()
      .isURL()
      .withMessage("Image URL must be a valid URL"),
    body("saveToPondId")
      .optional()
      .isMongoId()
      .withMessage("Invalid pond ID"),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const scan = await ScanResult.findOne({
        _id: req.params.id,
        isActive: true,
      });

      if (!scan) {
        res.status(404).json({ message: "Scan not found" });
        return;
      }

      // If scan is associated with a pond, verify user has access
      if (scan.pond) {
        const pond = await Pond.findOne({
          _id: scan.pond,
          isActive: true,
        });
        if (pond) {
          const farm = await Farm.findOne({
            _id: pond.farm,
            owner: req.userId,
            isActive: true,
          });
          if (!farm) {
            res.status(403).json({ message: "Access denied" });
            return;
          }
        }
      }

      // If updating pond association, verify new pond access
      if (req.body.saveToPondId) {
        const newPond = await Pond.findOne({
          _id: req.body.saveToPondId,
          isActive: true,
        });
        if (!newPond) {
          res.status(404).json({ message: "Pond not found" });
          return;
        }

        const farm = await Farm.findOne({
          _id: newPond.farm,
          owner: req.userId,
          isActive: true,
        });
        if (!farm) {
          res.status(403).json({ message: "Access denied to this pond" });
          return;
        }
        scan.pond = req.body.saveToPondId;
      }

      // Update fields
      if (req.body.metrics !== undefined) {
        scan.metrics = { ...scan.metrics, ...req.body.metrics };
      }
      if (req.body.healthScore !== undefined) {
        scan.healthScore = req.body.healthScore;
      }
      if (req.body.diseasePrediction !== undefined) {
        scan.diseasePrediction = req.body.diseasePrediction;
      }
      if (req.body.imageUrl !== undefined) {
        scan.imageUrl = req.body.imageUrl;
      }
      if (req.body.rawData !== undefined) {
        scan.rawData = req.body.rawData;
      }

      await scan.save();

      await scan.populate("pond");

      res.json({
        success: true,
        message: "Scan updated successfully",
        scan,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * DELETE /scans/:id
 * Delete a scan result
 */
router.delete(
  "/:id",
  mongoIdValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const scan = await ScanResult.findOne({
        _id: req.params.id,
        isActive: true,
      });

      if (!scan) {
        res.status(404).json({ message: "Scan not found" });
        return;
      }

      // If scan is associated with a pond, verify user has access
      if (scan.pond) {
        const pond = await Pond.findOne({
          _id: scan.pond,
          isActive: true,
        });
        if (pond) {
          const farm = await Farm.findOne({
            _id: pond.farm,
            owner: req.userId,
            isActive: true,
          });
          if (!farm) {
            res.status(403).json({ message: "Access denied" });
            return;
          }
        }
      }

      // Soft delete
      scan.isActive = false;
      await scan.save();

      res.json({
        success: true,
        message: "Scan deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /scans/monthly-stats
 * Get monthly scan statistics
 */
router.get(
  "/monthly-stats",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { month, year } = req.query;
      const now = new Date();
      const targetMonth = month ? parseInt(month as string) - 1 : now.getMonth();
      const targetYear = year ? parseInt(year as string) : now.getFullYear();

      const startDate = new Date(targetYear, targetMonth, 1);
      const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

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

      // Get scans for the month
      const scans = await ScanResult.find({
        pond: { $in: pondIds },
        isActive: true,
        createdAt: { $gte: startDate, $lte: endDate },
      });

      // Calculate statistics
      const totalScans = scans.length;
      const scansWithHealth = scans.filter((s) => s.healthScore !== undefined);
      const avgHealthScore =
        scansWithHealth.length > 0
          ? Math.round(
              scansWithHealth.reduce(
                (sum, s) => sum + (s.healthScore || 0),
                0
              ) / scansWithHealth.length
            )
          : 0;

      // Group by day
      const dailyStats: Record<string, number> = {};
      scans.forEach((scan) => {
        const dateStr = scan.createdAt.toISOString().split("T")[0];
        dailyStats[dateStr] = (dailyStats[dateStr] || 0) + 1;
      });

      res.json({
        success: true,
        period: {
          month: targetMonth + 1,
          year: targetYear,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        },
        stats: {
          totalScans,
          avgHealthScore,
          scansWithHealthScore: scansWithHealth.length,
        },
        dailyStats: Object.entries(dailyStats)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

export default router;
