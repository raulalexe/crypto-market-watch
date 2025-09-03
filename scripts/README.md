# Data Collection Scripts

This directory contains scripts for automated data collection in the Crypto Market Watch application.

## Scripts Overview

### 1. `collect-all-data.js` (Main Script)
**Purpose**: Comprehensive data collection for cron jobs and scheduled tasks
**What it collects**:
- ✅ **Inflation Data**: CPI and PCE from BLS/BEA APIs
- ✅ **Crypto Prices**: Real-time cryptocurrency prices and market data
- ✅ **Advanced Metrics**: Market sentiment, derivatives, on-chain data
- ✅ **Trending Narratives**: Social media trends and market narratives
- ✅ **Upcoming Events**: Economic calendar and crypto events
- ✅ **Backtest Results**: AI prediction accuracy analysis
- ✅ **AI Analysis**: Market direction predictions and insights

**Usage**:
```bash
# Run comprehensive data collection
node scripts/collect-all-data.js
```

### 2. `collectData.js` (Core Collection Logic)
**Purpose**: Core data collection logic used by the main script
**Features**:
- Full market data collection
- AI analysis and backtesting
- Event notification processing
- Error handling and logging

**Usage**:
```bash
# Full data collection
node scripts/collectData.js

# Analysis only (using existing data)
node scripts/collectData.js --analysis-only
```

## Cron Job Setup

### Daily Data Collection (Recommended)
```bash
# Add to crontab (crontab -e)
# Collect data daily at 9:00 AM UTC
0 9 * * * cd /path/to/crypto-market-watch && node scripts/collect-all-data.js >> /var/log/crypto-data-collection.log 2>&1
```

### Multiple Times Daily (High Frequency)
```bash
# Collect data every 4 hours
0 */4 * * * cd /path/to/crypto-market-watch && node scripts/collect-all-data.js >> /var/log/crypto-data-collection.log 2>&1
```

### Market Hours Only (Weekdays)
```bash
# Collect data every 2 hours during market hours (9 AM - 5 PM UTC, weekdays only)
0 9-17 * * 1-5 cd /path/to/crypto-market-watch && node scripts/collect-all-data.js >> /var/log/crypto-data-collection.log 2>&1
```

## Data Types Collected

### 1. **Inflation Data**
- **CPI (Consumer Price Index)**: From BLS API
- **PCE (Personal Consumption Expenditures)**: From BEA API
- **YoY calculations**: Year-over-year percentage changes
- **Core vs Headline**: Food & energy excluded vs included

### 2. **Crypto Market Data**
- **Top 100 cryptocurrencies**: Prices, market cap, volume
- **Stablecoin metrics**: Market cap, dominance ratios
- **Bitcoin dominance**: Market share analysis
- **Exchange flows**: Binance trading data

### 3. **Traditional Markets**
- **DXY (US Dollar Index)**: Currency strength
- **Treasury yields**: 2Y and 10Y rates
- **Equity indices**: S&P 500, NASDAQ
- **VIX**: Volatility index
- **Oil prices**: WTI crude oil

### 4. **Advanced Metrics**
- **Market sentiment**: Fear & Greed index
- **Derivatives data**: Futures, options, funding rates
- **On-chain metrics**: Hash rates, transaction counts
- **Social sentiment**: Social media analysis

### 5. **Trending Narratives**
- **Social media trends**: Reddit, Twitter analysis
- **Market narratives**: Categorized themes
- **Money flow analysis**: Volume and price correlation

### 6. **AI Analysis & Backtesting**
- **Market predictions**: AI-powered analysis
- **Backtest results**: Historical prediction accuracy
- **Confidence metrics**: AI prediction reliability

## Monitoring & Logging

### Log Files
```bash
# View collection logs
tail -f /var/log/crypto-data-collection.log

# Check recent runs
grep "✅ Comprehensive data collection completed" /var/log/crypto-data-collection.log
```

### Health Checks
```bash
# Test script manually
node scripts/collect-all-data.js

# Check database for recent data
psql -d crypto_market_watch -c "SELECT type, created_at FROM inflation_data ORDER BY created_at DESC LIMIT 5;"
```

## Error Handling

The scripts include comprehensive error handling:
- **API failures**: Logged and handled gracefully
- **Database errors**: Connection retries and fallbacks
- **Rate limiting**: Automatic delays between API calls
- **Process termination**: Graceful shutdown handling

## Performance Considerations

- **API optimization**: Bulk collection reduces API calls
- **Database efficiency**: Batch inserts and optimized queries
- **Memory management**: Proper cleanup and resource management
- **Rate limiting**: Respects API provider limits

## Troubleshooting

### Common Issues
1. **API key expired**: Check environment variables
2. **Database connection**: Verify PostgreSQL is running
3. **Rate limiting**: Check API provider limits
4. **Memory issues**: Monitor system resources

### Debug Mode
```bash
# Run with verbose logging
DEBUG=* node scripts/collect-all-data.js
```

## Dependencies

- Node.js 16+
- PostgreSQL database
- Environment variables (.env.local)
- API keys for external services

## Security Notes

- Store API keys in environment variables
- Use dedicated database user for data collection
- Monitor API usage and rate limits
- Regular log rotation and cleanup
