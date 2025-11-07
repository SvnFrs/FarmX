# 🏗️ FarmX MVP - Architecture & Integration

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Mobile App (React Native/Expo)              │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Camera   │  │ Results  │  │ Manage   │  │  Shop    │       │
│  │ Screen   │  │ Screen   │  │ Screen   │  │ Screen   │       │
│  │          │  │          │  │          │  │          │       │
│  │ • Scan   │  │ • View   │  │ • Farms  │  │ • Plans  │       │
│  │ • Upload │  │ • Save   │  │ • Ponds  │  │ • Cart   │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │              │             │             │
└───────┼─────────────┼──────────────┼─────────────┼─────────────┘
        │             │              │             │
        │             └──────┬───────┴─────────────┘
        │                    │
        │         ┌──────────▼──────────┐
        │         │   API Client        │
        │         │   (utils/api.ts)    │
        │         │                     │
        │         │ • Auto-login        │
        │         │ • JWT management    │
        │         │ • Request handling  │
        │         └──────────┬──────────┘
        │                    │
        │         ┌──────────▼──────────────────────────┐
        │         │    Express.js Backend               │
        │         │    Port 4000                        │
        │         │                                     │
        │         │  ┌──────────────────────────────┐  │
        │         │  │    API Routes                │  │
        │         │  ├──────────────────────────────┤  │
        │         │  │ • /auth/login (auto)         │  │
        │         │  │ • /farms (CRUD)              │  │
        │         │  │ • /ponds (CRUD)              │  │
        │         │  │ • /scans (save to pond)      │  │
        │         │  │ • /subscriptions             │  │
        │         │  │ • /cart & /orders            │  │
        │         │  └────────────┬─────────────────┘  │
        │         │               │                     │
        │         │  ┌────────────▼─────────────────┐  │
        │         │  │   MongoDB                    │  │
        │         │  ├──────────────────────────────┤  │
        │         │  │ Collections:                 │  │
        │         │  │ • users                      │  │
        │         │  │ • farms                      │  │
        │         │  │ • ponds                      │  │
        │         │  │ • scanresults (with pond)    │  │
        │         │  │ • products                   │  │
        │         │  │ • orders                     │  │
        │         │  └──────────────────────────────┘  │
        │         └─────────────────────────────────────┘
        │
        │         ┌─────────────────────────────────────┐
        └────────►│   AI Prediction Service             │
                  │   Port 8081 (unchanged)             │
                  │                                     │
                  │   POST /predict                     │
                  │   • Image analysis                  │
                  │   • Muscle/Gut ratio                │
                  │   • Mask generation                 │
                  └─────────────────────────────────────┘
```

## Data Flow

### 1. App Launch & Authentication

```
User Opens App
      │
      ▼
┌─────────────────┐
│ App Layout      │
│ (_layout.tsx)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ useAutoLogin    │
│ Hook            │
└────────┬────────┘
         │
         ▼
┌─────────────────┐       ┌─────────────────┐
│ Check Stored    │──NO──►│ Call auto-login │
│ JWT Token       │       │ with user/user  │
└────────┬────────┘       └────────┬────────┘
        YES                         │
         │◄─────────────────────────┘
         ▼
┌─────────────────┐
│ Store Token     │
│ Set Authenticated│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Show App Tabs   │
└─────────────────┘
```

### 2. Farm & Pond Creation

```
User in Manage Screen
      │
      ▼
┌─────────────────┐
│ Tap "+ Nông trại"│
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│ Enter Farm Name │────►│ API: POST /farms │
│ Enter Location  │     │ with JWT token   │
└─────────────────┘     └────────┬─────────┘
                                 │
                                 ▼
                        ┌────────────────┐
                        │ MongoDB: farms │
                        │ collection     │
                        └────────┬───────┘
                                 │
                                 ▼
                        ┌────────────────┐
                        │ Return farm ID │
                        └────────┬───────┘
                                 │
                                 ▼
┌─────────────────┐     ┌────────────────┐
│ Tap "+ Ao"      │────►│ API: POST      │
│ Enter Pond Name │     │ /farms/:id/ponds│
└─────────────────┘     └────────┬───────┘
                                 │
                                 ▼
                        ┌────────────────┐
                        │ MongoDB: ponds │
                        │ (with farm ref)│
                        └────────┬───────┘
                                 │
                                 ▼
                        ┌────────────────┐
                        │ Reload data    │
                        │ Show in UI     │
                        └────────────────┘
```

### 3. Scan & Save to Pond

```
User in Camera Screen
      │
      ▼
