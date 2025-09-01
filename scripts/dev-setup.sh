#!/bin/bash

# Development Setup Script for Crypto Market Watch
# This script sets up the local development environment with PostgreSQL

echo "🚀 Setting up Crypto Market Watch development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Create .env.local file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp env.example .env.local
    echo "✅ Created .env.local from template"
    echo "⚠️  Please edit .env.local with your actual configuration values"
else
    echo "✅ .env.local already exists"
fi

# Start PostgreSQL container
echo "🐘 Starting PostgreSQL container..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker-compose exec postgres pg_isready -U postgres -d crypto_market_watch; do
    echo "   PostgreSQL is unavailable - sleeping..."
    sleep 2
done

echo "✅ PostgreSQL is ready!"

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client && npm install && cd ..

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit .env.local with your configuration"
echo "   2. Run 'npm run dev' to start the development server"
echo "   3. Visit http://localhost:3001"
echo ""
echo "🐘 PostgreSQL is running on:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: crypto_market_watch"
echo "   Username: postgres"
echo "   Password: postgres"
echo ""
echo "🛠️  Useful commands:"
echo "   docker-compose up -d postgres    # Start PostgreSQL"
echo "   docker-compose down              # Stop PostgreSQL"
echo "   docker-compose logs postgres     # View PostgreSQL logs"
echo "   docker-compose exec postgres psql -U postgres -d crypto_market_watch  # Connect to database"
