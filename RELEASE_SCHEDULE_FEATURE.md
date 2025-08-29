# Economic Release Schedule Tracking Feature

## Overview

This feature provides comprehensive tracking of BLS CPI and BEA PCE economic data releases with strategic trading recommendations for long positions. The system automatically generates release schedules, sends pre-release notifications, and provides actionable trading advice.

## Features

### 1️⃣ Release Schedule Tracking

#### Official Sources
- **BLS CPI**: Bureau of Labor Statistics Consumer Price Index
- **BEA PCE**: Bureau of Economic Analysis Personal Consumption Expenditures

#### Local Calendar Management
- Stores release dates locally in JSON format
- Automatically generates schedules for current and next year
- Adjusts for weekends (moves to next business day)
- Supports custom release additions

#### Release Information
- Release date and time (EST)
- Impact level (High/Medium/Low)
- Source agency
- Description and official URLs
- Notification tracking

### 2️⃣ Pre-Release Notifications

#### Notification Intervals
- 60 minutes before release
- 30 minutes before release
- 15 minutes before release
- 5 minutes before release

#### Notification Channels
- Telegram messages
- Email alerts
- In-app alerts
- Push notifications

#### Notification Content
- Release details (title, date, time)
- Time remaining until release
- Impact level and urgency
- Strategy tips and recommendations
- Links to official sources

### 3️⃣ Strategy Recommendations

#### Timeline-Based Actions

**60 minutes before release:**
- Review all open long positions
- Consider reducing leverage by 30-50%
- Set wider stop-loss buffers (2-3x normal)
- Prepare hedging instruments

**30 minutes before release:**
- Execute partial profit-taking on strong performers
- Implement hedge positions
- Lower leverage to maximum 2x
- Set emergency stop-losses

**15 minutes before release:**
- Close 50% of remaining long positions
- Increase hedge ratio to 1:1
- Set tight stop-losses on remaining positions
- Prepare for potential market halt

**5 minutes before release:**
- Close all speculative long positions
- Maintain only core long-term holdings
- Ensure all stop-losses are active
- Monitor for market volatility

#### Release-Specific Recommendations

**CPI Releases:**
- Monitor inflation expectations vs actual
- Watch for core vs headline CPI divergence
- Prepare for potential Fed policy implications
- Track market reaction to previous CPI releases

