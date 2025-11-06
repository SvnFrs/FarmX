import { Router, Request, Response } from "express";
import Product from "../models/Product";
import { authenticate, AuthRequest, isAdmin } from "../middleware/auth";
import { mongoIdValidation } from "../middleware/validation";
import { validationResult } from "express-validator";
import { body } from "express-validator";

const router = Router();

/**
 * GET /products
 * Get all products (public or authenticated)
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const { isActive } = req.query;
    const query: any = { isActive: isActive !== "false" };

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      products,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: String(error) });
  }
});

/**
 * GET /products/:id
 * Get a single product
 */
router.get(
  "/:id",
  mongoIdValidation,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const product = await Product.findOne({
        _id: req.params.id,
        isActive: true,
      });

      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      res.json({
        success: true,
        product,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * POST /products
 * Create a new product (admin only)
 */
router.post(
  "/",
  authenticate,
  isAdmin,
  [
    body("name").trim().notEmpty().withMessage("Product name is required"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
    body("sku").optional().trim(),
    body("description").optional().trim(),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { name, price, sku, description } = req.body;

      const product = await Product.create({
        name,
        price,
        sku,
        description,
        isActive: true,
      });

      res.status(201).json({
        success: true,
        product,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(400).json({ message: "SKU already exists" });
        return;
      }
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * PUT /products/:id
 * Update a product (admin only)
 */
router.put(
  "/:id",
  authenticate,
  isAdmin,
  mongoIdValidation,
  [
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Product name cannot be empty"),
    body("price")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
    body("sku").optional().trim(),
    body("description").optional().trim(),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const product = await Product.findOneAndUpdate(
        { _id: req.params.id, isActive: true },
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      res.json({
        success: true,
        product,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(400).json({ message: "SKU already exists" });
        return;
      }
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

/**
 * DELETE /products/:id
 * Delete a product (admin only)
 */
router.delete(
  "/:id",
  authenticate,
  isAdmin,
  mongoIdValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const product = await Product.findOneAndUpdate(
        { _id: req.params.id, isActive: true },
        { isActive: false },
        { new: true }
      );

      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      res.json({
        success: true,
        message: "Product deleted successfully",
        product,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: String(error) });
    }
  }
);

export default router;
