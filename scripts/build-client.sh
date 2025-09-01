#!/bin/bash

# Build script optimized for Railway deployment
echo "🚀 Starting optimized client build..."

# Set Node.js memory limits
export NODE_OPTIONS="--max-old-space-size=2048"

# Navigate to client directory
cd client

# Install only production dependencies
echo "📦 Installing production dependencies..."
npm ci --only=production --no-audit --no-fund

# Build with optimizations
echo "🔨 Building React app..."
GENERATE_SOURCEMAP=false npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    ls -la build/
else
    echo "❌ Build failed!"
    exit 1
fi