**PCE Releases:**
- Focus on core PCE (Fed's preferred measure)
- Compare with recent CPI data
- Watch for spending pattern changes
- Monitor Fed communication post-release

### 4️⃣ Hedging Options

#### Base Hedging Instruments
- **BTC Perpetual Futures** (Short) - High correlation
- **VIX Futures** (Long) - High correlation
- **USD Index Futures** (Long) - Medium correlation

#### Release-Specific Hedging
- **CPI**: Treasury Bond Futures (Long) - High correlation
- **PCE**: Gold Futures (Long) - Medium correlation

### 5️⃣ Position Management Tools

#### Position Sizing Recommendations
- Dynamic exposure reduction based on time to release
- Suggested position sizes for different timeframes
- Risk-adjusted recommendations

#### Leverage Management
- Progressive leverage reduction as release approaches
- Maximum leverage limits for different timeframes
- Safety-first approach

#### Stop-Loss Optimization
- Wider buffers for pre-release periods
- Dynamic stop-loss adjustments
- Emergency stop-loss settings

## API Endpoints

### Public Endpoints

#### Get Upcoming Releases
```
GET /api/releases?limit=10
```
Returns list of upcoming economic releases.

#### Get Next High-Impact Release
```
GET /api/releases/next-high-impact
```
Returns the next high-impact economic release.

#### Get Release Statistics
```
GET /api/releases/stats
```
Returns statistics about releases (total, upcoming, high-impact, etc.).

#### Get Strategy Recommendations
```
GET /api/releases/strategy?minutes=30
```
Returns strategy recommendations for upcoming releases.

#### Position Sizing Recommendations
```
GET /api/releases/position-sizing?currentExposure=10000&minutesUntil=30
```
Returns position sizing recommendations based on current exposure and time to release.

#### Stop-Loss Recommendations
```
GET /api/releases/stop-loss?currentStopLoss=5&minutesUntil=30
```
Returns stop-loss recommendations with appropriate buffers.

#### Leverage Recommendations
```
GET /api/releases/leverage?currentLeverage=3&minutesUntil=30
```
Returns leverage recommendations for risk management.

### Admin Endpoints

#### Add Custom Release
```
POST /api/admin/releases
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "type": "CUSTOM",
  "title": "Custom Economic Release",
  "date": "2024-01-15",
  "time": "10:00",
  "impact": "medium",
  "description": "Custom economic data release"
}
```

#### Update Release
```
PUT /api/admin/releases/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Updated Release Title",
  "impact": "high"
}
```

#### Delete Release
```
DELETE /api/admin/releases/:id
Authorization: Bearer <admin_token>
```

## Frontend Components

### ReleaseSchedulePage
Main dashboard component providing:
- Release schedule overview
- Next high-impact release alerts
- Strategy recommendations
- Position management tools
- Interactive release table
- Release details modal

### Features
- Real-time countdown timers
- Color-coded urgency levels
- Interactive position management
- Strategy timeline visualization
- Hedging options display

## Data Structure

### Release Object
```json
{
  "id": "cpi_2024_1",
  "type": "CPI",
  "source": "BLS",
  "title": "Consumer Price Index (CPI) - January 2024",
  "date": "2024-01-13",
  "time": "08:30",
  "timezone": "America/New_York",
  "impact": "high",
  "description": "Monthly inflation data from Bureau of Labor Statistics",
  "url": "https://www.bls.gov/schedule/news_release/cpi.htm",
  "notificationsSent": ["60min", "30min"]
}
```

### Strategy Recommendations
```json
{
  "hasUpcomingRelease": true,
  "release": { /* release object */ },
  "minutesUntil": 45,
  "urgency": "high",
  "recommendations": [
    {
      "timeline": "60min",
      "urgency": "high",
      "actions": ["Review all open long positions", "..."],
      "priority": "high"
    }
  ],
  "riskLevel": "moderate",
  "hedgingOptions": [
    {
      "instrument": "BTC Perpetual Futures",
      "type": "Short",
      "correlation": "high",
      "description": "Direct hedge against crypto market volatility"
    }
  ]
}
```

## Configuration

### Notification Settings
```json
{
  "notificationIntervals": [60, 30, 15, 5],
  "enabled": true,
  "autoUpdate": true
}
```

### Calendar File Location
```
server/data/release_calendar.json
```

## Usage Examples

### Starting the Service
The release schedule service automatically initializes when the server starts:

```javascript
// Server startup
const releaseScheduleService = new ReleaseScheduleService();
await releaseScheduleService.initializeCalendar();
releaseScheduleService.startNotificationChecker();
```

### Testing the Feature
Run the test script to verify functionality:

```bash
node test-release-schedule.js
```

### Accessing the Dashboard
Navigate to `/app/releases` in the web application to access the release schedule dashboard.

## Security Considerations

- Admin endpoints require authentication and admin privileges
- Release data is stored locally (not in database)
- Notification tracking prevents duplicate alerts
- Rate limiting on API endpoints

## Future Enhancements

1. **Additional Economic Indicators**
   - Non-Farm Payrolls (NFP)
   - Federal Reserve meetings
   - GDP releases
   - Employment data

2. **Advanced Analytics**
   - Historical market reactions
   - Volatility predictions
   - Correlation analysis
   - Backtesting capabilities

3. **Integration Features**
   - Trading platform APIs
   - Automated order execution
   - Portfolio tracking
   - Risk management systems

4. **Customization Options**
   - User-defined notification preferences
   - Custom strategy templates
   - Personal risk tolerance settings
   - Position size calculators

## Troubleshooting

### Common Issues

1. **Calendar not loading**
   - Check file permissions for `server/data/` directory
   - Verify JSON file format
   - Check server logs for initialization errors

2. **Notifications not sending**
   - Verify Telegram bot configuration
   - Check email service settings
   - Ensure notification intervals are properly set

3. **Strategy recommendations not updating**
   - Check system time synchronization
   - Verify release schedule data
   - Monitor API endpoint responses

### Debug Commands

```bash
# Check calendar file
cat server/data/release_calendar.json

# Test API endpoints
curl http://localhost:3001/api/releases

# Monitor server logs
tail -f server/logs/app.log
```

## Contributing

When adding new features to the release schedule system:

1. Follow the existing code structure
2. Add appropriate error handling
3. Include comprehensive tests
4. Update documentation
5. Consider backward compatibility

## License

This feature is part of the main application and follows the same licensing terms.