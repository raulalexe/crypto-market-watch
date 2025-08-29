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

# Check if environment variables are set
echo "🔧 Checking environment variables..."
if [ -z "$JWT_SECRET" ]; then
    echo "⚠️  Warning: JWT_SECRET not set. Please set it in Railway dashboard."
fi

if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  Warning: DATABASE_URL not set. Please add PostgreSQL plugin in Railway dashboard."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client && npm install && cd ..

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
echo ""
echo "📋 Next steps:"
echo "1. Set up environment variables in Railway dashboard"
echo "2. Add PostgreSQL plugin if not already done"
echo "3. Configure API keys for data collection"
echo "4. Test the application endpoints"
