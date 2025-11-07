# FarmX MVP Backend-Frontend Integration

## 🎯 Integration Summary

This integration connects the FarmX mobile app (React Native/Expo) with the Express.js backend for a complete MVP demo.

## 📋 Key Features Implemented

### 1. **Auto-Login System**

- ✅ Automatic login with default credentials (`user`/`user`)
- ✅ JWT token storage and management
- ✅ Persistent authentication across app restarts

### 2. **Farm & Pond Management**

- ✅ Create/Read farms via backend API
- ✅ Create/Read ponds associated with farms
- ✅ Real-time sync with MongoDB
- ✅ Display farm and pond statistics

### 3. **Scan Results with Pond Association**

- ✅ AI analysis via existing predict endpoint (`http://192.168.3.102:8081/predict`)
- ✅ Save scan results to specific ponds
- ✅ Pond selector modal for result saving
- ✅ Analytics aggregation per pond

### 4. **Shop Integration (Simplified)**

- ✅ Subscription management (Free/Premium/Enterprise)
- ✅ Product catalog display
- ✅ Cart functionality (single user, single cart)
- ✅ Order creation (instant ownership on purchase)

## 🔧 API Configuration

### Base URLs

```typescript
// Server API
const API_BASE_URL = "http://192.168.3.102:4000/api";

// AI Prediction (unchanged)
const AI_PREDICT_URL = "http://192.168.3.102:8081/predict";
```

## 📁 New Files Created

### Client Side

1. **`client/utils/api.ts`** - API service layer with full backend integration
2. **`client/utils/useAutoLogin.ts`** - Auto-login hook
3. **`client/components/ui/PondSelectorModal.tsx`** - Pond selection modal for saving scans

### Modified Files

1. **`client/app/_layout.tsx`** - Added auto-login on app start
2. **`client/components/screens/ManageScreen.tsx`** - Backend integration for farms/ponds
3. **`client/components/screens/ResultScreen.tsx`** - Added "Save to Pond" functionality

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ installed
- MongoDB running (local or Docker)
- Expo CLI installed
- Mobile device or emulator

### Backend Setup

```bash
cd server

# Install dependencies
npm install

# Set up environment variables
cat > .env << EOF
PORT=4000
MONGODB_URI=mongodb://localhost:27017/farmx
JWT_SECRET=your_super_secret_jwt_key_change_me
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_me
DEFAULT_USER_USERNAME=user
DEFAULT_USER_PASSWORD=user
NODE_ENV=development
EOF

# Start MongoDB (if using Docker)
docker-compose up -d mongodb

# Run database migrations (create default user)
npm run seed

# Start backend server
npm run dev
```

Backend will run on `http://localhost:4000`

### Client Setup

```bash
cd client

# Install dependencies
npm install

# Update API URL if needed
# Edit client/utils/api.ts and change API_BASE_URL to match your server IP

# Start Expo development server
npm start

# Scan QR code with Expo Go app
# Or press 'a' for Android emulator, 'i' for iOS simulator
```

### Verify Integration

1. **Check Backend Health**

   ```bash
   curl http://192.168.3.102:4000/health
   ```

   Should return: `{"success":true,"message":"FarmX API is running","timestamp":"..."}`

2. **Check Default User Created**

   ```bash
   curl http://192.168.3.102:4000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"user","password":"user"}'
   ```

   Should return a JWT token

3. **Open Mobile App**

   - App should auto-login (check console for "✅ Auto-login successful")
   - Navigate to Manage tab
   - Create a farm
   - Create a pond in that farm

4. **Test Scan Flow**
   - Go to Camera tab
   - Take/upload a shrimp image
   - After analysis, tap "Save to Pond" button (droplet icon)
   - Select the pond you created
   - Check Manage tab for saved results

## 🎨 Flow Diagrams

### User Journey

```
App Launch → Auto-Login → Home Screen
                ↓
         [Manage Tab]
                ↓
      Create Farm → Create Pond
                ↓
         [Camera Tab]
                ↓
  Capture Image → AI Analysis (http://192.168.3.102:8081/predict)
                ↓
         Result Screen
                ↓
      Save to Pond (NEW!) → Select Pond → Save to Backend
                ↓
         [Manage Tab]
                ↓
    View Analytics per Pond
```

### Data Flow

```
Mobile App (React Native)
        ↓
   API Layer (utils/api.ts)
        ↓
   Backend (Express.js) - Port 4000
        ↓
   MongoDB

   Prediction Endpoint (Separate)
   Port 8081 - unchanged
```

## 📊 API Endpoints Used

### Authentication

- `POST /api/auth/login` - Auto-login with default user

### Farms

- `GET /api/farms` - List all user's farms
- `POST /api/farms` - Create new farm
- `GET /api/farms/:id` - Get farm details
- `PUT /api/farms/:id` - Update farm
- `DELETE /api/farms/:id` - Delete farm