┌─────────────────────┐
│ Capture/Upload Image│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Convert to Base64   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐     ┌────────────────────┐
│ POST to Prediction  │────►│ AI Service :8081   │
│ /predict endpoint   │     │ Analyze image      │
└─────────────────────┘     └──────────┬─────────┘
                                       │
                                       ▼
                            ┌──────────────────┐
                            │ Return:          │
                            │ • ratio_thit     │
                            │ • ratio_ruot     │
                            │ • mask (base64)  │
                            └──────────┬───────┘
                                       │
                                       ▼
┌──────────────────────────────────────────┐
│ Navigate to Result Screen                │
│ • Display muscle:gut ratio               │
│ • Show mask overlay                      │
│ • Health status badge                    │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│ User Taps "Save to Pond" (droplet icon) │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│ PondSelectorModal Opens                  │
│ • Fetch all farms (API: GET /farms)      │
│ • Fetch all ponds (API: GET /ponds)      │
│ • Display grouped by farm                │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│ User Selects Pond                         │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐     ┌─────────────────────┐
│ API: POST /scans                          │────►│ MongoDB: scanresults│
│ Body:                                     │     │ with pond reference │
│ • saveToPondId                            │     └─────────────────────┘
│ • metrics (ratios)                        │
│ • healthScore                             │
│ • diseasePrediction                       │
│ • imageUrl                                │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│ Success Alert                             │
│ Option to navigate to Manage screen      │
└──────────────────────────────────────────┘
```

### 4. View Analytics

```
User in Manage Screen
      │
      ▼
┌─────────────────────┐
│ Select a Pond       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐     ┌────────────────────────┐
│ API: GET /scans     │────►│ MongoDB: Filter scans  │
│ ?pondId=xxx         │     │ by pond ID             │
└─────────────────────┘     └──────────┬─────────────┘
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │ Return scan history  │
                            │ • Health scores      │
                            │ • Timestamps         │
                            │ • Metrics            │
                            └──────────┬───────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────┐
│ Display Analytics                                 │
│ • Average health score                           │
│ • Scan trend over time                           │
│ • Recent scan results                            │
│ • Recommendations                                │
└──────────────────────────────────────────────────┘
```

## Key Integration Points

### 1. Authentication Layer

```typescript
// client/utils/api.ts
class ApiClient {
  private token: string | null = null;

  async autoLogin() {
    const data = await this.login("user", "user");
    await this.setAuth(data.token, data.user);
  }

  private async request(endpoint, options) {
    headers["Authorization"] = `Bearer ${this.token}`;
    // ... make request
  }
}
```

### 2. Data Persistence

```typescript
// All data flows through MongoDB
User → Farm → Pond → ScanResult

// Mongoose Models
User {
  username, password, subLevel, cart, ownedProducts
}

Farm {
  name, location, owner (ref: User)
}

Pond {
  name, farm (ref: Farm), area, status
}

ScanResult {
  pond (ref: Pond),  // ← NEW: Associates scan with pond
  metrics, healthScore, diseasePrediction
}
```

### 3. Separation of Concerns

```
┌────────────────────────────────────┐
│   AI Prediction (Port 8081)        │
│   • Image analysis only            │
│   • Returns ratios & mask          │
│   • Stateless                      │
└────────────────────────────────────┘
            │
            │ Results passed to
            ▼
┌────────────────────────────────────┐
│   Backend API (Port 4000)          │
│   • Store scan results             │
│   • Associate with ponds           │
│   • User authentication            │
│   • Business logic                 │
└────────────────────────────────────┘
```

## Database Schema

```sql
-- MongoDB Collections

users {
  _id: ObjectId,
  username: string,
  password: string (hashed),
  email: string,
  subLevel: number,  -- 0=free, 1=premium, 2=enterprise
  cart: {
    items: [{
      product: ObjectId (ref: products),
      qty: number
    }]
  },
  ownedProducts: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}

farms {
  _id: ObjectId,
  name: string,
  location: string,
  owner: ObjectId (ref: users),
  status: enum['active', 'inactive', 'archived'],
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}

ponds {
  _id: ObjectId,
  name: string,
  farm: ObjectId (ref: farms),  -- Links pond to farm
  area: number,
  status: enum['active', 'inactive', 'maintenance'],
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}

scanresults {
  _id: ObjectId,
  pond: ObjectId (ref: ponds),  -- ✨ NEW: Links scan to pond
  deviceId: string,
  healthScore: number,
  diseasePrediction: {
    disease: string,
    confidence: number,
    recommendations: [string]
  },
  metrics: {
    ratio_thit: number,
    ratio_ruot: number,
    muscle_gut_ratio: number,
    ... (flexible schema)
  },
  rawData: mixed,
  imageUrl: string,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}

