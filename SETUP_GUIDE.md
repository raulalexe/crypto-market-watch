# Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
./deploy.sh
```

### 2. Set Up API Keys
Edit `.env` file with your API keys:
```env
ALPHA_VANTAGE_API_KEY=your_key_here
COINAPI_API_KEY=your_key_here
FRED_API_KEY=your_key_here
VENICE_AI_API_KEY=your_key_here
```

**Free API Keys Available:**
- **Alpha Vantage**: https://www.alphavantage.co/support/#api-key (Free tier: 5 calls/minute)
- **Alternative.me**: No key needed for Fear & Greed Index
- **Venice AI**: Optional - app works without it using fallback analysis

### 3. Run the Application
```bash
# Development mode (both frontend and backend)
npm run dev

# Production mode
npm start
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 📊 What You'll See

### Dashboard Features
- **Market Data**: DXY, Treasury Yields, S&P 500, NASDAQ, VIX, Oil
- **Crypto Prices**: BTC, ETH, SOL, SUI, XRP with 24h changes
- **AI Analysis**: Market direction prediction with confidence
- **Fear & Greed Index**: Market sentiment indicator
- **Trending Narratives**: Market themes and sentiment
- **Backtest Results**: Historical prediction accuracy

### Data Collection
- **Automatic**: Every 3 hours via cron jobs
- **Manual**: Click "Collect Data" button
- **API**: POST to `/api/collect-data`

## 🌐 Deploy to Vercel (Free)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set Environment Variables**
   - Go to Vercel dashboard
   - Add your API keys
   - Redeploy

## 🔧 Troubleshooting

### Common Issues
1. **"No data available"**: Set up API keys in `.env`
2. **Database errors**: Run `npm start` to initialize database
3. **Port conflicts**: Change PORT in `.env` file

### Test Data Collection
```bash
npm run collect-data
```

### Check Server Status
```bash
curl http://localhost:3001/api/health
```

## 📈 Next Steps

1. **Add More Data Sources**: Modify `server/services/dataCollector.js`
2. **Custom AI Analysis**: Update `server/services/aiAnalyzer.js`
3. **Add Charts**: Integrate Recharts for visualizations
4. **Real-time Updates**: Add WebSocket support
5. **Mobile App**: Create React Native version

## 🎯 Key Features Implemented

✅ **Data Pipeline**: Collects macro and crypto data every 3 hours  
✅ **AI Integration**: Venice AI + fallback analysis  
✅ **Backtesting**: Historical prediction accuracy tracking  
✅ **Fear & Greed Index**: Market sentiment monitoring  
✅ **Trending Narratives**: Market theme analysis  
✅ **Modern UI**: Responsive dark theme with Tailwind CSS  
✅ **Vercel Ready**: Zero-cost deployment configuration  
✅ **SQLite Database**: Serverless-friendly data storage  

## 📞 Support

- Check the main README.md for detailed documentation
- Review API documentation for data sources
- Create issues for bugs or feature requests

---

**Happy Crypto Monitoring! 📊🚀**