### Ponds

- `GET /api/farms/:farmId/ponds` - List ponds in a farm
- `POST /api/farms/:farmId/ponds` - Create new pond
- `GET /api/ponds/:id` - Get pond details
- `PUT /api/ponds/:id` - Update pond
- `DELETE /api/ponds/:id` - Delete pond
- `GET /api/ponds/:id/analytics` - Get pond analytics

### Scans

- `POST /api/scans` - Create scan result (with optional `saveToPondId`)
- `GET /api/scans` - List all scans (filterable by pond)
- `GET /api/scans/:id` - Get scan details

### Shop (Simplified)

- `GET /api/subscriptions/current` - Get user's subscription
- `POST /api/subscriptions/upgrade` - Upgrade subscription (UI only)
- `GET /api/products` - List products
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add to cart
- `POST /api/cart/checkout` - Create order (auto-ownership)

## 🔑 Default Credentials

```
Username: user
Password: user
```

These credentials are automatically created on first server start.

## 🎯 MVP Features Status

| Feature         | Status  | Notes                          |
| --------------- | ------- | ------------------------------ |
| Auto-login      | ✅ Done | Seamless user experience       |
| Farm Management | ✅ Done | Create, list, update, delete   |
| Pond Management | ✅ Done | Associated with farms          |
| Scan Analysis   | ✅ Done | Uses existing AI endpoint      |
| Save to Pond    | ✅ Done | New feature with pond selector |
| Analytics       | ✅ Done | Per-pond aggregation           |
| Subscriptions   | ✅ Done | Upgrade changes user.subLevel  |
| Cart/Orders     | ✅ Done | Simple flow: add → buy → own   |

## 🐛 Troubleshooting

### Backend connection failed

- Ensure server is running: `cd server && npm run dev`
- Check IP address matches in `client/utils/api.ts`
- Verify MongoDB is running

### Auto-login not working

- Check backend logs for authentication errors
- Verify default user was created: `npm run seed` in server folder
- Clear app data and reinstall

### Scans not saving to pond

- Verify farm and pond exist in database
- Check backend logs for permission errors
- Ensure JWT token is valid

### AI prediction fails

- Ensure prediction server is running on port 8081
- Check `http://192.168.3.102:8081/predict` endpoint
- Verify image format is base64 encoded

## 🚢 Deployment Considerations

### Production Checklist

- [ ] Change JWT secrets in `.env`
- [ ] Update MongoDB connection to production instance
- [ ] Configure CORS for production domain
- [ ] Set up proper logging and monitoring
- [ ] Enable HTTPS
- [ ] Configure rate limiting
- [ ] Set up backup strategy for MongoDB

### Environment Variables

```bash
# Production .env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/farmx
JWT_SECRET=<strong_random_secret>
JWT_REFRESH_SECRET=<strong_random_secret>
DEFAULT_USER_USERNAME=user
DEFAULT_USER_PASSWORD=<strong_password>
```

## 📱 Mobile App Build

### For Development

```bash
cd client
npm start
```

### For Production

**Android APK**

```bash
cd client
expo build:android
```

**iOS IPA**

```bash
cd client
expo build:ios
```

## 🎉 Success Metrics

### What Works Now

✅ User can create farms and ponds
✅ User can scan shrimp and save results to specific ponds
✅ User can view analytics per pond
✅ User can upgrade subscription (UI changes)
✅ User can add products to cart and purchase
✅ All data persists in MongoDB

### Demo Script

1. **Launch App** - Auto-login happens automatically
2. **Go to Manage Tab**
   - Tap "+ Nông trại" to create a farm (e.g., "Farm Tôm Sú")
   - Tap "+ Ao" to create a pond (e.g., "Ao 1")
3. **Go to Camera Tab**
   - Take or upload a shrimp image
   - Wait for AI analysis
   - Tap droplet icon (Save to Pond)
   - Select the pond you created
4. **Return to Manage Tab**
   - See the pond now has scan data
   - View analytics
5. **Go to Shop Tab** (Optional)
   - View subscription plans
   - Add devices to cart (simulated)

## 📝 Next Steps (Beyond MVP)

- Add real payment integration (Stripe/PayPal)
- Implement push notifications
- Add user registration flow
- Multi-user support with permissions
- Advanced analytics and reporting
- Export data as PDF/Excel
- Offline mode with sync
- Real-time updates with WebSockets

## 🤝 Support

For issues or questions:

1. Check backend logs: `cd server && npm run docker:logs`
2. Check mobile app logs in Expo Dev Tools
3. Verify MongoDB data: Use MongoDB Compass or CLI

---

**Built with ❤️ for FarmX MVP Demo**
