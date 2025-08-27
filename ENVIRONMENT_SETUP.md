# Environment Setup Guide

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_PATH=./data/market_data.db

# API Keys
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
FRED_API_KEY=your_fred_api_key_here
VENICE_AI_API_KEY=your_venice_ai_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# Cron Jobs Configuration
ENABLE_CRON_JOBS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Cron Jobs Configuration

### Development Mode
- **Automatic**: Cron jobs run automatically when `NODE_ENV=development`
- **Schedule**: Every 30 minutes
- **Manual Override**: Set `ENABLE_CRON_JOBS=false` to disable

### Production Mode
- **Manual**: Set `ENABLE_CRON_JOBS=true` to enable
- **Schedule**: Every 30 minutes
- **Default**: Disabled unless explicitly enabled

## Running the Application

### Development (with automatic data collection)
```bash
npm run dev
```

### Development (without automatic data collection)
```bash
ENABLE_CRON_JOBS=false npm run dev
```

### Manual data collection
```bash
npm run collect-data
```

### Setup cron jobs separately
```bash
npm run setup-cron
```
