import { Router, Response } from "express";
import ScanResult from "../models/ScanResult";
import Pond from "../models/Pond";
import Farm from "../models/Farm";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// All AI routes require authentication
router.use(authenticate);

/**
 * POST /api/ai/predict-disease
 * Predict disease from scan data (mock AI implementation)
 */
router.post(
  "/predict-disease",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { imageUrl, metrics, scanId } = req.body;

      // In a real implementation, this would call an AI/ML service
      // For now, we'll return mock predictions based on metrics

      // Mock disease prediction logic
      const healthScore = metrics?.healthScore || metrics?.temperature || 75;
      let disease = null;
      let confidence = 0;
      const recommendations: string[] = [];

      if (healthScore < 50) {
        disease = "White Spot Syndrome";
        confidence = 85;
        recommendations.push(
          "Immediate water quality check required",
          "Consider isolating affected pond",
          "Consult with aquaculture expert"
        );
      } else if (healthScore < 70) {
        disease = "Early Mortality Syndrome";
        confidence = 65;
        recommendations.push(
          "Monitor water parameters closely",
          "Increase aeration",
          "Review feeding schedule"
        );
      } else {
        disease = "No disease detected";
        confidence = 90;
        recommendations.push("Continue regular monitoring");
      }

      // If scanId is provided, update the scan with prediction
      if (scanId) {
        const scan = await ScanResult.findOne({
          _id: scanId,
          isActive: true,
        });
        if (scan) {
          // Verify user has access
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

          scan.diseasePrediction = {
            disease,
            confidence,
            recommendations,
          };
          await scan.save();
        }
      }

      res.json({
        success: true,
        prediction: {
          disease,
          confidence,
          recommendations,
          healthScore,
        },
        note: "This is a mock prediction. Integrate with a real AI/ML service for production.",
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

export default router;

