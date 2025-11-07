import { body, param, query, ValidationChain } from "express-validator";

export const loginValidation: ValidationChain[] = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 3 })
    .withMessage("Password must be at least 3 characters"),
];

export const createFarmValidation: ValidationChain[] = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Farm name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Farm name must be between 2 and 100 characters"),
  body("location")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Location must not exceed 200 characters"),
];

export const createPondValidation: ValidationChain[] = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Pond name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Pond name must be between 2 and 100 characters"),
  body("area")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Area must be a positive number"),
];

export const updatePondValidation: ValidationChain[] = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Pond name cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage("Pond name must be between 2 and 100 characters"),
  body("area")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Area must be a positive number"),
  body("status")
    .optional()
    .isIn(["active", "inactive", "maintenance"])
    .withMessage("Status must be one of: active, inactive, maintenance"),
];

export const createScanValidation: ValidationChain[] = [
  body("deviceId")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Device ID must not exceed 100 characters"),
  body("metrics")
    .notEmpty()
    .withMessage("Metrics are required")
    .isObject()
    .withMessage("Metrics must be an object"),
  body("rawData")
    .optional()
    .isObject()
    .withMessage("Raw data must be an object"),
  body("saveToPondId").optional().isMongoId().withMessage("Invalid pond ID"),
];

export const addToCartValidation: ValidationChain[] = [
  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),
  body("qty")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
];

export const updateSubscriptionValidation: ValidationChain[] = [
  body("subLevel")
    .notEmpty()
    .withMessage("Subscription level is required")
    .isInt({ min: 0 })
    .withMessage("Subscription level must be a non-negative integer"),
];

export const analyticsQueryValidation: ValidationChain[] = [
  query("from")
    .optional()
    .isISO8601()
    .withMessage("From date must be in ISO 8601 format (YYYY-MM-DD)"),
  query("to")
    .optional()
    .isISO8601()
    .withMessage("To date must be in ISO 8601 format (YYYY-MM-DD)"),
];

export const mongoIdValidation: ValidationChain[] = [
  param("id").isMongoId().withMessage("Invalid ID format"),
];

export const registerValidation: ValidationChain[] = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-z0-9_]+$/)
    .withMessage("Username can only contain lowercase letters, numbers, and underscores"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Invalid email format"),
  body("fullName")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Full name must not exceed 100 characters"),
  body("phone")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("Phone must not exceed 20 characters"),
];

export const updateProfileValidation: ValidationChain[] = [
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Invalid email format"),
  body("fullName")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Full name must not exceed 100 characters"),
  body("phone")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("Phone must not exceed 20 characters"),
];
