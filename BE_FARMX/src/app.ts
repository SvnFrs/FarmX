import express, { Application, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import * as YAML from "yamljs";
import path from "path";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import logger from "./utils/logger";

// Import routes
import authRoutes from "./routes/auth";
import farmRoutes from "./routes/farms";
import pondRoutes from "./routes/ponds";
import scanRoutes from "./routes/scans";
import productRoutes from "./routes/products";
import cartRoutes from "./routes/cart";
import orderRoutes from "./routes/orders";
import userRoutes from "./routes/users";
import dashboardRoutes from "./routes/dashboard";
import analyticsRoutes from "./routes/analytics";
import alertRoutes from "./routes/alerts";
import notificationRoutes from "./routes/notifications";
import subscriptionRoutes from "./routes/subscriptions";
import deviceRoutes from "./routes/devices";
import weatherRoutes from "./routes/weather";
import supportRoutes from "./routes/support";
import aiRoutes from "./routes/ai";

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV !== "test") {
  app.use(
    morgan("combined", {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    })
  );
}

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "FarmX API is running",
    timestamp: new Date().toISOString(),
  });
});

// Swagger UI
try {
  // In development (ts-node-dev), __dirname is src/
  // In production (compiled), __dirname is dist/
  // openapi.yaml is in the project root
  const swaggerPath = path.join(__dirname, "../openapi.yaml");
  const swaggerDocument = YAML.load(swaggerPath);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "FarmX API Documentation",
  }));
  logger.info("Swagger UI available at /api-docs");
} catch (error) {
  logger.warn("Could not load Swagger documentation:", error);
}

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/farms", farmRoutes);
app.use("/api/farms", pondRoutes); // Nested routes: /api/farms/:farmId/ponds
app.use("/api/ponds", pondRoutes); // Direct pond routes
app.use("/api/scans", scanRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/ai", aiRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
