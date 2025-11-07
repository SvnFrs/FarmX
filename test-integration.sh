#!/bin/bash

# FarmX MVP - Complete Integration Test
# Run this script to verify everything is working

echo "╔════════════════════════════════════════════╗"
echo "║   FarmX MVP Integration Test Suite        ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test functions
test_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

test_fail() {
    echo -e "${RED}✗${NC} $1"
}

test_skip() {
    echo -e "${YELLOW}⊘${NC} $1"
}

echo "🔍 Running integration tests..."
echo ""

# Test 1: MongoDB
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: MongoDB Connection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if pgrep -x "mongod" > /dev/null || docker ps | grep -q mongo; then
    test_pass "MongoDB is running"
else
    test_fail "MongoDB is not running"
    echo "   → Run: docker-compose up -d mongodb"
fi
echo ""

# Test 2: Backend Server
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: Backend Server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    test_pass "Backend server is responding"
    HEALTH=$(curl -s http://localhost:4000/health | jq -r '.message' 2>/dev/null)
    echo "   → $HEALTH"
else
    test_fail "Backend server is not running"
    echo "   → Run: cd server && npm run dev"
fi
echo ""

# Test 3: Default User
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3: Default User Authentication"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"user","password":"user"}' 2>/dev/null)

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    test_pass "Default user login successful"
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)
    echo "   → JWT token generated"
else
    test_fail "Default user login failed"
    echo "   → Run: cd server && npm run seed"
fi
echo ""

# Test 4: Farm Creation
if [ ! -z "$TOKEN" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Test 4: Farm API"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Create test farm
    FARM_RESPONSE=$(curl -s -X POST http://localhost:4000/api/farms \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{"name":"Test Farm","location":"Test Location"}' 2>/dev/null)
    
    if echo "$FARM_RESPONSE" | grep -q "success"; then
        test_pass "Farm creation successful"
        FARM_ID=$(echo "$FARM_RESPONSE" | jq -r '.farm._id' 2>/dev/null)
        echo "   → Farm ID: $FARM_ID"
    else
        test_fail "Farm creation failed"
    fi
    echo ""
    
    # Test 5: Pond Creation
    if [ ! -z "$FARM_ID" ]; then
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Test 5: Pond API"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        POND_RESPONSE=$(curl -s -X POST http://localhost:4000/api/farms/$FARM_ID/ponds \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d '{"name":"Test Pond","area":1000}' 2>/dev/null)
        
        if echo "$POND_RESPONSE" | grep -q "success"; then
            test_pass "Pond creation successful"
            POND_ID=$(echo "$POND_RESPONSE" | jq -r '.pond._id' 2>/dev/null)
            echo "   → Pond ID: $POND_ID"
        else
            test_fail "Pond creation failed"
        fi
        echo ""
        
        # Test 6: Scan Creation
        if [ ! -z "$POND_ID" ]; then
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "Test 6: Scan API (Save to Pond)"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            
            SCAN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/scans \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $TOKEN" \
                -d "{
                    \"saveToPondId\": \"$POND_ID\",
                    \"metrics\": {
                        \"ratio_thit\": 75.5,
                        \"ratio_ruot\": 24.5,
                        \"muscle_gut_ratio\": 3.08
                    },
                    \"healthScore\": 85,
                    \"diseasePrediction\": {
                        \"disease\": \"Excellent\",
                        \"confidence\": 90,
                        \"recommendations\": [\"Continue current conditions\"]
                    }
                }" 2>/dev/null)
            
            if echo "$SCAN_RESPONSE" | grep -q "success"; then
                test_pass "Scan saved to pond successfully"
                SCAN_ID=$(echo "$SCAN_RESPONSE" | jq -r '.scan._id' 2>/dev/null)
                echo "   → Scan ID: $SCAN_ID"
            else
                test_fail "Scan creation failed"
            fi
            echo ""
        fi
    fi
else
    test_skip "Skipping API tests (no authentication token)"
    echo ""
fi

# Test 7: AI Prediction Service
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 7: AI Prediction Service"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if curl -s http://localhost:8081 > /dev/null 2>&1; then
    test_pass "AI prediction service is running"
else
    test_skip "AI prediction service not detected (port 8081)"
    echo "   → This is separate from the main backend"
fi
echo ""

# Test 8: Client Files
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 8: Client Integration Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "client/utils/api.ts" ]; then
    test_pass "API client exists"
else
    test_fail "API client not found"
fi

if [ -f "client/utils/useAutoLogin.ts" ]; then
    test_pass "Auto-login hook exists"
else
    test_fail "Auto-login hook not found"
fi

if [ -f "client/components/ui/PondSelectorModal.tsx" ]; then
    test_pass "Pond selector modal exists"
else
    test_fail "Pond selector modal not found"
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════╗"
echo "║          Integration Test Summary          ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "✓ = Passed, ✗ = Failed, ⊘ = Skipped"
echo ""
echo "Next steps:"
echo "1. If any tests failed, check the instructions above"
echo "2. Start mobile app: cd client && npm start"
echo "3. Test the complete flow in the app"
echo ""
echo "Documentation:"
echo "• Quick Start: QUICKSTART.md"
echo "• Full Guide: MVP_INTEGRATION_GUIDE.md"
echo "• Architecture: ARCHITECTURE.md"
echo ""
