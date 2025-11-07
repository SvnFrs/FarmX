import { Router, Response } from "express";
import User from "../models/User";
import Product from "../models/Product";
import Order from "../models/Order";
import { authenticate, AuthRequest } from "../middleware/auth";
import { addToCartValidation } from "../middleware/validation";
import { validationResult, body } from "express-validator";

const router = Router();

// All cart routes require authentication
router.use(authenticate);

/**
 * GET /cart
 * Get current user's cart
 */
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).populate("cart.items.product");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Calculate total
    let total = 0;
    const items = (user.cart?.items || []).map((item: any) => {
      const itemTotal = item.product.price * item.qty;
      total += itemTotal;
      return {
        product: item.product,
        qty: item.qty,
        itemTotal,
      };
    });

    res.json({
      success: true,
      cart: {
        items,
        total,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: String(error) });
  }
});

/**
 * POST /cart
 * Add item to cart or update quantity if already exists
 */
router.post(
  "/",
  addToCartValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { productId, qty } = req.body;

      // Verify product exists and is active
      const product = await Product.findOne({
        _id: productId,
        isActive: true,
      });
      if (!product) {
        res.status(404).json({ message: "Product not found or inactive" });
        return;
      }

      const user = await User.findById(req.userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Initialize cart if it doesn't exist
      if (!user.cart) {
        user.cart = { items: [] };
      }

      // Check if product already in cart
      const existingItemIndex = user.cart.items.findIndex(
        (item: any) => item.product.toString() === productId
      );

      if (existingItemIndex > -1) {
        // Update quantity
        user.cart.items[existingItemIndex].qty = qty;
      } else {
        // Add new item
        user.cart.items.push({ product: productId, qty });
      }

      await user.save();

      // Populate and return cart
      await user.populate("cart.items.product");

      res.json({
        success: true,
        message: "Item added to cart",
        cart: user.cart,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * PUT /cart/:productId
 * Update item quantity in cart
 */
router.put(
  "/:productId",
  [body("qty").isInt({ min: 1 }).withMessage("Quantity must be at least 1")],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { productId } = req.params;
      const { qty } = req.body;

      // Verify product exists and is active
      const product = await Product.findOne({
        _id: productId,
        isActive: true,
      });
      if (!product) {
        res.status(404).json({ message: "Product not found or inactive" });
        return;
      }

      const user = await User.findById(req.userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      if (!user.cart || !user.cart.items) {
        res.status(400).json({ message: "Cart is empty" });
        return;
      }

      // Find and update item
      const itemIndex = user.cart.items.findIndex(
        (item: any) => item.product.toString() === productId
      );

      if (itemIndex === -1) {
        res.status(404).json({ message: "Item not found in cart" });
        return;
      }

      user.cart.items[itemIndex].qty = qty;
      await user.save();

      // Populate and return cart
      await user.populate("cart.items.product");

      res.json({
        success: true,
        message: "Cart item updated",
        cart: user.cart,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * DELETE /cart/:productId
 * Remove item from cart
 */
router.delete(
  "/:productId",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;

      const user = await User.findById(req.userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      if (!user.cart || !user.cart.items) {
        res.status(400).json({ message: "Cart is empty" });
        return;
      }

      // Remove item from cart
      user.cart.items = user.cart.items.filter(
        (item: any) => item.product.toString() !== productId
      );

      await user.save();

      // Populate and return cart
      await user.populate("cart.items.product");

      res.json({
        success: true,
        message: "Item removed from cart",
        cart: user.cart,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * DELETE /cart
 * Clear entire cart
 */
router.delete("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (!user.cart) {
      user.cart = { items: [] };
    } else {
      user.cart.items = [];
    }

    await user.save();

    res.json({
      success: true,
      message: "Cart cleared",
      cart: { items: [] },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: String(error) });
  }
});

/**
 * POST /cart/checkout
 * Checkout cart - create order and transfer products to user's ownedProducts
 */
router.post(
  "/checkout",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await User.findById(req.userId).populate(
        "cart.items.product"
      );

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      if (!user.cart || !user.cart.items || user.cart.items.length === 0) {
        res.status(400).json({ message: "Cart is empty" });
        return;
      }

      // Verify all products are still active
      for (const item of user.cart.items) {
        const productId = item.product._id || item.product;
        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
          res.status(400).json({
            message: `Product ${productId} is no longer available`,
          });
          return;
        }
      }

      // Prepare order items and calculate total
      let total = 0;
      const orderItems = user.cart.items.map((item: any) => {
        const itemTotal = item.product.price * item.qty;
        total += itemTotal;

        return {
          product: item.product._id,
          qty: item.qty,
          priceAtPurchase: item.product.price,
        };
      });

      // Create order
      const order = await Order.create({
        user: req.userId,
        items: orderItems,
        total,
        status: "completed",
        isActive: true,
      });

      // Add products to user's ownedProducts
      if (!user.ownedProducts) {
        user.ownedProducts = [];
      }

      user.cart.items.forEach((item: any) => {
        // Add product ID for each quantity (if qty > 1, add multiple times)
        for (let i = 0; i < item.qty; i++) {
          user.ownedProducts!.push(item.product._id);
        }
      });

      // Clear cart
      user.cart.items = [];

      await user.save();

      // Populate order before returning
      await order.populate("items.product");

      res.json({
        success: true,
        message: "Checkout successful",
        order,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

export default router;