products {
  _id: ObjectId,
  name: string,
  category: string,
  price: number,
  description: string,
  imageUrl: string,
  stock: number,
  isActive: boolean
}

orders {
  _id: ObjectId,
  user: ObjectId (ref: users),
  items: [{
    product: ObjectId (ref: products),
    qty: number,
    price: number
  }],
  total: number,
  status: enum['pending', 'completed', 'cancelled'],
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints Summary

### Authentication

- `POST /api/auth/login` - Login (auto with user/user)

### Farms

- `GET /api/farms` - List user's farms
- `POST /api/farms` - Create farm
- `GET /api/farms/:id` - Get farm details
- `PUT /api/farms/:id` - Update farm
- `DELETE /api/farms/:id` - Delete farm

### Ponds

- `GET /api/farms/:farmId/ponds` - List ponds in farm
- `POST /api/farms/:farmId/ponds` - Create pond
- `GET /api/ponds/:id` - Get pond details
- `PUT /api/ponds/:id` - Update pond
- `DELETE /api/ponds/:id` - Delete pond
- `GET /api/ponds/:id/analytics` - Get pond analytics

### Scans

- `POST /api/scans` - Create scan (with optional `saveToPondId`)
- `GET /api/scans` - List scans (filterable by `pondId`)
- `GET /api/scans/:id` - Get scan details

### Products & Cart

- `GET /api/products` - List products
- `GET /api/cart` - Get cart
- `POST /api/cart` - Add to cart
- `POST /api/cart/checkout` - Create order

### Subscriptions

- `GET /api/subscriptions/current` - Get subscription
- `POST /api/subscriptions/upgrade` - Upgrade plan

## Security

### JWT Authentication Flow

```
1. User credentials (user/user)
         │
         ▼
2. POST /auth/login
         │
         ▼
3. Validate credentials (bcrypt)
         │
         ▼
4. Generate JWT token
   • payload: { userId }
   • expiry: 7 days
         │
         ▼
5. Return token to client
         │
         ▼
6. Client stores in AsyncStorage
         │
         ▼
7. All API requests include:
   Authorization: Bearer <token>
         │
         ▼
8. Middleware verifies token
   • Extracts userId
   • Attaches to req.userId
         │
         ▼
9. Route handlers use req.userId
   for authorization
```

### Authorization Rules

```
Farm:
  • Can only view/edit own farms (owner === req.userId)

Pond:
  • Can only access ponds in own farms
  • Verify farm.owner === req.userId

Scan:
  • Can only view scans from own ponds
  • Verify pond.farm.owner === req.userId

Cart/Orders:
  • User can only access own cart/orders
  • user === req.userId
```

## Performance Considerations

### Database Indexes

```javascript
// Faster queries with compound indexes
FarmSchema.index({ owner: 1 });
PondSchema.index({ farm: 1 });
PondSchema.index({ farm: 1, createdAt: -1 });
ScanResultSchema.index({ pond: 1, createdAt: -1 });
ScanResultSchema.index({ pond: 1, createdAt: 1 });
```

### Caching Strategy

```
Frontend (React Native):
  • JWT token in AsyncStorage
  • User data in memory
  • Farm/pond list cached

Backend:
  • No caching in MVP
  • Future: Redis for sessions
```

### Pagination

```typescript
// All list endpoints support pagination
GET /api/scans?page=1&limit=20
GET /api/orders?page=1&limit=10

// Response includes:
{
  page: 1,
  limit: 20,
  total: 150,
  totalPages: 8,
  data: [...]
}
```

## Error Handling

### Client-Side

```typescript
try {
  const response = await api.createFarm(name, location);
  Alert.alert("Thành công", "Đã tạo nông trại");
} catch (error) {
  Alert.alert("Lỗi", error.message);
  console.error("Failed to create farm:", error);
}
```

### Server-Side

```typescript
// Centralized error handler
app.use((error, req, res, next) => {
  logger.error(error);
  res.status(error.status || 500).json({
    message: error.message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});
```

## Monitoring & Logging

### Backend Logging

```javascript
// Winston logger
logger.info("User logged in", { userId });
logger.error("Database error", { error, query });
logger.warn("Rate limit exceeded", { ip, userId });
```

### Frontend Logging

```javascript
// Console logging with categories
console.log("[CAMERA] Taking picture");
console.log("[API] Creating farm", { name, location });
console.error("[AUTH] Login failed", error);
```

---

**Built for FarmX MVP - Complete Aquaculture Management Solution**
