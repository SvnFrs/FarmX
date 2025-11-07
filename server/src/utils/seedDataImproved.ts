import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { connectDB } from "./db";

// Load environment variables
dotenv.config();
import User from "../models/User";
import Farm from "../models/Farm";
import Pond from "../models/Pond";
import Product from "../models/Product";
import ScanResult from "../models/ScanResult";
import Subscription from "../models/Subscription";
import { Types } from "mongoose";

/**
 * Improved seed script based on client/components/screens/ShopScreen.tsx data
 * This matches the exact products and subscription plans shown in the UI
 */

const seedDataImproved = async (): Promise<void> => {
  try {
    console.log("🌱 Starting improved data seeding (matching client UI)...");

    // Connect to database
    await connectDB();

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Farm.deleteMany({}),
      Pond.deleteMany({}),
      Product.deleteMany({}),
      ScanResult.deleteMany({}),
      Subscription.deleteMany({}),
    ]);

    // ==================== USERS ====================
    console.log("👥 Creating users...");
    const hashedPassword = await bcrypt.hash("user", 10); // Default: user/user

    const users = await User.insertMany([
      {
        username: "user",
        password: hashedPassword,
        email: "user@farmx.com",
        fullName: "Demo User",
        phone: "+84901234567",
        role: "user",
        subLevel: 0, // Free tier
        isActive: true,
      },
      {
        username: "admin",
        password: await bcrypt.hash("admin", 10),
        email: "admin@farmx.com",
        fullName: "Admin User",
        phone: "+84123456789",
        role: "admin",
        subLevel: 2, // Premium tier
        isActive: true,
      },
      {
        username: "farmer1",
        password: hashedPassword,
        email: "farmer1@farmx.com",
        fullName: "Nguyễn Văn An",
        phone: "+84901234568",
        role: "user",
        subLevel: 1, // Basic tier
        isActive: true,
      },
    ]);

    console.log(`✅ Created ${users.length} users`);

    // ==================== PRODUCTS (Based on ShopScreen devices) ====================
    console.log("📦 Creating products (matching UI devices)...");
    
    const products = await Product.insertMany([
      // Smart Devices from ShopScreen
      {
        name: "FarmX Smart Camera",
        price: 499,
        currency: "USD",
        sku: "DEVICE-CAMERA",
        description: "AI-powered camera with automatic shrimp detection",
        category: "device",
        specs: {
          features: [
            "4K resolution",
            "Waterproof IP68",
            "Night vision",
            "Auto-scan mode",
            "Wi-Fi & 4G connectivity",
          ],
        },
        inStock: true,
        stockQuantity: 25,
        isActive: true,
      },
      {
        name: "Water Quality Monitor",
        price: 299,
        currency: "USD",
        sku: "DEVICE-MONITOR",
        description: "Real-time water parameter monitoring",
        category: "device",
        specs: {
          features: [
            "pH, DO, Temperature sensors",
            "Wireless data transmission",
            "Mobile app integration",
            "Alert notifications",
            "6-month battery life",
          ],
        },
        inStock: true,
        stockQuantity: 40,
        isActive: true,
      },
      {
        name: "Auto Feeder Pro",
        price: 399,
        currency: "USD",
        sku: "DEVICE-FEEDER",
        description: "Smart feeding system with scheduling",
        category: "device",
        specs: {
          features: [
            "Programmable schedule",
            "Portion control",
            "Weather adaptation",
            "Remote control",
            "Feed level monitoring",
          ],
        },
        inStock: false, // Out of stock as per UI
        stockQuantity: 0,
        isActive: true,
      },
      {
        name: "Complete Farm Kit",
        price: 999,
        currency: "USD",
        sku: "DEVICE-KIT",
        description: "All-in-one solution for modern shrimp farming",
        category: "device",
        specs: {
          features: [
            "Smart Camera",
            "Water Monitor",
            "Auto Feeder",
            "Premium subscription (1 year)",
            "Free installation",
          ],
          popular: true,
        },
        inStock: true,
        stockQuantity: 10,
        isActive: true,
      },

      // Additional Vietnamese products (from seedData.ts)
      {
        name: "Thức ăn tôm cao cấp Premium",
        price: 250000,
        currency: "VND",
        sku: "FEED-001",
        description: "Thức ăn tôm chất lượng cao, giàu protein",
        category: "feed",
        inStock: true,
        stockQuantity: 100,
        isActive: true,
      },
      {
        name: "Chế phẩm sinh học EM",
        price: 350000,
        currency: "VND",
        sku: "BIO-001",
        description: "Chế phẩm vi sinh xử lý nước ao",
        category: "bio",
        inStock: true,
        stockQuantity: 50,
        isActive: true,
      },
      {
        name: "Test kit nước ao",
        price: 150000,
        currency: "VND",
        sku: "TEST-001",
        description: "Bộ test kiểm tra chất lượng nước",
        category: "testing",
        inStock: true,
        stockQuantity: 75,
        isActive: true,
      },
      {
        name: "Vitamin tổng hợp thủy sản",
        price: 280000,
        currency: "VND",
        sku: "VIT-001",
        description: "Bổ sung vitamin cho thủy sản",
        category: "medicine",
        inStock: true,
        stockQuantity: 60,
        isActive: true,
      },
    ]);

    console.log(`✅ Created ${products.length} products`);

    // ==================== SUBSCRIPTIONS (Free tier for all users) ====================
    console.log("💳 Creating subscriptions...");
    
    const subscriptions = await Subscription.insertMany([
      {
        user: users[0]._id, // Default user - Free
        plan: "free",
        status: "active",
        price: 0,
        currency: "USD",
        isActive: true,
      },
      {
        user: users[1]._id, // Admin - Premium
        plan: "premium",
        status: "active",
        price: 29.99,
        currency: "USD",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        paymentHistory: [
          {
            date: new Date(),
            amount: 29.99,
            status: "success",
            transactionId: `txn_${Date.now()}`,
          },
        ],
        isActive: true,
      },
      {
        user: users[2]._id, // Farmer1 - Basic
        plan: "premium", // Using premium as basic equivalent
        status: "active",
        price: 9.99,
        currency: "USD",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paymentHistory: [
          {
            date: new Date(),
            amount: 9.99,
            status: "success",
            transactionId: `txn_${Date.now() - 1000}`,
          },
        ],
        isActive: true,
      },
    ]);

    // Update users with subscription references
    await User.findByIdAndUpdate(users[0]._id, { subscription: subscriptions[0]._id });
    await User.findByIdAndUpdate(users[1]._id, { subscription: subscriptions[1]._id });
    await User.findByIdAndUpdate(users[2]._id, { subscription: subscriptions[2]._id });

    console.log(`✅ Created ${subscriptions.length} subscriptions`);

    // ==================== FARMS ====================
    console.log("🏭 Creating farms...");
    
    const farms = await Farm.insertMany([
      {
        name: "Trang trại Demo",
        location: "Cà Mau, Việt Nam",
        owner: users[0]._id,
        status: "active",
        description: "Trang trại mẫu cho demo",
        isActive: true,
      },
      {
        name: "Trang trại tôm sú Bạc Liêu",
        location: "Bạc Liêu, Việt Nam",
        owner: users[0]._id,
        status: "active",
        description: "Nuôi tôm sú chất lượng cao",
        isActive: true,
      },
      {
        name: "Farm Admin",
        location: "An Giang, Việt Nam",
        owner: users[1]._id,
        status: "active",
        description: "Trang trại của admin",
        isActive: true,
      },
    ]);

    console.log(`✅ Created ${farms.length} farms`);

    // ==================== PONDS ====================
    console.log("🐟 Creating ponds...");
    
    const ponds = await Pond.insertMany([
      {
        name: "Ao số 1",
        farm: farms[0]._id,
        area: 5000,
        depth: 1.5,
        status: "active",
        isActive: true,
      },
      {
        name: "Ao số 2",
        farm: farms[0]._id,
        area: 4500,
        depth: 1.8,
        status: "active",
        isActive: true,
      },
      {
        name: "Ao tôm sú A",
        farm: farms[1]._id,
        area: 6000,
        depth: 2.0,
        status: "active",
        isActive: true,
      },
      {
        name: "Ao tôm sú B",
        farm: farms[1]._id,
        area: 5500,
        depth: 1.7,
        status: "maintenance",
        isActive: true,
      },
      {
        name: "Ao Admin",
        farm: farms[2]._id,
        area: 7000,
        depth: 2.2,
        status: "active",
        isActive: true,
      },
    ]);

    console.log(`✅ Created ${ponds.length} ponds`);

    // ==================== SAMPLE SCAN RESULTS ====================
    console.log("📊 Creating sample scan results...");
    
    const scanResults = await ScanResult.insertMany([
      {
        pond: ponds[0]._id,
        user: users[0]._id,
        imageUrl: "https://example.com/scan1.jpg",
        result: {
          healthStatus: "healthy",
          confidence: 0.92,
          parameters: {
            size: "medium",
            color: "normal",
            activity: "active",
          },
          recommendations: [
            "Maintain current feeding schedule",
            "Monitor water quality regularly",
          ],
        },
        metadata: {
          temperature: 28.5,
          ph: 7.8,
          salinity: 15,
        },
      },
      {
        pond: ponds[0]._id,
        user: users[0]._id,
        imageUrl: "https://example.com/scan2.jpg",
        result: {
          healthStatus: "warning",
          confidence: 0.78,
          parameters: {
            size: "small",
            color: "pale",
            activity: "sluggish",
          },
          recommendations: [
            "Check water oxygen levels",
            "Consider reducing feeding amount",
            "Monitor for disease symptoms",
          ],
        },
        metadata: {
          temperature: 29.2,
          ph: 7.5,
          salinity: 16,
        },
      },
    ]);

    console.log(`✅ Created ${scanResults.length} scan results`);

    // ==================== SUMMARY ====================
    console.log("\n🎉 Seeding completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   📦 Products: ${products.length} (including 4 UI devices)`);
    console.log(`   💳 Subscriptions: ${subscriptions.length}`);
    console.log(`   🏭 Farms: ${farms.length}`);
    console.log(`   🐟 Ponds: ${ponds.length}`);
    console.log(`   📊 Scan Results: ${scanResults.length}`);
    console.log("\n🔑 Default login credentials:");
    console.log("   Username: user");
    console.log("   Password: user");
    console.log("\n🚀 You can now start the server and test the app!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedDataImproved();
}

export default seedDataImproved;
