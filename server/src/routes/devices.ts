import { Router, Response } from "express";
import Device from "../models/Device";
import Farm from "../models/Farm";
import Pond from "../models/Pond";
import { authenticate, AuthRequest } from "../middleware/auth";
import { mongoIdValidation } from "../middleware/validation";
import { validationResult } from "express-validator";

const router = Router();

// All device routes require authentication
router.use(authenticate);

/**
 * GET /api/devices
 * Get all devices for current user
 */
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, type, farmId, pondId, isActive } = req.query;
    const query: any = {
      user: req.userId,
      isActive: isActive !== "false",
    };

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (farmId) {
      // Verify farm belongs to user
      const farm = await Farm.findOne({
        _id: farmId,
        owner: req.userId,
        isActive: true,
      });
      if (!farm) {
        res.status(403).json({ message: "Access denied to farm" });
        return;
      }
      query.farm = farmId;
    }

    if (pondId) {
      // Verify pond belongs to user
      const pond = await Pond.findOne({
        _id: pondId,
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
      query.pond = pondId;
    }

    const devices = await Device.find(query)
      .populate("farm", "name")
      .populate("pond", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: devices.length,
      devices,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: String(error) });
  }
});

/**
 * POST /api/devices/register
 * Register a new device
 */
router.post(
  "/register",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        name,
        type,
        deviceModel,
        serialNumber,
        farmId,
        pondId,
        settings,
      } = req.body;

      // Verify farm if provided
      if (farmId) {
        const farm = await Farm.findOne({
          _id: farmId,
          owner: req.userId,
          isActive: true,
        });
        if (!farm) {
          res.status(403).json({ message: "Access denied to farm" });
          return;
        }
      }

      // Verify pond if provided
      if (pondId) {
        const pond = await Pond.findOne({
          _id: pondId,
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

      const device = await Device.create({
        user: req.userId,
        name,
        type,
        deviceModel,
        serialNumber,
        farm: farmId,
        pond: pondId,
        settings,
        status: "offline",
        isActive: true,
      });

      res.status(201).json({
        success: true,
        device,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /api/devices/:deviceId
 * Get device details
 */
router.get(
  "/:deviceId",
  mongoIdValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const device = await Device.findOne({
        _id: req.params.deviceId,
        user: req.userId,
        isActive: true,
      })
        .populate("farm", "name location")
        .populate("pond", "name");

      if (!device) {
        res.status(404).json({ message: "Device not found" });
        return;
      }

      res.json({
        success: true,
        device,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * PUT /api/devices/:deviceId/control
 * Control device (update settings, turn on/off, etc.)
 */
router.put(
  "/:deviceId/control",
  mongoIdValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { action, settings } = req.body;

      const device = await Device.findOne({
        _id: req.params.deviceId,
        user: req.userId,
        isActive: true,
      });

      if (!device) {
        res.status(404).json({ message: "Device not found" });
        return;
      }

      // Update settings if provided
      if (settings) {
        device.settings = { ...device.settings, ...settings };
      }

      // Handle actions
      if (action === "start") {
        device.status = "online";
      } else if (action === "stop") {
        device.status = "offline";
      } else if (action === "maintenance") {
        device.status = "maintenance";
      }

      device.lastSeen = new Date();
      await device.save();

      res.json({
        success: true,
        message: `Device ${action} executed`,
        device,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /api/devices/:deviceId/status
 * Get device status
 */
router.get(
  "/:deviceId/status",
  mongoIdValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const device = await Device.findOne({
        _id: req.params.deviceId,
        user: req.userId,
        isActive: true,
      }).select("status lastSeen settings");

      if (!device) {
        res.status(404).json({ message: "Device not found" });
        return;
      }

      res.json({
        success: true,
        status: device.status,
        lastSeen: device.lastSeen,
        settings: device.settings,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * PUT /api/devices/:deviceId/schedule
 * Set device schedule (e.g., feeding schedule)
 */
router.put(
  "/:deviceId/schedule",
  mongoIdValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { schedule, feedSchedule } = req.body;

      const device = await Device.findOne({
        _id: req.params.deviceId,
        user: req.userId,
        isActive: true,
      });

      if (!device) {
        res.status(404).json({ message: "Device not found" });
        return;
      }

      // Update schedule settings
      if (!device.settings) {
        device.settings = {};
      }

      if (schedule) {
        device.settings.schedule = schedule;
      }

      if (feedSchedule) {
        device.settings.feedSchedule = feedSchedule;
        device.settings.autoFeed = true;
      }

      await device.save();

      res.json({
        success: true,
        message: "Schedule updated",
        device: {
          _id: device._id,
          settings: device.settings,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

export default router;

