import { Router, Response } from "express";
import Farm from "../models/Farm";
import Alert from "../models/Alert";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// All weather routes require authentication
router.use(authenticate);

/**
 * GET /api/weather/current
 * Get current weather for a farm location
 * Note: This is a mock implementation. In production, integrate with a weather API
 */
router.get(
  "/current",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { farmId } = req.query;

      if (!farmId) {
        res.status(400).json({ message: "farmId is required" });
        return;
      }

      // Verify farm belongs to user
      const farm = await Farm.findOne({
        _id: farmId,
        owner: req.userId,
      });

      if (!farm) {
        res.status(404).json({ message: "Farm not found" });
        return;
      }

      // Mock weather data - In production, call a weather API
      const mockWeather = {
        location: farm.location || "Unknown",
        temperature: 28,
        humidity: 75,
        windSpeed: 15,
        windDirection: "NE",
        pressure: 1013,
        conditions: "Partly Cloudy",
        visibility: 10,
        uvIndex: 6,
        timestamp: new Date().toISOString(),
      };

      res.json({
        success: true,
        weather: mockWeather,
        note: "This is mock data. Integrate with a weather API for real data.",
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /api/weather/forecast
 * Get weather forecast for a farm location
 */
router.get(
  "/forecast",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { farmId, days = 7 } = req.query;

      if (!farmId) {
        res.status(400).json({ message: "farmId is required" });
        return;
      }

      // Verify farm belongs to user
      const farm = await Farm.findOne({
        _id: farmId,
        owner: req.userId,
      });

      if (!farm) {
        res.status(404).json({ message: "Farm not found" });
        return;
      }

      // Mock forecast data
      const forecast = [];
      for (let i = 0; i < parseInt(days as string); i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        forecast.push({
          date: date.toISOString().split("T")[0],
          high: 30 + Math.floor(Math.random() * 5),
          low: 22 + Math.floor(Math.random() * 5),
          conditions: ["Sunny", "Partly Cloudy", "Cloudy", "Rainy"][
            Math.floor(Math.random() * 4)
          ],
          humidity: 70 + Math.floor(Math.random() * 20),
          windSpeed: 10 + Math.floor(Math.random() * 15),
        });
      }

      res.json({
        success: true,
        location: farm.location || "Unknown",
        forecast,
        note: "This is mock data. Integrate with a weather API for real data.",
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /api/weather/alerts
 * Get weather alerts for user's farms
 */
router.get(
  "/alerts",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Get all farms for user
      const farms = await Farm.find({ owner: req.userId });
      const farmIds = farms.map((f) => f._id);

      // Get weather-related alerts
      const alerts = await Alert.find({
        user: req.userId,
        type: "weather",
        resolved: false,
        relatedFarm: { $in: farmIds },
      })
        .populate("relatedFarm", "name location")
        .sort({ createdAt: -1 });

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

