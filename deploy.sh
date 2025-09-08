#!/bin/bash

echo "🚀 Crypto Market Watch - Deployment Script"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client && npm install && cd ..

if [ $? -ne 0 ]; then
    echo "❌ Failed to install client dependencies"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your API keys before running the application."
fi

# Build client
echo "🔨 Building client..."
cd client && npm run build && cd ..

if [ $? -ne 0 ]; then
    echo "❌ Failed to build client"
    exit 1
fi

echo "✅ Build completed successfully!"

# Check if Vercel CLI is installed
if command -v vercel &> /dev/null; then
    echo "🌐 Vercel CLI detected. Ready for deployment!"
    echo ""
    echo "To deploy to Vercel:"
    echo "1. Run: vercel"
    echo "2. Follow the prompts"
    echo "3. Set environment variables in Vercel dashboard"
else
    echo "📦 To deploy to Vercel, install Vercel CLI:"
    echo "   npm i -g vercel"
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "To run locally:"
echo "  npm run dev"
echo ""
echo "To run production:"
echo "  npm start"
echo ""
echo "To collect data manually:"
echo "  npm run collect-data"
echo ""
echo "Happy monitoring! 📊"