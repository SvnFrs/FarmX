# FarmX Backend API

Backend hệ thống quản lý farm/ao/scan được xây dựng với Express + TypeScript + MongoDB.

## 🚀 Tính năng

- **Authentication**: JWT Bearer với auto-login cho development
- **Farm Management**: Tạo, đọc, sửa, xóa farms
- **Pond Management**: Quản lý các ao trong farm
- **Scan Results**: Lưu trữ và phân tích kết quả scan
- **Analytics**: Thống kê và phân tích dữ liệu scan theo thời gian
- **Products & Cart**: Quản lý sản phẩm và giỏ hàng
- **Orders**: Lịch sử đơn hàng
- **Subscription**: Quản lý cấp độ đăng ký người dùng

## 📋 Yêu cầu

- Node.js >= 16
- Docker & Docker Compose (cho MongoDB)
- npm hoặc yarn

## 🔧 Cài đặt

### 1. Clone và cài đặt dependencies

```bash
cd BE_FARMX
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Chỉnh sửa `.env` theo nhu cầu:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/farmdb
JWT_SECRET=your_secure_secret_key_here
DEFAULT_USER_USERNAME=user
DEFAULT_USER_PASSWORD=user
NODE_ENV=development
```

### 3. Khởi động MongoDB với Docker

```bash
docker-compose up -d
```

Kiểm tra MongoDB đã chạy:

```bash
docker ps
```

### 4. Khởi động server

**Development mode:**

```bash
npm run dev
```

**Production mode:**

```bash
npm run build
npm start
```

Server sẽ chạy tại: `http://localhost:4000`

## 📚 API Documentation

### Base URL

```
http://localhost:4000/api
```

### Authentication

API sử dụng JWT Bearer token. Thêm header sau vào các request cần authentication:

```
Authorization: Bearer <your_token>
```

---

## 🔐 Auth Endpoints

### POST /api/auth/login

Đăng nhập với username và password.

**Request:**

```json
{
  "username": "user",
  "password": "user"
}
```

**Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "user",
    "role": "user",
    "subLevel": 0
  }
}
```

### GET /api/auth/autologin

Tự động đăng nhập với user mặc định (dùng cho development/testing).

**Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Auto-login successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "user",
    "role": "user",
    "subLevel": 0
  }
}
```

### GET /api/auth/me

