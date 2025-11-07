import mongoose from "mongoose";
import logger from "./logger";

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI =
      process.env.MONGO_URI || "mongodb://localhost:27017/farmdb";

    await mongoose.connect(mongoURI);

    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Handle mongoose events
mongoose.connection.on("connected", () => {
  logger.info("Mongoose connected to DB");
});

mongoose.connection.on("error", (err) => {
  logger.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("Mongoose disconnected");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  logger.info("Mongoose connection closed through app termination");
  process.exit(0);
});
