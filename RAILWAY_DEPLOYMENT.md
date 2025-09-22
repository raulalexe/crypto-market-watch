# Railway Deployment Guide

## 🚀 Quick Deploy to Railway

### **Step 1: Install Railway CLI**
```bash
npm install -g @railway/cli
```

### **Step 2: Login to Railway**
```bash
railway login
```

### **Step 3: Initialize Railway Project**
```bash
railway init
```

### **Step 4: Deploy**
```bash
railway up
```

## 🔧 Environment Variables Setup

### **Required Environment Variables**

Set these in Railway Dashboard → Your Project → Variables:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration (Railway will provide this)
DATABASE_URL=your_railway_postgresql_url_here

# API Keys
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
COINAPI_API_KEY=your_coinapi_key_here
FRED_API_KEY=your_fred_api_key_here
VENICE_AI_API_KEY=your_venice_ai_key_here

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_here

# Stripe Configuration (if using payments)
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# NOWPayments Configuration (for crypto payments)
NOWPAYMENTS_API_KEY=your_nowpayments_key_here

# Data Collection Settings
COLLECTION_INTERVAL_HOURS=3
ENABLE_CRON_JOBS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🗄️ Database Setup

### **Option 1: Use Railway PostgreSQL (Recommended)**

1. **Add PostgreSQL Plugin**:
   - Go to Railway Dashboard
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically provide `DATABASE_URL`

2. **Update Database Configuration**:
   - Railway provides managed PostgreSQL
   - No need to manage SQLite files
   - Automatic backups and scaling

### **Option 2: Keep SQLite (Simple)**

If you want to keep SQLite:
```bash
# Add this environment variable
DATABASE_PATH=/tmp/market_data.db
```

## 📊 Data Collection Setup

### **Automatic Data Collection**

Railway supports background processes, so your cron jobs will work:

```bash
# Enable automatic data collection
ENABLE_CRON_JOBS=true
```

### **Manual Data Collection**

You can also trigger data collection manually:
```bash
railway run npm run collect-data
```

## 🔍 Monitoring & Logs

### **View Logs**
```bash
railway logs
```

### **Monitor Performance**
- Railway Dashboard → Your Project → Metrics
- View CPU, memory, and network usage

### **Health Check**
Your app includes a health check endpoint:
```
GET /api/health
```

## 🚀 Deployment Commands

### **Deploy to Railway**
```bash
railway up
```

### **Deploy with Environment Variables**
```bash
railway up --environment production
```

### **View Deployment Status**
```bash
railway status
```

### **Open Deployed App**
```bash
railway open
```

## 🔧 Troubleshooting

### **Common Issues**

1. **Build Fails**:
   ```bash
   # Check build logs
   railway logs
   
   # Test build locally
   npm run build
   ```

2. **Database Connection Issues**:
   - Verify `DATABASE_URL` is set correctly
   - Check Railway PostgreSQL plugin is active

3. **Cron Jobs Not Running**:
   - Verify `ENABLE_CRON_JOBS=true`
   - Check logs for cron job messages

### **Useful Commands**

```bash
# SSH into Railway container
railway shell

# Run commands in Railway environment
railway run npm run collect-data

# View real-time logs
railway logs --follow

# Restart deployment
railway service restart
```

## 💰 Cost Optimization

### **Railway Free Tier**
- $5/month credit
- Perfect for small to medium apps
- Automatic scaling

### **Cost Saving Tips**
1. **Use PostgreSQL**: More efficient than SQLite
2. **Optimize Cron Jobs**: Don't run too frequently
3. **Monitor Usage**: Check Railway dashboard regularly

## 🎯 Next Steps

1. **Deploy**: Follow the quick deploy steps above
2. **Configure**: Set up environment variables
3. **Test**: Verify data collection works
4. **Monitor**: Set up alerts and monitoring
5. **Scale**: Upgrade plan if needed

Your crypto market watch app will run perfectly on Railway with full background process support! 🚀
