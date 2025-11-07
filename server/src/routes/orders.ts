import { Router, Response } from "express";
import Order from "../models/Order";
import Product from "../models/Product";
import { authenticate, AuthRequest, isAdmin } from "../middleware/auth";
import { mongoIdValidation } from "../middleware/validation";
import { validationResult, body } from "express-validator";

const router = Router();

// All order routes require authentication
router.use(authenticate);

/**
 * GET /orders
 * Get all orders for current user (or all orders if admin)
 */
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { isActive, status, userId } = req.query;
    const query: any = {
      isActive: isActive !== "false",
    };

    // Admin can view all orders or filter by user
    if (req.user?.role === "admin") {
      if (userId) {
        query.user = userId;
      }
    } else {
      // Regular users can only see their own orders
      query.user = req.userId;
    }

    // Filter by status if provided
    if (status) {
      if (["pending", "completed", "cancelled"].includes(status as string)) {
        query.status = status;
      }
    }

    const orders = await Order.find(query)
      .populate("items.product")
      .populate("user", "username email fullName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: String(error) });
  }
});

/**
 * GET /orders/:id
 * Get a single order
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

      const query: any = {
        _id: req.params.id,
        isActive: true,
      };

      // Admin can view any order, users can only view their own
      if (req.user?.role !== "admin") {
        query.user = req.userId;
      }

      const order = await Order.findOne(query)
        .populate("items.product")
        .populate("user", "username email fullName");

      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      res.json({
        success: true,
        order,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * POST /orders
 * Create a new order manually (alternative to cart checkout)
 */
router.post(
  "/",
  [
    body("items")
      .isArray({ min: 1 })
      .withMessage("Items array is required and cannot be empty"),
    body("items.*.product")
      .isMongoId()
      .withMessage("Invalid product ID"),
    body("items.*.qty")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { items, status } = req.body;

      // Calculate total and prepare order items
      let total = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await Product.findOne({
          _id: item.product,
          isActive: true,
        });
        if (!product) {
          res.status(404).json({
            message: `Product ${item.product} not found or inactive`,
          });
          return;
        }

        const itemTotal = product.price * item.qty;
        total += itemTotal;

        orderItems.push({
          product: product._id,
          qty: item.qty,
          priceAtPurchase: product.price,
        });
      }

      const order = await Order.create({
        user: req.userId,
        items: orderItems,
        total,
        status: status || "pending",
        isActive: true,
      });

      await order.populate("items.product");

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        order,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * PUT /orders/:id
 * Update order status
 */
router.put(
  "/:id",
  mongoIdValidation,
  [
    body("status")
      .optional()
      .isIn(["pending", "completed", "cancelled"])
      .withMessage("Invalid status"),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { status } = req.body;

      const query: any = {
        _id: req.params.id,
        isActive: true,
      };

      // Admin can update any order, users can only update their own
      if (req.user?.role !== "admin") {
        query.user = req.userId;
      }

      const order = await Order.findOne(query);

      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      // Admin can update any order, users can only update their own pending orders
      if (status) {
        if (req.user?.role !== "admin" && order.status !== "pending") {
          res.status(400).json({
            message: "Only pending orders can be updated by non-admin users",
          });
          return;
        }
        order.status = status;
        await order.save();
      }

      await order.populate("items.product");

      res.json({
        success: true,
        message: "Order updated successfully",
        order,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * DELETE /orders/:id
 * Cancel an order (only if pending)
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

      const query: any = {
        _id: req.params.id,
        isActive: true,
      };

      // Admin can cancel any order, users can only cancel their own
      if (req.user?.role !== "admin") {
        query.user = req.userId;
      }

      const order = await Order.findOne(query);

      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      // Admin can cancel any order, users can only cancel their own pending orders
      if (req.user?.role !== "admin") {
        if (order.status !== "pending") {
          res.status(400).json({
            message: "Only pending orders can be cancelled",
          });
          return;
        }
      }

      order.status = "cancelled";
      order.isActive = false;
      await order.save();

      res.json({
        success: true,
        message: "Order cancelled successfully",
        order,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

export default router;
