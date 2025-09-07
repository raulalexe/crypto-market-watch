#!/bin/bash

echo "🔧 Database Environment Setup"
echo "============================="

# Check if PUBLIC_DB_URL is set
if [ -z "$PUBLIC_DB_URL" ]; then
    echo "❌ PUBLIC_DB_URL environment variable is not set"
    echo ""
    echo "To set it up:"
    echo "1. Export the environment variable:"
    echo "   export PUBLIC_DB_URL='postgresql://postgres:password@host:port/database'"
    echo ""
    echo "2. Or add it to your .env.local file:"
    echo "   echo 'PUBLIC_DB_URL=postgresql://postgres:password@host:port/database' >> .env.local"
    echo ""
    echo "3. For Railway deployment, set it in Railway dashboard:"
    echo "   railway variables set PUBLIC_DB_URL=postgresql://postgres:password@host:port/database"
    exit 1
else
    echo "✅ PUBLIC_DB_URL is set"
    echo "📊 Database URL: $(echo $PUBLIC_DB_URL | sed 's/\/\/.*@/\/\/***:***@/')"
fi

echo ""
echo "🎉 Database environment is properly configured!"
