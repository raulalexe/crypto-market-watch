# Economic Calendar System Setup Guide

## 🎯 Overview

The Economic Calendar System provides comprehensive US economic data collection, AI analysis, and market alerts using free government APIs. This replaces the Trading Economics implementation with a more robust and cost-effective solution.

## 🏗️ Architecture

### **Components Implemented:**

1. **EconomicDataService** - Core service for data collection
2. **EconomicCalendarCollector** - Orchestrates collection and analysis
3. **Database Tables** - `economic_data` and `economic_calendar`
4. **API Endpoints** - RESTful endpoints for data access
5. **Frontend Component** - EconomicCalendarCard for dashboard display
6. **AI Analysis Integration** - Market impact analysis using Venice AI
7. **Alert System** - Automated alerts for significant releases

## 📊 Data Sources

### **Government APIs (Free):**

1. **BLS API (Bureau of Labor Statistics)**
   - Nonfarm Payrolls (CES0000000001)
   - Unemployment Rate (LNS14000000)
   - Consumer Price Index (CUSR0000SA0, CUSR0000SA0L1E)

2. **BEA API (Bureau of Economic Analysis)**
   - Personal Consumption Expenditures (PCE)
   - GDP data

3. **FRED API (Federal Reserve Economic Data)**
   - Federal Funds Rate (FEDFUNDS)
   - GDP (GDP)
   - Retail Sales (RSAFS)

## 🔧 Setup Instructions

### **1. API Keys Setup**

Add these environment variables to your `.env.local`:

```bash
# Existing APIs (already configured)
BLS_API_KEY=your_bls_api_key_here
BEA_API_KEY=your_bea_api_key_here

# New API
FRED_API_KEY=your_fred_api_key_here
```

### **2. Get FRED API Key**

1. Visit: https://fred.stlouisfed.org/docs/api/api_key.html
2. Sign up for a free account
3. Generate an API key
4. Add to your `.env.local` file

### **3. Database Migration**

The system automatically creates the required tables:
- `economic_data` - Stores economic indicators
- `economic_calendar` - Stores scheduled events

### **4. Restart Server**

```bash
cd server
npm start
```

## 📅 Economic Calendar Events

### **High Impact Events (Market Moving):**

1. **Employment Situation** (First Friday of each month, 8:30 AM ET)
   - Nonfarm Payrolls
   - Unemployment Rate

2. **Consumer Price Index** (Second Tuesday of each month, 8:30 AM ET)
   - Headline CPI
   - Core CPI

3. **Personal Consumption Expenditures** (Last business day of month, 8:30 AM ET)
   - PCE
   - Core PCE

4. **FOMC Meetings** (8 times per year, 2:00 PM ET)
   - Federal Funds Rate decisions

### **Medium Impact Events:**

- GDP releases (Quarterly)
- Retail Sales (Monthly)
- Industrial Production
- Housing Starts

## 🤖 AI Analysis Features

### **Market Impact Analysis:**
- **Bullish/Bearish/Neutral** assessment
- **Confidence level** (0-1 scale)
- **Detailed reasoning** for market impact
- **Crypto-specific analysis** focusing on:
  - Federal Reserve policy implications
  - Inflation expectations
  - Risk-on vs risk-off sentiment
  - Dollar strength implications
  - Market volatility expectations

### **Surprise Analysis:**
- **Significance levels**: low, medium, high, very_high
- **Direction**: positive/negative
- **Change percentage** from previous reading
- **Market expectations** vs actual results

## 🚨 Alert System

### **Automatic Alerts Created For:**
- High-impact events with significant changes
- Events with market-moving potential (confidence > 0.6)
- Surprise releases that exceed expectations

### **Alert Types:**
- **ECONOMIC_DATA** - Economic indicator releases
- **Severity levels**: low, medium, high
- **Market impact** assessment included

## 🎛️ Admin Features

### **Manual Data Collection:**
- Admin-only "Collect Data" button
- Triggers comprehensive data collection
- Includes AI analysis and alert generation

### **API Endpoints:**

