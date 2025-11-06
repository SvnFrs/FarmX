import dotenv from "dotenv";
import app from "./app";
import { connectDB } from "./utils/db";
import { seedDefaultUser } from "./utils/seedDefaultUser";
import logger from "./utils/logger";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4000;

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Seed default user if not exists
    await seedDefaultUser();

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`📚 API base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
