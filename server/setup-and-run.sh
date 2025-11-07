#!/bin/bash

# FarmX MVP Backend Setup Script
echo "🚀 FarmX MVP Backend Setup"
echo "=========================="
echo ""

# Check if MongoDB is running
echo "📦 Checking MongoDB..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Starting with Docker..."
    docker-compose up -d mongodb
    sleep 3
else
    echo "✅ MongoDB is already running"
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
PORT=4000
MONGODB_URI=mongodb://localhost:27017/farmx
JWT_SECRET=farmx_dev_secret_$(openssl rand -hex 16)
JWT_REFRESH_SECRET=farmx_dev_refresh_secret_$(openssl rand -hex 16)
DEFAULT_USER_USERNAME=user
DEFAULT_USER_PASSWORD=user
NODE_ENV=development
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create default user
echo ""
echo "👤 Creating default user..."
npm run seed

# Start server
echo ""
echo "🚀 Starting server..."
echo "=========================="
echo "Server will run on http://localhost:4000"
echo "API documentation: http://localhost:4000/api-docs"
echo "Health check: http://localhost:4000/health"
echo ""
echo "Default credentials:"
echo "Username: user"
echo "Password: user"
echo ""
echo "Press Ctrl+C to stop"
echo "=========================="
echo ""

npm run dev
