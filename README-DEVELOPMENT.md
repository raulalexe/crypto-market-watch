# Development Setup Guide

This guide will help you set up the Crypto Market Watch application for local development using PostgreSQL.

## Prerequisites

- **Docker** and **Docker Compose** installed
- **Node.js** (v18 or higher)
- **npm** or **yarn**

## Quick Start

1. **Clone the repository** (if you haven't already)
   ```bash
   git clone <repository-url>
   cd crypto-market-watch
   ```

2. **Run the setup script**
   ```bash
   ./scripts/dev-setup.sh
   ```

3. **Configure your environment**
   - Edit `.env.local` with your actual configuration values
   - At minimum, you'll need to set your API keys

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Visit the application**
   - Open http://localhost:3001 in your browser

## Manual Setup

If you prefer to set up manually:

### 1. Start PostgreSQL

```bash
docker-compose up -d postgres
```

### 2. Create Environment File

```bash
cp env.example .env.local
```

Edit `.env.local` with your configuration.

### 3. Install Dependencies

```bash
npm install
cd client && npm install && cd ..
```

### 4. Start Development Server

```bash
npm run dev
```

## Database Connection

The PostgreSQL database will be available at:
- **Host**: localhost
- **Port**: 5432
- **Database**: crypto_market_watch
- **Username**: postgres
- **Password**: postgres

## Useful Commands

### Docker Commands
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Stop PostgreSQL
docker-compose down

# View PostgreSQL logs
docker-compose logs postgres

# Connect to database
docker-compose exec postgres psql -U postgres -d crypto_market_watch

# Reset database (removes all data)
docker-compose down -v
docker-compose up -d postgres
```

### Development Commands
```bash
# Start development server
npm run dev

# Build client
npm run build:client

# Run tests
npm test

# Lint code
npm run lint
```

## Environment Variables

Key environment variables you'll need to configure:

### Required
- `DATABASE_URL` - PostgreSQL connection string (automatically set for local development)
- `JWT_SECRET` - Secret key for JWT tokens

### Optional (for full functionality)
- `BREVO_API_KEY` - For email functionality
- `TELEGRAM_BOT_TOKEN` - For Telegram bot
- `VENICE_AI_KEY` or `OPENAI_API_KEY` - For AI analysis
- `STRIPE_SECRET_KEY` - For payment processing

## Database Schema

The application will automatically create all necessary tables when it starts up. The schema includes:

- **users** - User accounts and authentication
- **subscriptions** - User subscription plans
- **market_data** - Market data storage
- **ai_analysis** - AI analysis results
- **crypto_prices** - Cryptocurrency price data
- **alerts** - User alerts and notifications
- And many more...

## Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# Check PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Port Conflicts
If port 5432 is already in use:
1. Edit `docker-compose.yml`
2. Change the port mapping from `"5432:5432"` to `"5433:5432"`
3. Update `DATABASE_URL` in `.env.local` to use port 5433

### Database Reset
To completely reset the database:
```bash
docker-compose down -v
docker-compose up -d postgres
```

## Production vs Development

- **Development**: Uses local PostgreSQL via Docker
- **Production**: Uses Railway PostgreSQL database
- **Database**: PostgreSQL only (SQLite support removed)

## Getting Help

If you encounter issues:
1. Check the logs: `docker-compose logs postgres`
2. Verify your `.env.local` configuration
3. Ensure Docker is running
4. Try restarting the PostgreSQL container
