import { Router, Request, Response } from "express";
import Subscription from "../models/Subscription";
import User from "../models/User";
import { authenticate, AuthRequest } from "../middleware/auth";
import { mongoIdValidation } from "../middleware/validation";
import { validationResult } from "express-validator";

const router = Router();

// All subscription routes require authentication
router.use(authenticate);

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  free: {
    name: "Free",
    price: 0,
    currency: "USD",
    features: ["Limited scans", "Basic analytics"],
  },
  premium: {
    name: "Premium",
    price: 29.99,
    currency: "USD",
    features: [
      "Unlimited scans",
      "Priority expert support",
      "Advanced analytics",
      "Multi-farm management",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: 99.99,
    currency: "USD",
    features: [
      "Everything in Premium",
      "Custom integrations",
      "Dedicated support",
      "API access",
    ],
  },
};

/**
 * GET /api/subscriptions/plans
 * Get available subscription plans
 */
router.get("/plans", async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      plans: SUBSCRIPTION_PLANS,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: String(error) });
  }
});

/**
 * GET /api/subscriptions/current
 * Get current user's subscription
 */
router.get(
  "/current",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      let subscription = await Subscription.findOne({
        user: req.userId,
        isActive: true,
      });

      // Create free subscription if doesn't exist
      if (!subscription) {
        subscription = await Subscription.create({
          user: req.userId,
          plan: "free",
          status: "active",
          price: 0,
          currency: "USD",
          isActive: true,
        });

        // Update user
        await User.findByIdAndUpdate(req.userId, {
          subscription: subscription._id,
        });
      }

      res.json({
        success: true,
        subscription,
        planDetails: SUBSCRIPTION_PLANS[subscription.plan as keyof typeof SUBSCRIPTION_PLANS],
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * POST /api/subscriptions/subscribe
 * Subscribe to a plan
 */
router.post(
  "/subscribe",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { plan, paymentMethod } = req.body;

      if (!plan || !SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]) {
        res.status(400).json({ message: "Invalid plan" });
        return;
      }

      const planDetails = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS];

      // Find or create subscription
      let subscription = await Subscription.findOne({
        user: req.userId,
        isActive: true,
      });

      if (subscription) {
        // Update existing subscription
        subscription.plan = plan as "free" | "premium" | "enterprise";
        subscription.status = "active";
        subscription.price = planDetails.price;
        subscription.currency = planDetails.currency;
        subscription.startDate = new Date();

        // Set end date (30 days from now for paid plans)
        if (plan !== "free") {
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 30);
          subscription.endDate = endDate;
        }

        // Add payment history entry
        if (plan !== "free") {
          subscription.paymentHistory.push({
            date: new Date(),
            amount: planDetails.price,
            status: "success",
            transactionId: `txn_${Date.now()}`,
          });
        }

        await subscription.save();
      } else {
        // Create new subscription
        const endDate = plan !== "free" ? new Date() : undefined;
        if (endDate) {
          endDate.setDate(endDate.getDate() + 30);
        }

        subscription = await Subscription.create({
          user: req.userId,
          plan: plan as "free" | "premium" | "enterprise",
          status: "active",
          price: planDetails.price,
          currency: planDetails.currency,
          endDate,
          isActive: true,
          paymentHistory:
            plan !== "free"
              ? [
                  {
                    date: new Date(),
                    amount: planDetails.price,
                    status: "success",
                    transactionId: `txn_${Date.now()}`,
                  },
                ]
              : [],
        });

        // Update user
        await User.findByIdAndUpdate(req.userId, {
          subscription: subscription._id,
        });
      }

      res.json({
        success: true,
        message: `Successfully subscribed to ${planDetails.name} plan`,
        subscription,
        planDetails,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * PUT /api/subscriptions/cancel
 * Cancel current subscription
 */
router.put(
  "/cancel",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const subscription = await Subscription.findOne({
        user: req.userId,
        isActive: true,
      });

      if (!subscription) {
        res.status(404).json({ message: "No active subscription found" });
        return;
      }

      if (subscription.plan === "free") {
        res.status(400).json({ message: "Cannot cancel free plan" });
        return;
      }

      subscription.status = "cancelled";
      subscription.autoRenew = false;
      await subscription.save();

      res.json({
        success: true,
        message: "Subscription cancelled",
        subscription,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * GET /api/subscriptions/history
 * Get payment history
 */
router.get(
  "/history",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const subscription = await Subscription.findOne({
        user: req.userId,
        isActive: true,
      });

      if (!subscription) {
        res.status(404).json({ message: "No subscription found" });
        return;
      }

      res.json({
        success: true,
        paymentHistory: subscription.paymentHistory || [],
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

export default router;

