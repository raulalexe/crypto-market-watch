#!/bin/bash

echo "🚀 Railway Database Fix Script"
echo "=============================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed. Please install it first:"
    echo "   npm install -g @railway/cli"
    echo "   railway login"
    exit 1
fi

echo "✅ Railway CLI found"

# Run the database diagnostic on Railway
echo "🔧 Running database diagnostic on Railway..."
railway run node scripts/migrate-database.js

if [ $? -eq 0 ]; then
    echo "✅ Database migration completed successfully!"
    echo "🎉 All database issues should now be resolved"
else
    echo "❌ Database migration failed"
    echo "💡 Check Railway logs for more details"
fi
