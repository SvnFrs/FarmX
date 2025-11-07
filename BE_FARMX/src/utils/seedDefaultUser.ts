import User from "../models/User";
import bcrypt from "bcrypt";
import logger from "./logger";

export async function seedDefaultUser(): Promise<void> {
  try {
    const username = process.env.DEFAULT_USER_USERNAME || "user";
    const password = process.env.DEFAULT_USER_PASSWORD || "user";

    const exists = await User.findOne({ username }).exec();

    if (!exists) {
      const hash = await bcrypt.hash(password, 10);
      await User.create({
        username,
        password: hash,
        role: "user",
        subLevel: 0,
        cart: { items: [] },
        ownedProducts: [],
      });
      logger.info(`Default user created: ${username}`);
    } else {
      logger.info("Default user already exists");
    }
  } catch (error) {
    logger.error("Error seeding default user:", error);
    throw error;
  }
}
