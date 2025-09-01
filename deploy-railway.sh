#!/bin/bash

echo "🚀 Deploying Crypto Market Watch to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway first:"
    echo "   railway login"
    exit 1
fi

# Build the client
echo "🔨 Building client..."
npm run build:client

# Deploy to Railway
echo "📤 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Get your Railway app URL from the dashboard"
echo "2. Update your .env file with the new BASE_URL"
echo "3. Set TELEGRAM_WEBHOOK_URL to your Railway URL"
echo "4. Setup the Telegram webhook via admin dashboard"
echo ""
echo "🌐 Your app will be available at: https://your-app-name.railway.app"
