# 🦐 FarmX MVP - Quick Start Guide

Complete aquaculture management system with AI-powered shrimp health analysis.

## ⚡ Quick Start (5 Minutes)

### Step 1: Start Backend

```bash
cd server
./setup-and-run.sh
```

This will:

- ✅ Start MongoDB (via Docker if needed)
- ✅ Install dependencies
- ✅ Create default user
- ✅ Start API server on port 4000

### Step 2: Start Mobile App

```bash
cd client
npm install
npm start
```

Then scan the QR code with Expo Go app on your phone.

### Step 3: Test the Flow

1. **App auto-logs in** with default user
2. **Go to Manage tab** → Create a farm → Create a pond
3. **Go to Camera tab** → Scan shrimp → Save to pond
4. **Go back to Manage tab** → View analytics

## 🎯 What's Integrated

### ✅ Complete Features

| Feature              | Description                                |
| -------------------- | ------------------------------------------ |
| **Auto-Login**       | Seamless authentication with default user  |
| **Farm Management**  | Create, view, and manage multiple farms    |
| **Pond Management**  | Create ponds within farms                  |
| **AI Scan Analysis** | Analyze shrimp health with AI              |
| **Save to Pond**     | Associate scan results with specific ponds |
| **Analytics**        | View aggregated health data per pond       |
| **Subscriptions**    | Upgrade user subscription level            |
| **Shop**             | Browse products and manage cart            |

### 🔗 API Endpoints

```
Backend API:     http://192.168.3.102:4000/api
AI Prediction:   http://192.168.3.102:8081/predict (unchanged)
Health Check:    http://192.168.3.102:4000/health
API Docs:        http://192.168.3.102:4000/api-docs
```

### 🔑 Default Login

```
Username: user
Password: user
```

## 📱 App Screens

### 1. Camera Screen

- Take photos or upload from gallery
- AI analysis (unchanged endpoint: `http://192.168.3.102:8081/predict`)
- Results displayed with Muscle:Gut ratio

### 2. Result Screen (Updated)

- View AI analysis results
- **NEW**: Save to specific pond with pond selector
- Save to device gallery

### 3. Manage Screen (Updated)

- **NEW**: Backend-integrated farm/pond management
- Create and view farms
- Create ponds within farms
- View scan history per pond
- **NEW**: Analytics aggregation from backend

### 4. Shop Screen

- View subscription plans
- Browse products
- Simple cart and checkout flow

## 🔧 Configuration

### Backend Configuration

Edit `server/.env`:

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/farmx
JWT_SECRET=your_secret_here
DEFAULT_USER_USERNAME=user
DEFAULT_USER_PASSWORD=user
```

### Client Configuration

Edit `client/utils/api.ts`:

```typescript
const API_BASE_URL = "http://192.168.3.102:4000/api";
```

⚠️ **Important**: Change `192.168.3.102` to your computer's IP address.

To find your IP:

```bash
# Linux/Mac
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr IPv4
```

## 🗂️ Project Structure

```
FarmX/
├── client/                    # React Native mobile app
│   ├── components/
│   │   ├── screens/          # Main screens
│   │   │   ├── CameraScreen.tsx      # AI scan (unchanged)
│   │   │   ├── ResultScreen.tsx      # ✨ Updated with pond save
│   │   │   ├── ManageScreen.tsx      # ✨ Backend integrated
│   │   │   └── ShopScreen.tsx        # Shop UI
│   │   └── ui/
│   │       └── PondSelectorModal.tsx # ✨ NEW component
│   └── utils/
│       ├── api.ts            # ✨ NEW API layer
│       └── useAutoLogin.ts   # ✨ NEW auto-login hook
│
└── server/                    # Express.js backend
    ├── src/
    │   ├── models/           # MongoDB models
    │   ├── routes/           # API routes
    │   └── utils/            # Utilities
    └── setup-and-run.sh      # ✨ Quick setup script
```

## 🎯 Demo Workflow

### Complete User Journey

```
1. Launch App
   └─→ Auto-login (transparent)

2. Manage Tab
   ├─→ Tap "+ Nông trại"
   ├─→ Enter farm name (e.g., "Farm Tôm Sú")
   ├─→ Tap "+ Ao"
   └─→ Enter pond name (e.g., "Ao 1")

3. Camera Tab
   ├─→ Take/upload shrimp photo
   ├─→ AI analyzes image
   └─→ Results displayed

4. Result Screen
   ├─→ Tap droplet icon (💧)
   ├─→ Select pond from list
   └─→ Scan saved to backend

5. Manage Tab
   ├─→ View updated pond with scan data
   ├─→ See health metrics
   └─→ Analytics aggregation
```

## 🔍 Troubleshooting

### Backend Issues

**MongoDB not starting**

```bash
cd server
docker-compose up -d mongodb
```

**Port 4000 already in use**

```bash
# Find and kill the process
lsof -i :4000
kill -9 <PID>
```

**Default user not created**

```bash
cd server
npm run seed
```

### Mobile App Issues

**Auto-login fails**

- Check backend is running: `curl http://192.168.3.102:4000/health`
- Check IP address in `client/utils/api.ts`
- Clear app data and restart

**Cannot connect to server**

- Ensure phone and computer are on same network
- Update IP address in `client/utils/api.ts`
- Check firewall settings

**Scan save fails**

- Verify farm and pond exist
- Check backend logs
- Ensure JWT token is valid

### AI Prediction Issues

**Prediction endpoint fails**

- Ensure prediction server is running on port 8081
- Check `http://192.168.3.102:8081/predict`
- This endpoint is **separate** from the main backend

## 📊 API Testing

### Using curl

**Health Check**

```bash
curl http://192.168.3.102:4000/health
```

**Login**

```bash
curl -X POST http://192.168.3.102:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"user"}'
```

**Create Farm** (requires token from login)

```bash
curl -X POST http://192.168.3.102:4000/api/farms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Test Farm","location":"Vietnam"}'
```

**Get Farms**

```bash
curl http://192.168.3.102:4000/api/farms \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚀 Production Deployment

See [MVP_INTEGRATION_GUIDE.md](./MVP_INTEGRATION_GUIDE.md) for detailed production setup.

## 📝 What Changed from Original

### ✅ New Features

1. **Auto-login system** - No manual login required
2. **Backend integration** - All data stored in MongoDB
3. **Pond association** - Scans can be saved to specific ponds
4. **Real-time sync** - Data updates across screens
5. **Analytics aggregation** - Per-pond health metrics

### 🔄 Updated Components

1. **ManageScreen** - Now uses backend API for farms/ponds
2. **ResultScreen** - Added "Save to Pond" functionality
3. **App layout** - Added auto-login on startup

### 📦 New Files

1. `client/utils/api.ts` - Complete API client
2. `client/utils/useAutoLogin.ts` - Auto-login hook
3. `client/components/ui/PondSelectorModal.tsx` - Pond selector
4. `server/setup-and-run.sh` - Quick setup script

### 🎯 Unchanged

1. Camera functionality - works exactly the same
2. AI prediction endpoint - `http://192.168.3.102:8081/predict`
3. Image analysis flow - no changes to core logic
4. UI/UX design - maintained existing styles

## 🎉 Success!

If you see:

- ✅ "Auto-login successful" in console
- ✅ Can create farms and ponds
- ✅ Can scan and save to ponds
- ✅ Analytics show up in Manage tab

**Congratulations!** Your MVP is working perfectly. 🎊

---

**Questions?** Check [MVP_INTEGRATION_GUIDE.md](./MVP_INTEGRATION_GUIDE.md) for detailed documentation.
