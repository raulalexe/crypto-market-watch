# Crypto Market Watch

A comprehensive web application for monitoring cryptocurrency markets with AI-powered analysis, automated data collection, and backtesting capabilities.

## 🚀 Features

### Smart Data Collection
- **Macro Indicators**: DXY Index, US Treasury Yields (2Y & 10Y)
- **Equity Markets**: S&P 500, NASDAQ indices
- **Volatility**: VIX (Volatility Index)
- **Energy**: Oil prices (WTI)
- **Cryptocurrencies**: BTC, ETH, SOL, SUI, XRP prices
- **Market Sentiment**: Fear & Greed Index
- **Trending Narratives**: Market sentiment analysis

### AI-Powered Analysis
- **Venice AI Integration**: Advanced market direction prediction
- **Fallback Analysis**: Local analysis when AI service unavailable
- **Confidence Scoring**: Prediction confidence levels
- **Factor Analysis**: Key market factors identification

### Backtesting System
- **Historical Correlation**: Track prediction accuracy
- **Performance Metrics**: Overall accuracy and correlation scores
- **Asset-Specific Analysis**: Individual crypto performance tracking
- **Real-time Updates**: Continuous backtesting on new data

### Modern UI/UX
- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Auto-refresh every 5 minutes
- **Dark Theme**: Professional dark interface
- **Interactive Charts**: Visual data representation
- **Elegant Cards**: Clean, modern component design

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **SQLite** database (serverless-friendly)
- **Axios** for API calls
- **Node-cron** for scheduled tasks
- **Moment.js** for date handling

### Frontend
- **React 18** with functional components
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API communication
- **React Router** for navigation

### APIs & Services
- **Alpha Vantage** for market data (DXY, yields, equity indices, VIX, oil)
- **CoinGecko** for cryptocurrency prices (free, no API key required, 10,000 calls/month)
- **Direct Wallet Payments** for crypto payments (Base, Solana)
- **Venice AI** for market analysis
- **Brevo** for transactional emails (confirmation, alerts, notifications)
- **Alternative.me** for Fear & Greed Index

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- API keys for data sources

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crypto-market-monitor
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd client && npm install
   cd ..
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your API keys:
   ```env
   ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
   FRED_API_KEY=your_fred_api_key
   VENICE_AI_API_KEY=your_venice_ai_key
   BREVO_API_KEY=your_brevo_api_key
   BREVO_SENDER_EMAIL=noreply@yourdomain.com
   ```

4. **Initialize Database**
   ```bash
   npm run start
   ```

## 🚀 Development

### Running Locally

1. **Start the backend server**
   ```bash
   npm run server
   ```

2. **Start the frontend (in another terminal)**
   ```bash
   cd client && npm start
   ```

3. **Or run both simultaneously**
   ```bash
   npm run dev
   ```

### Manual Data Collection
```bash
npm run collect-data
```

### Setup Cron Jobs
```bash
npm run setup-cron
```

## 🌐 Deployment

### Vercel Deployment (Recommended)

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
   - Add your API keys as environment variables
   - Redeploy if needed

### Alternative Hosting
- **Railway**: Supports Node.js and SQLite
- **Render**: Free tier available
- **Heroku**: Requires PostgreSQL (modify database.js)

## 📊 API Endpoints

### Data Endpoints
- `GET /api/dashboard` - Complete dashboard data
- `GET /api/market-data` - Current market data
- `GET /api/crypto-prices` - Cryptocurrency prices
- `GET /api/fear-greed` - Fear & Greed Index
- `GET /api/narratives` - Trending narratives
- `GET /api/analysis` - Latest AI analysis
- `GET /api/backtest` - Backtest results

### Control Endpoints
- `POST /api/collect-data` - Trigger data collection
- `GET /api/health` - Health check

### Historical Data
- `GET /api/history/:dataType?limit=100` - Historical data

## 🔧 Configuration

### Data Collection Schedule
Modify `scripts/setupCron.js` to change collection frequency:
```javascript
// Every hour
'0 * * * *'

// Every hour
'0 * * * *'

// Every 6 hours
'0 */6 * * *'
```

### Supported Data Types
- `DXY` - Dollar Index
- `TREASURY_YIELD` - Treasury yields
- `EQUITY_INDEX` - Stock indices
- `VOLATILITY_INDEX` - VIX
- `ENERGY_PRICE` - Oil prices

## 📈 Usage

### Dashboard Overview
- **Market Data**: Real-time macro and crypto indicators
- **AI Analysis**: Current market direction with confidence
- **Fear & Greed**: Market sentiment indicator
- **Crypto Prices**: Live cryptocurrency prices
- **Narratives**: Trending market themes
- **Backtest Results**: Historical prediction performance

### Data Collection
- **Automatic**: Runs every hour via cron
- **Manual**: Click "Collect Data" button
- **API Trigger**: POST to `/api/collect-data`

### Analysis Features
- **Market Direction**: BULLISH/BEARISH/NEUTRAL predictions
- **Confidence Levels**: 0-100% confidence scoring
- **Key Factors**: Identified market influencers
- **Risk Assessment**: Potential market risks

### Email Notifications
- **Email Confirmation**: Account verification emails
- **Welcome Emails**: New user onboarding
- **Password Reset**: Secure password recovery
- **Market Alerts**: Custom price and market notifications
- **Bulk Notifications**: System-wide announcements

## 🔒 Security

### Environment Variables
- Never commit API keys to version control
- Use environment variables for all sensitive data
- Rotate API keys regularly

### API Rate Limits
- Alpha Vantage: 5 calls/minute (free tier)
- Implement rate limiting for production
- Consider paid tiers for higher limits

## 🐛 Troubleshooting

### Common Issues

1. **Database Errors**
   ```bash
   # Check database file permissions
   ls -la data/
   
   # Reinitialize database
   rm data/market_data.db
   npm start
   ```

2. **API Key Issues**
   - Verify all API keys in `.env`
   - Check API service status
   - Monitor rate limits

3. **Data Collection Failures**
   ```bash
   # Test individual collection
   node scripts/collectData.js
   
   # Check logs
   tail -f logs/app.log
   ```

### Logs
- Server logs: Console output
- Database: SQLite file in `data/`
- API errors: Network tab in browser

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Alpha Vantage** for market data APIs
- **Venice AI** for AI analysis capabilities
- **Alternative.me** for Fear & Greed Index
- **Tailwind CSS** for styling framework
- **React** team for the amazing framework

## 📧 Email Setup

For email functionality setup, see [BREVO_EMAIL_SETUP.md](./BREVO_EMAIL_SETUP.md)

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review API documentation

---

**Note**: This application is for educational and informational purposes. Always do your own research before making investment decisions.
