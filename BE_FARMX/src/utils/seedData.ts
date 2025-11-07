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
import Alert from "../models/Alert";
import Device from "../models/Device";
import Support from "../models/Support";
import Subscription from "../models/Subscription";
import Order from "../models/Order";
import { Types } from "mongoose";

const seedData = async (): Promise<void> => {
  try {
    console.log("🌱 Starting data seeding...");

    // Connect to database
    await connectDB();

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log("🗑️  Clearing existing data...");
    try {
      await User.deleteMany({});
      await Farm.deleteMany({});
      await Pond.deleteMany({});
      await Product.deleteMany({});
      await ScanResult.deleteMany({});
      await Alert.deleteMany({});
      await Device.deleteMany({});
      await Support.deleteMany({});
      await Subscription.deleteMany({});
      await Order.deleteMany({});
    } catch (error: any) {
      // If delete fails (e.g., no data or auth issue), continue anyway
      if (error.code !== 13) {
        // Not an auth error, rethrow
        throw error;
      }
      console.log("⚠️  Could not clear existing data, continuing with seed...");
    }

    // 1. Create Users (10 users)
    console.log("👥 Creating users...");
    const hashedPassword = await bcrypt.hash("password123", 10);
    const users = await User.insertMany([
      {
        username: "admin",
        password: hashedPassword,
        email: "admin@farmx.com",
        fullName: "Admin User",
        phone: "+84123456789",
        role: "admin",
        subLevel: 2,
        isActive: true,
      },
      {
        username: "expert1",
        password: hashedPassword,
        email: "expert1@farmx.com",
        fullName: "Expert One",
        phone: "+84123456790",
        role: "expert",
        subLevel: 2,
        isActive: true,
      },
      {
        username: "expert2",
        password: hashedPassword,
        email: "expert2@farmx.com",
        fullName: "Expert Two",
        phone: "+84123456791",
        role: "expert",
        subLevel: 2,
        isActive: true,
      },
      {
        username: "farmer1",
        password: hashedPassword,
        email: "farmer1@farmx.com",
        fullName: "Nguyen Van A",
        phone: "+84901234567",
        role: "user",
        subLevel: 1,
        isActive: true,
      },
      {
        username: "farmer2",
        password: hashedPassword,
        email: "farmer2@farmx.com",
        fullName: "Tran Thi B",
        phone: "+84901234568",
        role: "user",
        subLevel: 1,
        isActive: true,
      },
      {
        username: "farmer3",
        password: hashedPassword,
        email: "farmer3@farmx.com",
        fullName: "Le Van C",
        phone: "+84901234569",
        role: "user",
        subLevel: 0,
        isActive: true,
      },
      {
        username: "farmer4",
        password: hashedPassword,
        email: "farmer4@farmx.com",
        fullName: "Pham Thi D",
        phone: "+84901234570",
        role: "user",
        subLevel: 1,
        isActive: true,
      },
      {
        username: "farmer5",
        password: hashedPassword,
        email: "farmer5@farmx.com",
        fullName: "Hoang Van E",
        phone: "+84901234571",
        role: "user",
        subLevel: 0,
        isActive: true,
      },
      {
        username: "farmer6",
        password: hashedPassword,
        email: "farmer6@farmx.com",
        fullName: "Vu Thi F",
        phone: "+84901234572",
        role: "user",
        subLevel: 2,
        isActive: true,
      },
      {
        username: "farmer7",
        password: hashedPassword,
        email: "farmer7@farmx.com",
        fullName: "Dao Van G",
        phone: "+84901234573",
        role: "user",
        subLevel: 1,
        isActive: true,
      },
    ]);

    console.log(`✅ Created ${users.length} users`);

    // 2. Create Products (10 products)
    console.log("📦 Creating products...");
    const products = await Product.insertMany([
      {
        name: "Thức ăn tôm cao cấp Premium",
        price: 250000,
        sku: "PROD-001",
        description: "Thức ăn tôm chất lượng cao, giàu protein",
        isActive: true,
      },
      {
        name: "Thức ăn cá tra",
        price: 180000,
        sku: "PROD-002",
        description: "Thức ăn chuyên dụng cho cá tra",
        isActive: true,
      },
      {
        name: "Chế phẩm sinh học EM",
        price: 350000,
        sku: "PROD-003",
        description: "Chế phẩm vi sinh xử lý nước ao",
        isActive: true,
      },
      {
        name: "Máy đo pH nước",
        price: 1200000,
        sku: "PROD-004",
        description: "Thiết bị đo độ pH chính xác",
        isActive: true,
      },
      {
        name: "Máy đo oxy hòa tan",
        price: 2500000,
        sku: "PROD-005",
        description: "Thiết bị đo nồng độ oxy trong nước",
        isActive: true,
      },
      {
        name: "Thuốc kháng sinh cho tôm",
        price: 450000,
        sku: "PROD-006",
        description: "Thuốc điều trị bệnh cho tôm",
        isActive: true,
      },
      {
        name: "Vitamin tổng hợp",
        price: 280000,
        sku: "PROD-007",
        description: "Bổ sung vitamin cho thủy sản",
        isActive: true,
      },
      {
        name: "Máy sục khí",
        price: 3500000,
        sku: "PROD-008",
        description: "Máy tạo oxy cho ao nuôi",
        isActive: true,
      },
      {
        name: "Lưới chắn chim",
        price: 800000,
        sku: "PROD-009",
        description: "Lưới bảo vệ ao khỏi chim",
        isActive: true,
      },
      {
        name: "Test kit nước ao",
        price: 150000,
        sku: "PROD-010",
        description: "Bộ test kiểm tra chất lượng nước",
        isActive: true,
      },
    ]);

    console.log(`✅ Created ${products.length} products`);

    // 3. Create Farms (10 farms)
    console.log("🏭 Creating farms...");
    const farms = await Farm.insertMany([
      {
        name: "Trang trại tôm số 1",
        location: "Cà Mau, Việt Nam",
        owner: users[3]._id,
        status: "active",
        description: "Trang trại nuôi tôm thẻ chân trắng",
        isActive: true,
      },
      {
        name: "Trang trại cá tra An Giang",
        location: "An Giang, Việt Nam",
        owner: users[3]._id,
        status: "active",
        description: "Chuyên nuôi cá tra thương phẩm",
        isActive: true,
      },
      {
        name: "Farm tôm sú Bạc Liêu",
        location: "Bạc Liêu, Việt Nam",
        owner: users[4]._id,
        status: "active",
        description: "Nuôi tôm sú chất lượng cao",
        isActive: true,
      },
      {
        name: "Trang trại thủy sản Đồng Tháp",
        location: "Đồng Tháp, Việt Nam",
        owner: users[4]._id,
        status: "active",
        description: "Đa dạng loài thủy sản",
        isActive: true,
      },
      {
        name: "Farm tôm công nghệ cao",
        location: "Kiên Giang, Việt Nam",
        owner: users[5]._id,
        status: "active",
        description: "Ứng dụng công nghệ IoT",
        isActive: true,
      },
      {
        name: "Trang trại cá rô phi",
        location: "Tiền Giang, Việt Nam",
        owner: users[6]._id,
        status: "active",
        description: "Nuôi cá rô phi thương phẩm",
        isActive: true,
      },
      {
        name: "Farm tôm càng xanh",
        location: "Long An, Việt Nam",
        owner: users[7]._id,
        status: "active",
        description: "Chuyên nuôi tôm càng xanh",
        isActive: true,
      },
      {
        name: "Trang trại thủy sản tổng hợp",
        location: "Sóc Trăng, Việt Nam",
        owner: users[8]._id,
        status: "active",
        description: "Nuôi đa loài thủy sản",
        isActive: true,
      },
      {
        name: "Farm tôm thẻ chân trắng",
        location: "Bến Tre, Việt Nam",
        owner: users[9]._id,
        status: "active",
        description: "Nuôi tôm thẻ chân trắng xuất khẩu",
        isActive: true,
      },
      {
        name: "Trang trại cá lóc",
        location: "Cần Thơ, Việt Nam",
        owner: users[9]._id,
        status: "inactive",
        description: "Nuôi cá lóc thương phẩm",
        isActive: true,
      },
    ]);

    console.log(`✅ Created ${farms.length} farms`);

    // 4. Create Ponds (10 ponds)
    console.log("🐟 Creating ponds...");
    const ponds = await Pond.insertMany([
      {
        name: "Ao tôm số 1",
        farm: farms[0]._id,
        area: 5000,
        status: "active",
        isActive: true,
      },
      {
        name: "Ao tôm số 2",
        farm: farms[0]._id,
        area: 4500,
        status: "active",
        isActive: true,
      },
      {
        name: "Ao cá tra chính",
        farm: farms[1]._id,
        area: 8000,
        status: "active",
        isActive: true,
      },
      {
        name: "Ao tôm sú A",
        farm: farms[2]._id,
        area: 6000,
        status: "active",
        isActive: true,
      },
      {
        name: "Ao tôm sú B",
        farm: farms[2]._id,
        area: 5500,
        status: "maintenance",
        isActive: true,
      },
      {
        name: "Ao đa loài 1",
        farm: farms[3]._id,
        area: 7000,
        status: "active",
        isActive: true,
      },
      {
        name: "Ao tôm IoT",
        farm: farms[4]._id,
        area: 4000,
        status: "active",
        isActive: true,
      },
      {
        name: "Ao cá rô phi",
        farm: farms[5]._id,
        area: 6500,
        status: "active",
        isActive: true,
      },
      {
        name: "Ao tôm càng xanh",
        farm: farms[6]._id,
        area: 5000,
        status: "active",
        isActive: true,
      },
      {
        name: "Ao tổng hợp",
        farm: farms[7]._id,
        area: 9000,
        status: "active",
        isActive: true,
      },
    ]);

    console.log(`✅ Created ${ponds.length} ponds`);

    // 5. Create Devices (10 devices)
    console.log("📱 Creating devices...");
    const devices = await Device.insertMany([
      {
        user: users[3]._id,
        name: "Camera ao tôm 1",
        type: "camera",
        deviceModel: "CAM-2024",
        serialNumber: "CAM001",
        status: "online",
        farm: farms[0]._id,
        pond: ponds[0]._id,
        settings: { autoRecord: true, resolution: "1080p" },
        lastSeen: new Date(),
        isActive: true,
      },
      {
        user: users[3]._id,
        name: "Máy cho ăn tự động",
        type: "feeder",
        deviceModel: "FEED-2024",
        serialNumber: "FEED001",
        status: "online",
        farm: farms[0]._id,
        pond: ponds[0]._id,
        settings: {
          autoFeed: true,
          feedSchedule: [
            { time: "07:00", amount: 5 },
            { time: "12:00", amount: 5 },
            { time: "17:00", amount: 5 },
          ],
        },
        lastSeen: new Date(),
        isActive: true,
      },
      {
        user: users[4]._id,
        name: "Cảm biến nước ao 1",
        type: "sensor",
        deviceModel: "SENSOR-2024",
        serialNumber: "SENSOR001",
        status: "online",
        farm: farms[1]._id,
        pond: ponds[2]._id,
        settings: { interval: 300, alertThreshold: true },
        lastSeen: new Date(),
        isActive: true,
      },
      {
        user: users[4]._id,
        name: "Màn hình giám sát",
        type: "monitor",
        deviceModel: "MON-2024",
        serialNumber: "MON001",
        status: "online",
        farm: farms[1]._id,
        settings: { displayMode: "dashboard" },
        lastSeen: new Date(),
        isActive: true,
      },
      {
        user: users[5]._id,
        name: "Camera ao tôm 2",
        type: "camera",
        deviceModel: "CAM-2024",
        serialNumber: "CAM002",
        status: "offline",
        farm: farms[2]._id,
        pond: ponds[3]._id,
        settings: { autoRecord: true },
        lastSeen: new Date(Date.now() - 3600000),
        isActive: true,
      },
      {
        user: users[6]._id,
        name: "Máy sục khí tự động",
        type: "monitor",
        deviceModel: "AERATOR-2024",
        serialNumber: "AER001",
        status: "online",
        farm: farms[3]._id,
        pond: ponds[5]._id,
        settings: { autoMode: true, minOxygen: 5 },
        lastSeen: new Date(),
        isActive: true,
      },
      {
        user: users[7]._id,
        name: "Cảm biến nhiệt độ",
        type: "sensor",
        deviceModel: "TEMP-2024",
        serialNumber: "TEMP001",
        status: "online",
        farm: farms[4]._id,
        pond: ponds[6]._id,
        settings: { interval: 600 },
        lastSeen: new Date(),
        isActive: true,
      },
      {
        user: users[8]._id,
        name: "Camera giám sát tổng",
        type: "camera",
        deviceModel: "CAM-2024",
        serialNumber: "CAM003",
        status: "maintenance",
        farm: farms[5]._id,
        settings: { resolution: "4K" },
        lastSeen: new Date(Date.now() - 7200000),
        isActive: true,
      },
      {
        user: users[9]._id,
        name: "Máy cho ăn ao 2",
        type: "feeder",
        deviceModel: "FEED-2024",
        serialNumber: "FEED002",
        status: "online",
        farm: farms[6]._id,
        pond: ponds[8]._id,
        settings: {
          autoFeed: true,
          feedSchedule: [{ time: "08:00", amount: 8 }],
        },
        lastSeen: new Date(),
        isActive: true,
      },
      {
        user: users[9]._id,
        name: "Hệ thống cảm biến đa năng",
        type: "sensor",
        deviceModel: "MULTI-2024",
        serialNumber: "MULTI001",
        status: "online",
        farm: farms[7]._id,
        pond: ponds[9]._id,
        settings: {
          monitorPH: true,
          monitorOxygen: true,
          monitorTemp: true,
        },
        lastSeen: new Date(),
        isActive: true,
      },
    ]);

    console.log(`✅ Created ${devices.length} devices`);

    // 6. Create Scan Results (10 scans)
    console.log("📊 Creating scan results...");
    const scanResults = await ScanResult.insertMany([
      {
        pond: ponds[0]._id,
        deviceId: devices[0]._id.toString(),
        healthScore: 85,
        diseasePrediction: {
          disease: "None",
          confidence: 90,
          recommendations: ["Tiếp tục theo dõi", "Duy trì chất lượng nước"],
        },
        metrics: {
          pH: 7.5,
          temperature: 28,
          oxygen: 6.5,
          ammonia: 0.2,
        },
        imageUrl: "https://example.com/scan1.jpg",
        isActive: true,
      },
      {
        pond: ponds[1]._id,
        deviceId: devices[1]._id.toString(),
        healthScore: 78,
        diseasePrediction: {
          disease: "Early Mortality Syndrome",
          confidence: 65,
          recommendations: [
            "Kiểm tra chất lượng nước",
            "Tăng cường sục khí",
            "Theo dõi sát sao",
          ],
        },
        metrics: {
          pH: 7.2,
          temperature: 29,
          oxygen: 5.8,
          ammonia: 0.5,
        },
        imageUrl: "https://example.com/scan2.jpg",
        isActive: true,
      },
      {
        pond: ponds[2]._id,
        deviceId: devices[2]._id.toString(),
        healthScore: 92,
        diseasePrediction: {
          disease: "None",
          confidence: 95,
          recommendations: ["Tình trạng tốt", "Duy trì chế độ chăm sóc"],
        },
        metrics: {
          pH: 7.8,
          temperature: 27,
          oxygen: 7.2,
          ammonia: 0.1,
        },
        imageUrl: "https://example.com/scan3.jpg",
        isActive: true,
      },
      {
        pond: ponds[3]._id,
        deviceId: devices[4]._id.toString(),
        healthScore: 70,
        diseasePrediction: {
          disease: "White Spot Disease",
          confidence: 75,
          recommendations: [
            "Cách ly ao bị bệnh",
            "Xử lý nước bằng thuốc",
            "Giảm mật độ nuôi",
          ],
        },
        metrics: {
          pH: 6.8,
          temperature: 30,
          oxygen: 4.5,
          ammonia: 0.8,
        },
        imageUrl: "https://example.com/scan4.jpg",
        isActive: true,
      },
      {
        pond: ponds[4]._id,
        healthScore: 88,
        diseasePrediction: {
          disease: "None",
          confidence: 88,
          recommendations: ["Chất lượng nước ổn định"],
        },
        metrics: {
          pH: 7.6,
          temperature: 28,
          oxygen: 6.8,
          ammonia: 0.3,
        },
        isActive: true,
      },
      {
        pond: ponds[5]._id,
        deviceId: devices[5]._id.toString(),
        healthScore: 80,
        diseasePrediction: {
          disease: "None",
          confidence: 82,
          recommendations: ["Theo dõi định kỳ"],
        },
        metrics: {
          pH: 7.4,
          temperature: 28.5,
          oxygen: 6.0,
          ammonia: 0.4,
        },
        isActive: true,
      },
      {
        pond: ponds[6]._id,
        deviceId: devices[6]._id.toString(),
        healthScore: 95,
        diseasePrediction: {
          disease: "None",
          confidence: 98,
          recommendations: ["Tuyệt vời", "Tiếp tục duy trì"],
        },
        metrics: {
          pH: 7.9,
          temperature: 27,
          oxygen: 7.5,
          ammonia: 0.1,
        },
        imageUrl: "https://example.com/scan7.jpg",
        isActive: true,
      },
      {
        pond: ponds[7]._id,
        healthScore: 75,
        diseasePrediction: {
          disease: "Bacterial Infection",
          confidence: 70,
          recommendations: ["Sử dụng kháng sinh", "Cải thiện chất lượng nước"],
        },
        metrics: {
          pH: 7.0,
          temperature: 29.5,
          oxygen: 5.5,
          ammonia: 0.6,
        },
        isActive: true,
      },
      {
        pond: ponds[8]._id,
        deviceId: devices[8]._id.toString(),
        healthScore: 82,
        diseasePrediction: {
          disease: "None",
          confidence: 85,
          recommendations: ["Tình trạng ổn định"],
        },
        metrics: {
          pH: 7.5,
          temperature: 28,
          oxygen: 6.2,
          ammonia: 0.3,
        },
        isActive: true,
      },
      {
        pond: ponds[9]._id,
        deviceId: devices[9]._id.toString(),
        healthScore: 90,
        diseasePrediction: {
          disease: "None",
          confidence: 92,
          recommendations: ["Chất lượng tốt", "Duy trì chế độ hiện tại"],
        },
        metrics: {
          pH: 7.7,
          temperature: 27.5,
          oxygen: 7.0,
          ammonia: 0.2,
        },
        imageUrl: "https://example.com/scan10.jpg",
        isActive: true,
      },
    ]);

    console.log(`✅ Created ${scanResults.length} scan results`);

    // 7. Create Alerts (10 alerts)
    console.log("🚨 Creating alerts...");
    const alerts = await Alert.insertMany([
      {
        user: users[3]._id,
        type: "health",
        severity: "high",
        title: "Cảnh báo sức khỏe ao tôm số 1",
        message: "Health score giảm xuống 70, cần kiểm tra ngay",
        relatedFarm: farms[0]._id,
        relatedPond: ponds[0]._id,
        resolved: false,
        isActive: true,
      },
      {
        user: users[3]._id,
        type: "device",
        severity: "medium",
        title: "Thiết bị offline",
        message: "Camera ao tôm số 2 đã offline hơn 1 giờ",
        relatedFarm: farms[0]._id,
        relatedDevice: devices[4]._id,
        resolved: false,
        isActive: true,
      },
      {
        user: users[4]._id,
        type: "health",
        severity: "critical",
        title: "Phát hiện bệnh White Spot",
        message: "Ao tôm sú A có dấu hiệu bệnh White Spot",
        relatedFarm: farms[2]._id,
        relatedPond: ponds[3]._id,
        resolved: false,
        isActive: true,
      },
      {
        user: users[4]._id,
        type: "weather",
        severity: "high",
        title: "Cảnh báo thời tiết",
        message: "Dự báo mưa lớn trong 24h tới",
        relatedFarm: farms[1]._id,
        resolved: true,
        resolvedAt: new Date(),
        isActive: true,
      },
      {
        user: users[5]._id,
        type: "system",
        severity: "low",
        title: "Cập nhật hệ thống",
        message: "Có bản cập nhật mới cho hệ thống",
        resolved: true,
        resolvedAt: new Date(),
        isActive: true,
      },
      {
        user: users[6]._id,
        type: "health",
        severity: "medium",
        title: "Oxy thấp",
        message: "Nồng độ oxy trong ao thấp hơn ngưỡng an toàn",
        relatedFarm: farms[3]._id,
        relatedPond: ponds[5]._id,
        resolved: false,
        isActive: true,
      },
      {
        user: users[7]._id,
        type: "device",
        severity: "low",
        title: "Thiết bị cần bảo trì",
        message: "Camera giám sát cần bảo trì định kỳ",
        relatedFarm: farms[5]._id,
        relatedDevice: devices[7]._id,
        resolved: false,
        isActive: true,
      },
      {
        user: users[8]._id,
        type: "health",
        severity: "high",
        title: "Nhiệt độ cao",
        message: "Nhiệt độ nước vượt ngưỡng an toàn",
        relatedFarm: farms[4]._id,
        relatedPond: ponds[6]._id,
        resolved: false,
        isActive: true,
      },
      {
        user: users[9]._id,
        type: "health",
        severity: "medium",
        title: "pH không ổn định",
        message: "Độ pH dao động nhiều trong ngày",
        relatedFarm: farms[6]._id,
        relatedPond: ponds[8]._id,
        resolved: false,
        isActive: true,
      },
      {
        user: users[9]._id,
        type: "system",
        severity: "low",
        title: "Backup dữ liệu",
        message: "Đã hoàn thành backup dữ liệu tự động",
        resolved: true,
        resolvedAt: new Date(),
        isActive: true,
      },
    ]);

    console.log(`✅ Created ${alerts.length} alerts`);

    // 8. Create Subscriptions (10 subscriptions)
    console.log("💳 Creating subscriptions...");
    const subscriptions = await Subscription.insertMany([
      {
        user: users[0]._id,
        plan: "enterprise",
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        price: 99.99,
        currency: "USD",
        paymentHistory: [
          {
            date: new Date(),
            amount: 99.99,
            status: "success",
            transactionId: "TXN001",
          },
        ],
        isActive: true,
      },
      {
        user: users[1]._id,
        plan: "premium",
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        price: 29.99,
        currency: "USD",
        paymentHistory: [
          {
            date: new Date(),
            amount: 29.99,
            status: "success",
            transactionId: "TXN002",
          },
        ],
        isActive: true,
      },
      {
        user: users[2]._id,
        plan: "premium",
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        price: 29.99,
        currency: "USD",
        paymentHistory: [
          {
            date: new Date(),
            amount: 29.99,
            status: "success",
            transactionId: "TXN003",
          },
        ],
        isActive: true,
      },
      {
        user: users[3]._id,
        plan: "premium",
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        price: 29.99,
        currency: "USD",
        paymentHistory: [
          {
            date: new Date(),
            amount: 29.99,
            status: "success",
            transactionId: "TXN004",
          },
        ],
        isActive: true,
      },
      {
        user: users[4]._id,
        plan: "premium",
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: false,
        price: 29.99,
        currency: "USD",
        paymentHistory: [
          {
            date: new Date(),
            amount: 29.99,
            status: "success",
            transactionId: "TXN005",
          },
        ],
        isActive: true,
      },
      {
        user: users[5]._id,
        plan: "free",
        status: "active",
        startDate: new Date(),
        autoRenew: true,
        price: 0,
        currency: "USD",
        paymentHistory: [],
        isActive: true,
      },
      {
        user: users[6]._id,
        plan: "premium",
        status: "cancelled",
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        autoRenew: false,
        price: 29.99,
        currency: "USD",
        paymentHistory: [
          {
            date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            amount: 29.99,
            status: "success",
            transactionId: "TXN006",
          },
        ],
        isActive: true,
      },
      {
        user: users[7]._id,
        plan: "free",
        status: "active",
        startDate: new Date(),
        autoRenew: true,
        price: 0,
        currency: "USD",
        paymentHistory: [],
        isActive: true,
      },
      {
        user: users[8]._id,
        plan: "enterprise",
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        price: 99.99,
        currency: "USD",
        paymentHistory: [
          {
            date: new Date(),
            amount: 99.99,
            status: "success",
            transactionId: "TXN007",
          },
        ],
        isActive: true,
      },
      {
        user: users[9]._id,
        plan: "premium",
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        price: 29.99,
        currency: "USD",
        paymentHistory: [
          {
            date: new Date(),
            amount: 29.99,
            status: "success",
            transactionId: "TXN008",
          },
        ],
        isActive: true,
      },
    ]);

    // Update users with subscriptions
    for (let i = 0; i < subscriptions.length; i++) {
      await User.findByIdAndUpdate(users[i]._id, {
        subscription: subscriptions[i]._id,
      });
    }

    console.log(`✅ Created ${subscriptions.length} subscriptions`);

    // 9. Create Support Questions (10 questions)
    console.log("💬 Creating support questions...");
    const supportQuestions = await Support.insertMany([
      {
        user: users[3]._id,
        type: "question",
        subject: "Cách xử lý nước ao bị đục",
        message: "Ao của tôi bị đục, không biết xử lý như thế nào?",
        status: "open",
        priority: "high",
        relatedFarm: farms[0]._id,
        relatedPond: ponds[0]._id,
        isActive: true,
      },
      {
        user: users[3]._id,
        type: "issue",
        subject: "Thiết bị không hoạt động",
        message: "Camera không kết nối được",
        status: "answered",
        priority: "medium",
        relatedFarm: farms[0]._id,
        relatedDevice: devices[0]._id,
        expertId: users[1]._id,
        expertResponse: "Vui lòng kiểm tra kết nối mạng và nguồn điện",
        isActive: true,
      },
      {
        user: users[4]._id,
        type: "question",
        subject: "Tôm bị bệnh White Spot",
        message: "Làm thế nào để điều trị bệnh White Spot?",
        status: "answered",
        priority: "high",
        relatedFarm: farms[2]._id,
        relatedPond: ponds[3]._id,
        expertId: users[1]._id,
        expertResponse:
          "Cần cách ly ao, xử lý nước bằng thuốc và giảm mật độ nuôi",
        isActive: true,
      },
      {
        user: users[5]._id,
        type: "feature_request",
        subject: "Thêm tính năng cảnh báo tự động",
        message: "Mong muốn có tính năng cảnh báo tự động qua SMS",
        status: "open",
        priority: "low",
        isActive: true,
      },
      {
        user: users[6]._id,
        type: "question",
        subject: "Cách tăng oxy trong ao",
        message: "Oxy trong ao thấp, làm sao để tăng?",
        status: "open",
        priority: "high",
        relatedFarm: farms[3]._id,
        relatedPond: ponds[5]._id,
        isActive: true,
      },
      {
        user: users[7]._id,
        type: "issue",
        subject: "Lỗi hiển thị dữ liệu",
        message: "Dashboard không hiển thị đúng dữ liệu",
        status: "closed",
        priority: "medium",
        expertId: users[2]._id,
        expertResponse: "Đã khắc phục, vui lòng refresh lại trang",
        isActive: true,
      },
      {
        user: users[8]._id,
        type: "question",
        subject: "Chế độ cho ăn tối ưu",
        message: "Nên cho tôm ăn bao nhiêu lần một ngày?",
        status: "answered",
        priority: "medium",
        relatedFarm: farms[4]._id,
        expertId: users[1]._id,
        expertResponse: "Nên cho ăn 3-4 lần/ngày, tùy theo giai đoạn",
        isActive: true,
      },
      {
        user: users[9]._id,
        type: "question",
        subject: "Xử lý nước ao sau mưa",
        message: "Sau mưa lớn, nước ao thay đổi, cần xử lý gì?",
        status: "open",
        priority: "high",
        relatedFarm: farms[6]._id,
        relatedPond: ponds[8]._id,
        isActive: true,
      },
      {
        user: users[3]._id,
        type: "feature_request",
        subject: "Xuất báo cáo PDF",
        message: "Có thể thêm tính năng xuất báo cáo PDF không?",
        status: "open",
        priority: "low",
        isActive: true,
      },
      {
        user: users[4]._id,
        type: "issue",
        subject: "Không nhận được thông báo",
        message: "Không nhận được thông báo cảnh báo",
        status: "answered",
        priority: "medium",
        expertId: users[2]._id,
        expertResponse: "Vui lòng kiểm tra cài đặt thông báo trong tài khoản",
        isActive: true,
      },
    ]);

    console.log(`✅ Created ${supportQuestions.length} support questions`);

    // 10. Create Orders (10 orders)
    console.log("📝 Creating orders...");
    const orders = await Order.insertMany([
      {
        user: users[3]._id,
        items: [
          {
            product: products[0]._id,
            qty: 10,
            priceAtPurchase: products[0].price,
          },
          {
            product: products[2]._id,
            qty: 5,
            priceAtPurchase: products[2].price,
          },
        ],
        total: 10 * products[0].price + 5 * products[2].price,
        status: "completed",
        isActive: true,
      },
      {
        user: users[4]._id,
        items: [
          {
            product: products[1]._id,
            qty: 20,
            priceAtPurchase: products[1].price,
          },
        ],
        total: 20 * products[1].price,
        status: "completed",
        isActive: true,
      },
      {
        user: users[5]._id,
        items: [
          {
            product: products[3]._id,
            qty: 2,
            priceAtPurchase: products[3].price,
          },
          {
            product: products[4]._id,
            qty: 1,
            priceAtPurchase: products[4].price,
          },
        ],
        total: 2 * products[3].price + products[4].price,
        status: "completed",
        isActive: true,
      },
      {
        user: users[6]._id,
        items: [
          {
            product: products[5]._id,
            qty: 15,
            priceAtPurchase: products[5].price,
          },
        ],
        total: 15 * products[5].price,
        status: "pending",
        isActive: true,
      },
      {
        user: users[7]._id,
        items: [
          {
            product: products[6]._id,
            qty: 8,
            priceAtPurchase: products[6].price,
          },
          {
            product: products[7]._id,
            qty: 1,
            priceAtPurchase: products[7].price,
          },
        ],
        total: 8 * products[6].price + products[7].price,
        status: "completed",
        isActive: true,
      },
      {
        user: users[8]._id,
        items: [
          {
            product: products[8]._id,
            qty: 3,
            priceAtPurchase: products[8].price,
          },
        ],
        total: 3 * products[8].price,
        status: "completed",
        isActive: true,
      },
      {
        user: users[9]._id,
        items: [
          {
            product: products[9]._id,
            qty: 12,
            priceAtPurchase: products[9].price,
          },
        ],
        total: 12 * products[9].price,
        status: "completed",
        isActive: true,
      },
      {
        user: users[3]._id,
        items: [
          {
            product: products[0]._id,
            qty: 5,
            priceAtPurchase: products[0].price,
          },
        ],
        total: 5 * products[0].price,
        status: "pending",
        isActive: true,
      },
      {
        user: users[4]._id,
        items: [
          {
            product: products[2]._id,
            qty: 10,
            priceAtPurchase: products[2].price,
          },
          {
            product: products[6]._id,
            qty: 5,
            priceAtPurchase: products[6].price,
          },
        ],
        total: 10 * products[2].price + 5 * products[6].price,
        status: "completed",
        isActive: true,
      },
      {
        user: users[5]._id,
        items: [
          {
            product: products[4]._id,
            qty: 1,
            priceAtPurchase: products[4].price,
          },
        ],
        total: products[4].price,
        status: "cancelled",
        isActive: false,
      },
    ]);

    console.log(`✅ Created ${orders.length} orders`);

    // Update users with owned products
    for (const order of orders) {
      if (order.status === "completed" && order.isActive) {
        const user = await User.findById(order.user);
        if (user) {
          if (!user.ownedProducts) {
            user.ownedProducts = [];
          }
          for (const item of order.items) {
            if (!user.ownedProducts.includes(item.product)) {
              user.ownedProducts.push(item.product);
            }
          }
          await user.save();
        }
      }
    }

    console.log("\n✅ Data seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Farms: ${farms.length}`);
    console.log(`   - Ponds: ${ponds.length}`);
    console.log(`   - Devices: ${devices.length}`);
    console.log(`   - Scan Results: ${scanResults.length}`);
    console.log(`   - Alerts: ${alerts.length}`);
    console.log(`   - Subscriptions: ${subscriptions.length}`);
    console.log(`   - Support Questions: ${supportQuestions.length}`);
    console.log(`   - Orders: ${orders.length}`);

    // Only exit if called directly, not when imported
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  seedData();
}

export default seedData;
