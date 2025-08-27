#!/bin/bash

echo "🚀 Deploying Crypto Market Watch to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway..."
    railway login
fi

# Initialize Railway project if not already done
if [ ! -f ".railway" ]; then
    echo "📁 Initializing Railway project..."
    railway init
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Deploy to Railway
echo "🚂 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🔗 Your app should be available at the Railway URL"
echo "📊 Check logs with: railway logs"
echo "🌐 Open app with: railway open"
