# Crypto Market Watch

A comprehensive web application for monitoring cryptocurrency markets with AI-powered analysis, automated data collection, backtesting capabilities, and subscription-based features.

## 🚀 Features

### Smart Data Collection
- **Macro Indicators**: DXY Index, US Treasury Yields (2Y & 10Y), PCE, PPI, Inflation data
- **Equity Markets**: S&P 500, NASDAQ indices, VIX (Volatility Index)
- **Energy**: Oil prices (WTI)
- **Cryptocurrencies**: Real-time prices via CoinGecko widget (BTC, ETH, SOL, SUI, XRP)
- **Market Sentiment**: Fear & Greed Index, Altcoin Season Index, Season Indicator
- **Trending Narratives**: Market sentiment analysis
- **On-chain Data**: Bitcoin dominance, stablecoin metrics, exchange flows
- **Economic Data**: Money supply, derivatives data, Layer 1 blockchain metrics

### AI-Powered Analysis
- **Venice AI Integration**: Advanced market direction prediction
- **Multiple AI Models**: Short, mid, and long-term analysis
- **Confidence Scoring**: Prediction confidence levels
- **Factor Analysis**: Key market factors identification
- **Historical Analysis**: AI analysis results stored and filterable

### Advanced Analytics & Backtesting
- **Asset Correlations**: Real-time crypto correlation matrix
- **Risk Analysis**: VaR calculations, drawdown analysis
- **Portfolio Metrics**: Sharpe ratio, volatility analysis
- **Backtest Performance**: Track AI prediction accuracy over time
- **Professional Reports**: PDF export with comprehensive analytics

### Data Export & API Access
- **Multiple Formats**: CSV, JSON, PDF, Excel, XML exports
- **Historical Data**: Complete historical data access
- **API Access**: RESTful API for developers (Pro tier)
- **Scheduled Exports**: Automated data export scheduling

### Subscription Plans
- **Free Plan**: Basic market data, limited historical access
- **Pro Plan**: Full historical data, data exports, API access
- **Premium Plan**: Advanced analytics, backtesting, admin dashboard
- **Crypto Payments**: Base and Solana wallet payments (coming soon)

### Modern UI/UX
- **Responsive Design**: Optimized for desktop and mobile
- **Real-time Updates**: Auto-refresh every 5 minutes
- **Dark Theme**: Professional dark interface with consistent email templates
- **Interactive Charts**: Visual data representation
- **Elegant Cards**: Clean, modern component design

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database (production-ready)
- **Axios** for API calls with interceptors
- **Node-cron** for scheduled tasks
- **Moment.js** for date handling
- **Puppeteer** for PDF generation
- **JWT** for authentication
- **Stripe** for payment processing

### Frontend
- **React 18** with functional components
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API communication with token refresh
- **React Router** for navigation
- **Responsive design** for mobile optimization

### APIs & Services
- **Alpha Vantage** for market data (DXY, yields, equity indices, VIX, oil)
- **FRED API** for economic data (PCE, PPI, inflation)
- **CoinGecko** for cryptocurrency prices and global metrics
- **CryptoQuote** for crypto correlations (external API)
- **BlockchainCenter** methodology for Altcoin Season Index
- **Venice AI** for market analysis
- **Brevo** for transactional emails (dark theme templates)
- **Alternative.me** for Fear & Greed Index
- **Stripe** for subscription management
- **Base & Solana** for crypto wallet payments

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database
- API keys for data sources

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crypto-market-watch
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd client && npm install
   cd ..
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/crypto_market_watch
   
   # API Keys
   ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
   FRED_API_KEY=your_fred_api_key
   VENICE_AI_API_KEY=your_venice_ai_key
   BREVO_API_KEY=your_brevo_api_key
   BREVO_SENDER_EMAIL=noreply@crypto-market-watch.xyz
   
   # Optional APIs
   CRYPTOQUOTE_API_KEY=your_cryptoquote_key
   COINGLASS_API_KEY=your_coinglass_key
   
   # Payment Processing
   STRIPE_SECRET_KEY=sk_test_your_stripe_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   
   # Crypto Payments
   SUPPORT_CRYPTO_PAYMENT=true
   BASE_WALLET_ADDRESS=0x...
   SOLANA_WALLET_ADDRESS=...
   DISCOUNT_OFFER=9.99
   
   # JWT
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=http://localhost:3000
   ```

4. **Initialize Database**
   ```bash
   npm run migrate
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
- `GET /api/correlation` - Asset correlation matrix
- `GET /api/analytics/advanced` - Advanced analytics data