Lấy thông tin user hiện tại (yêu cầu authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "user",
    "role": "user",
    "subLevel": 0,
    "ownedProducts": [],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 🌾 Farm Endpoints

Tất cả farm endpoints yêu cầu authentication.

### POST /api/farms

Tạo farm mới.

**Request:**

```json
{
  "name": "Farm 1",
  "location": "Đồng bằng sông Cửu Long"
}
```

**Response:**

```json
{
  "success": true,
  "farm": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Farm 1",
    "location": "Đồng bằng sông Cửu Long",
    "owner": "507f191e810c19729de860ea",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /api/farms

Lấy tất cả farms của user hiện tại.

**Response:**

```json
{
  "success": true,
  "count": 2,
  "farms": [...]
}
```

### GET /api/farms/:id

Lấy thông tin chi tiết một farm kèm danh sách ao.

**Response:**

```json
{
  "success": true,
  "farm": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Farm 1",
    "location": "Đồng bằng sông Cửu Long",
    "owner": "507f191e810c19729de860ea",
    "ponds": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Ao 1",
        "area": 1000,
        "farm": "507f1f77bcf86cd799439011",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### PUT /api/farms/:id

Cập nhật thông tin farm.

**Request:**

```json
{
  "name": "Farm 1 Updated",
  "location": "New Location"
}
```

### DELETE /api/farms/:id

Xóa farm (và tất cả ao trong farm).

**Response:**

```json
{
  "success": true,
  "message": "Farm and its ponds deleted successfully"
}
```

---

## 🐟 Pond Endpoints

### POST /api/farms/:farmId/ponds

Tạo ao mới trong farm.

**Request:**

```json
{
  "name": "Ao 1",
  "area": 1000
}
```

**Response:**

```json
{
  "success": true,
  "pond": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Ao 1",
    "area": 1000,
    "farm": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /api/farms/:farmId/ponds

Lấy tất cả ao trong farm.

**Response:**

```json
{
  "success": true,
  "count": 3,
  "ponds": [...]
}
```

### GET /api/ponds/:pondId

Lấy thông tin chi tiết một ao.

### PUT /api/ponds/:pondId

Cập nhật thông tin ao.

### DELETE /api/ponds/:pondId

Xóa ao (và tất cả scan results liên quan).

---

## 📊 Scan Endpoints

### POST /api/scans

Tạo scan result mới.

**Request:**

```json
{
  "deviceId": "DEVICE-001",
  "metrics": {
    "weight": 250,
    "length": 25.5,
    "MGR": 1.5,
    "temperature": 28.5,
    "pH": 7.2
  },
  "rawData": {
    "imageUrl": "https://...",
    "timestamp": "2024-01-01T10:30:00Z"
  },
  "saveToPondId": "507f1f77bcf86cd799439012"
}
```

**Response:**

```json
{
  "success": true,
  "scan": {
    "_id": "507f1f77bcf86cd799439013",
    "pond": "507f1f77bcf86cd799439012",
    "deviceId": "DEVICE-001",
    "metrics": {
      "weight": 250,
      "length": 25.5,
      "MGR": 1.5,
      "temperature": 28.5,
      "pH": 7.2
    },
    "rawData": {...},
    "createdAt": "2024-01-01T10:30:00.000Z"
  }
}
```

### GET /api/scans

Lấy tất cả scans (có thể filter theo pondId).

**Query params:**

- `pondId` (optional): Filter by pond ID
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

### GET /api/scans/:id

Lấy thông tin chi tiết một scan.

### DELETE /api/scans/:id

Xóa scan result.

---

## 📈 Analytics Endpoints

### GET /api/ponds/:pondId/scans

Lấy tất cả scans của một ao (có pagination).

**Query params:**

- `page` (default: 1)
- `limit` (default: 10)

**Response:**

```json
{
  "success": true,
  "page": 1,
  "limit": 10,
  "total": 45,
  "totalPages": 5,
  "scans": [...]
}
```

### GET /api/ponds/:pondId/analytics

Lấy thống kê phân tích cho một ao.

**Query params:**

- `from` (optional): Start date (YYYY-MM-DD)
- `to` (optional): End date (YYYY-MM-DD)

**Response:**

```json
{
  "success": true,
  "analytics": {
    "period": {
      "from": "2024-01-01",
      "to": "2024-01-31"
    },
    "totalScans": 45,
    "avgMetrics": {
      "weight": 245.5,
      "length": 24.8,
      "MGR": 1.48,
      "temperature": 28.2,
      "pH": 7.15
    },
    "trend": [
      {
        "date": "2024-01-01",
        "count": 3,
        "avgMetrics": {
          "weight": 240,
          "length": 24.0,
          "MGR": 1.4
        }
      },
      {
        "date": "2024-01-02",
        "count": 2,
        "avgMetrics": {
          "weight": 242,
          "length": 24.2,
          "MGR": 1.42
        }
      }
    ]
  }
}
```

---

## 🛍️ Product Endpoints

### GET /api/products

Lấy danh sách sản phẩm (public).

**Query params:**

- `page` (default: 1)
- `limit` (default: 20)

### GET /api/products/:id

Lấy thông tin chi tiết sản phẩm.

### POST /api/products

Tạo sản phẩm mới (admin only).

**Request:**

```json
{
  "name": "Premium Feed",
  "price": 150000,
  "sku": "FEED-001",
  "description": "High quality shrimp feed"
}
```

### PUT /api/products/:id

Cập nhật sản phẩm (admin only).

### DELETE /api/products/:id

Xóa sản phẩm (admin only).

---

## 🛒 Cart Endpoints

### GET /api/cart

Lấy giỏ hàng hiện tại của user.

**Response:**

```json
{
  "success": true,
  "cart": {
    "items": [
      {
        "product": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Premium Feed",
          "price": 150000
        },
        "qty": 2,
        "itemTotal": 300000
      }
    ],
    "total": 300000
  }
}
```

### POST /api/cart

Thêm sản phẩm vào giỏ hàng (hoặc cập nhật số lượng nếu đã có).

**Request:**

```json
{
  "productId": "507f1f77bcf86cd799439014",
  "qty": 2
}
```

### DELETE /api/cart/:productId

Xóa sản phẩm khỏi giỏ hàng.

### POST /api/cart/checkout

Thanh toán giỏ hàng.

**Response:**

```json
{
  "success": true,
  "message": "Checkout successful",
  "order": {
    "_id": "507f1f77bcf86cd799439015",
    "user": "507f191e810c19729de860ea",
    "items": [...],
    "total": 300000,
    "status": "completed",
    "createdAt": "2024-01-01T10:30:00.000Z"
  }
}
```

---

## 📦 Order Endpoints

### GET /api/orders

Lấy danh sách đơn hàng của user.

**Query params:**

- `page` (default: 1)
- `limit` (default: 10)

### GET /api/orders/:id

Lấy chi tiết một đơn hàng.

---

## 👤 User Endpoints

### GET /api/users/:id

Lấy thông tin user (chỉ admin hoặc chính user đó).

### POST /api/users/:id/subscription

Cập nhật subscription level.

**Request:**

```json
{
  "subLevel": 2
}
```

**Response:**

```json
{
  "success": true,
  "message": "Subscription level updated",
  "user": {
    "_id": "507f191e810c19729de860ea",
    "username": "user",
    "role": "user",
    "subLevel": 2,
    ...
  }
}
```

### GET /api/users

Lấy danh sách tất cả users (admin only).

---

## 🔒 Error Responses

API trả về error responses theo format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [...] // Validation errors (nếu có)
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🧪 Testing

### Quick Test với curl

**1. Auto-login:**

```bash
curl http://localhost:4000/api/auth/autologin
```

**2. Tạo farm:**

```bash
TOKEN="your_token_here"
curl -X POST http://localhost:4000/api/farms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Farm","location":"Test Location"}'
```

**3. Lấy danh sách farms:**

```bash
curl http://localhost:4000/api/farms \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📁 Cấu trúc Project

```
BE_FARMX/
├── src/
│   ├── models/           # Mongoose models
│   │   ├── User.ts
│   │   ├── Farm.ts
│   │   ├── Pond.ts
│   │   ├── ScanResult.ts
│   │   ├── Product.ts
│   │   └── Order.ts
│   ├── routes/           # API routes
│   │   ├── auth.ts
│   │   ├── farms.ts
│   │   ├── ponds.ts
│   │   ├── scans.ts
│   │   ├── products.ts
│   │   ├── cart.ts
│   │   ├── orders.ts
│   │   └── users.ts
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── utils/            # Utility functions
│   │   ├── db.ts
│   │   ├── logger.ts
│   │   └── seedDefaultUser.ts
│   ├── app.ts            # Express app setup
│   └── server.ts         # Server entry point
├── logs/                 # Log files
├── docker-compose.yml    # MongoDB Docker setup
├── .env.example          # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🌟 Features

### Default User

Khi khởi động lần đầu, hệ thống tự động tạo user mặc định:

- Username: `user`
- Password: `user`
- Role: `user`
- SubLevel: `0`

### Logging

Logs được lưu tại:

- `logs/error.log` - Error logs
- `logs/combined.log` - All logs

### Database Indexes

Các indexes được tạo tự động để tối ưu performance:

- User: `username`
- Farm: `owner`
- Pond: `farm`, `farm + createdAt`
- ScanResult: `pond + createdAt` (ascending & descending)
- Product: `sku`, `name`
- Order: `user + createdAt`

---

## 🛠️ Development

### Scripts

```bash
# Development (với hot-reload)
npm run dev

# Build TypeScript
npm run build

# Production
npm start

# Seed default user
npm run seed
```

### Environment Variables

Xem file `.env.example` để biết các biến môi trường cần thiết.

---

## 📝 Notes

1. **Security**: Đổi `JWT_SECRET` trong production
2. **MongoDB**: Đảm bảo MongoDB đang chạy trước khi start server
3. **CORS**: Hiện tại allow all origins, cần config cho production
4. **Validation**: Sử dụng express-validator cho tất cả inputs
5. **Password**: Được hash với bcrypt (10 rounds)

---

## 📄 License

MIT

---

## 👨‍💻 Author

FarmX Development Team