```bash
# Get upcoming events
GET /api/economic-calendar/events?days=7

# Get latest economic data
GET /api/economic-data/latest?series_id=NFP

# Get economic data history
GET /api/economic-data/history?series_id=CPI&months=12

# Manual collection (Admin only)
POST /api/economic-calendar/collect
```

## 📱 Frontend Features

### **Economic Calendar Card:**
- **Latest Economic Data** display
- **Upcoming Events** calendar
- **Impact indicators** (high/medium/low)
- **Category icons** (employment, inflation, monetary policy)
- **Admin collection button**
- **Real-time data refresh**

### **Data Display:**
- **Nonfarm Payrolls**: Shows change from previous month
- **Unemployment Rate**: Percentage with trend
- **CPI/PCE**: Inflation data with core values
- **Federal Funds Rate**: Current rate
- **GDP**: Economic growth data

## 🔄 Automated Collection

### **Cron Job Integration:**
The system integrates with existing cron jobs when `ENABLE_CRON_JOBS=true`:

- **Daily checks** for new economic releases
- **Automatic data collection** on release dates
- **AI analysis** of new data
- **Alert generation** for significant releases

### **Release Schedule Tracking:**
- **Employment Situation**: First Friday of each month
- **CPI**: Second Tuesday of each month
- **PCE**: Last business day of each month
- **FOMC**: 8 scheduled meetings per year

## 🧪 Testing

### **Test the Implementation:**

```bash
# Test API endpoints
curl http://localhost:3001/api/economic-calendar/events
curl http://localhost:3001/api/economic-data/latest?series_id=NFP

# Test admin collection (requires authentication)
curl -X POST http://localhost:3001/api/economic-calendar/collect \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Frontend Testing:**
1. Open the dashboard
2. Look for the "Economic Calendar" card
3. Verify data display and admin features
4. Test manual data collection (admin only)

## 📈 Key Benefits

### **Advantages over Trading Economics:**
- ✅ **Completely Free** - No API costs
- ✅ **Full US Data Access** - No tier limitations
- ✅ **Real-time Updates** - Data available immediately on release
- ✅ **Comprehensive Coverage** - Employment, inflation, GDP, monetary policy
- ✅ **AI-Powered Analysis** - Market impact assessment
- ✅ **Automated Alerts** - Significant release notifications
- ✅ **Admin Controls** - Manual collection capabilities

### **Market Intelligence:**
- **Employment data** for labor market insights
- **Inflation data** for monetary policy expectations
- **GDP data** for economic growth assessment
- **Federal Reserve data** for interest rate implications
- **Retail sales** for consumer spending trends

## 🚀 Next Steps

### **Immediate Actions:**
1. **Get FRED API key** and add to environment
2. **Restart server** to enable new features
3. **Test data collection** using admin button
4. **Verify frontend display** on dashboard

### **Future Enhancements:**
- **Additional economic indicators** (Industrial Production, Housing Starts)
- **International economic data** (EU, China, Japan)
- **Market expectations integration** (Bloomberg, Reuters)
- **Advanced charting** for economic data visualization
- **Historical correlation analysis** with crypto markets

## 🔍 Troubleshooting

### **Common Issues:**

1. **No data showing**: Check API keys are configured
2. **Collection fails**: Verify API keys are valid
3. **Frontend errors**: Check server is running
4. **Database errors**: Ensure tables are created

### **Debug Commands:**

```bash
# Check server health
curl http://localhost:3001/api/health

# Check economic calendar
curl http://localhost:3001/api/economic-calendar/events

# Check server logs
tail -f server/logs/app.log
```

## 📚 API Documentation

### **Economic Data Series IDs:**
- `NFP` - Nonfarm Payrolls
- `UNRATE` - Unemployment Rate
- `CPI` - Consumer Price Index
- `PCE` - Personal Consumption Expenditures
- `FEDFUNDS` - Federal Funds Rate
- `GDP` - Gross Domestic Product

### **Response Format:**
```json
{
  "success": true,
  "data": {
    "series_id": "NFP",
    "date": "2025-01-01",
    "value": 150000,
    "previous_value": 148000,
    "change_value": 2000,
    "source": "BLS",
    "description": "Total Nonfarm Payrolls"
  }
}
```

The Economic Calendar System is now fully implemented and ready for production use! 🎉