### Authentication & User Management
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

### Subscription Management
- `GET /api/subscription` - Get user subscription status
- `POST /api/subscribe/stripe` - Create Stripe subscription
- `POST /api/subscribe/wallet-payment` - Create crypto payment
- `POST /api/verify-transaction` - Verify crypto transaction
- `GET /api/subscription/pricing` - Get subscription pricing

### Data Export
- `POST /api/exports/create` - Create data export
- `GET /api/exports/:id` - Download export file
- `POST /api/analytics/export` - Export analytics report

### Admin Endpoints
- `GET /api/admin/users` - Get all users (admin only)
- `PUT /api/admin/users/:id/activate` - Activate/deactivate user
- `GET /api/admin/dashboard` - Admin dashboard data

### Control Endpoints
- `POST /api/collect-data` - Trigger data collection
- `GET /api/health` - Health check

### Historical Data
- `GET /api/history/:dataType?limit=100` - Historical data
- `GET /api/history/ai-analysis` - AI analysis history

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
- **Crypto Prices**: Live cryptocurrency prices via CoinGecko widget
- **Narratives**: Trending market themes
- **Backtest Results**: Historical prediction performance
- **Asset Correlations**: Real-time crypto correlation matrix
- **Advanced Analytics**: Risk analysis, portfolio metrics

### Subscription Plans
- **Free Plan**: Basic market data, 24-hour historical access
- **Pro Plan**: Full historical data, data exports (CSV, JSON, PDF, Excel), API access
- **Premium Plan**: Advanced analytics, backtesting, admin dashboard, priority support

### Data Collection
- **Automatic**: Runs every hour via cron
- **Manual**: Click "Collect Data" button
- **API Trigger**: POST to `/api/collect-data`
- **Comprehensive**: Macro indicators, crypto data, economic data, on-chain metrics

### Analysis Features
- **Market Direction**: BULLISH/BEARISH/NEUTRAL predictions
- **Multiple Timeframes**: Short, mid, and long-term analysis
- **Confidence Levels**: 0-100% confidence scoring
- **Key Factors**: Identified market influencers
- **Risk Assessment**: VaR calculations, drawdown analysis
- **Historical Analysis**: Filterable AI analysis results by model, date, term

### Data Export & API
- **Multiple Formats**: CSV, JSON, PDF, Excel, XML
- **Scheduled Exports**: Automated data export scheduling
- **API Access**: RESTful API for developers (Pro tier)
- **Advanced Reports**: Professional PDF analytics reports

### Payment Options
- **Stripe**: Credit card payments
- **Crypto Wallets**: Base and Solana USDC payments (coming soon)
- **Discount Offers**: First-month discounts available

### Email Notifications
- **Dark Theme**: Consistent dark background email templates
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
   # Check PostgreSQL connection
   psql $DATABASE_URL
   
   # Run migrations
   npm run migrate
   
   # Check database tables
   \dt
   ```

2. **API Key Issues**
   - Verify all API keys in `.env.local`
   - Check API service status
   - Monitor rate limits
   - Test individual API endpoints

3. **Data Collection Failures**
   ```bash
   # Test individual collection
   node scripts/collectData.js
   
   # Check server logs
   npm run server
   ```

4. **Authentication Issues**
   ```bash
   # Check JWT secret is set
   echo $JWT_SECRET
   
   # Verify token in browser dev tools
   localStorage.getItem('token')
   ```

5. **Payment Issues**
   - Verify Stripe keys are correct
   - Check webhook endpoint is configured
   - Test with Stripe test cards
   - Verify crypto wallet addresses

### Logs
- Server logs: Console output
- Database: PostgreSQL logs
- API errors: Network tab in browser
- Email logs: Brevo dashboard

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
- **FRED API** for economic data
- **CoinGecko** for cryptocurrency data and global metrics
- **CryptoQuote** for crypto correlation data
- **Venice AI** for AI analysis capabilities
- **Alternative.me** for Fear & Greed Index
- **BlockchainCenter** for Altcoin Season methodology
- **Brevo** for email services
- **Stripe** for payment processing
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
