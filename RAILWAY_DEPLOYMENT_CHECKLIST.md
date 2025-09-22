# Railway Deployment Checklist

## ✅ Pre-Deployment Checklist

### **1. Code Preparation**
- [ ] All code changes committed to git
- [ ] No sensitive data in code (API keys, secrets)
- [ ] Database schema updated (plan_type vs plan_id fix applied)
- [ ] Sidebar navigation permissions fixed (Pro users can access advanced features)
- [ ] All dependencies properly listed in package.json

### **2. Environment Variables**
- [ ] JWT_SECRET (generate a secure random string)
- [ ] DATABASE_URL (Railway PostgreSQL will provide this)
- [ ] ALPHA_VANTAGE_API_KEY (for market data)
- [ ] COINAPI_API_KEY (for crypto prices)
- [ ] FRED_API_KEY (for economic data)
- [ ] VENICE_AI_API_KEY (for AI analysis)
- [ ] STRIPE_SECRET_KEY (if using payments)
- [ ] STRIPE_PUBLISHABLE_KEY (if using payments)
- [ ] STRIPE_WEBHOOK_SECRET (if using payments)
- [ ] NOWPAYMENTS_API_KEY (if using crypto payments)
- [ ] PORT=3000
- [ ] NODE_ENV=production
- [ ] COLLECTION_INTERVAL_HOURS=3
- [ ] ENABLE_CRON_JOBS=true

### **3. Railway Setup**
- [ ] Railway CLI installed: `npm install -g @railway/cli`
- [ ] Logged into Railway: `railway login`
- [ ] Project initialized: `railway init`
- [ ] PostgreSQL plugin added in Railway dashboard
- [ ] Environment variables set in Railway dashboard

### **4. Database Setup**
- [ ] PostgreSQL plugin active in Railway
- [ ] DATABASE_URL automatically provided by Railway
- [ ] Database tables will be created automatically on first run

### **5. Build Configuration**
- [ ] package.json has correct start script: `"start": "node server/index.js"`
- [ ] railway.json configured properly
- [ ] Client build script works: `npm run build`
- [ ] All dependencies installed

## 🚀 Deployment Steps

### **Step 1: Prepare Local Environment**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project (if not already done)
railway init
```

### **Step 2: Set Up Railway Project**
1. Go to Railway Dashboard
2. Add PostgreSQL plugin
3. Set environment variables
4. Configure deployment settings

### **Step 3: Deploy**
```bash
# Run deployment script
chmod +x deploy-railway.sh
./deploy-railway.sh

# Or deploy manually
railway up
```

### **Step 4: Post-Deployment Verification**
- [ ] Health check endpoint works: `GET /api/health`
- [ ] Database connection successful
- [ ] Data collection cron jobs running
- [ ] Frontend loads correctly
- [ ] Authentication works
- [ ] Pro user can access advanced features

## 🔧 Environment Variables Template

Copy this to Railway dashboard → Variables:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Database (Railway will provide this)
DATABASE_URL=postgresql://...

# API Keys
ALPHA_VANTAGE_API_KEY=your_key_here
COINAPI_API_KEY=your_key_here
FRED_API_KEY=your_key_here
VENICE_AI_API_KEY=your_key_here

# JWT Configuration
JWT_SECRET=your_secure_random_string_here

# Payment Configuration (if using)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NOWPAYMENTS_API_KEY=your_key_here

# Data Collection
COLLECTION_INTERVAL_HOURS=3
ENABLE_CRON_JOBS=true
```

## 🐛 Troubleshooting

### **Common Issues**

1. **Build Fails**
   - Check Railway logs: `railway logs`
   - Verify all dependencies in package.json
   - Test build locally: `npm run build`

2. **Database Connection Issues**
   - Verify DATABASE_URL is set
   - Check PostgreSQL plugin is active
   - Restart deployment: `railway service restart`

3. **Environment Variables Not Working**
   - Check Railway dashboard → Variables
   - Redeploy after setting variables: `railway up`

4. **Cron Jobs Not Running**
   - Verify ENABLE_CRON_JOBS=true
   - Check logs for cron messages
   - Test manually: `railway run npm run collect-data`

### **Useful Commands**
```bash
# View logs
railway logs

# SSH into container
railway shell

# Run commands in Railway environment
railway run npm run collect-data

# Restart service
railway service restart

# Open deployed app
railway open
```

## 📊 Monitoring

### **Health Checks**
- [ ] `/api/health` returns 200 OK
- [ ] Database queries work
- [ ] Data collection running
- [ ] Frontend loads without errors

### **Performance Monitoring**
- [ ] Check Railway dashboard metrics
- [ ] Monitor CPU and memory usage
- [ ] Watch for any error logs
- [ ] Verify cron job execution

## 🎯 Success Criteria

Your deployment is successful when:
- [ ] App is accessible via Railway URL
- [ ] All API endpoints respond correctly
- [ ] Database operations work
- [ ] Data collection runs automatically
- [ ] Users can authenticate and access features
- [ ] Pro users can access advanced analytics, export, and custom alerts
- [ ] No critical errors in logs

## 🔄 Updates and Maintenance

### **Deploying Updates**
```bash
# After making changes
git add .
git commit -m "Update description"
railway up
```

### **Monitoring**
- Check logs regularly: `railway logs`
- Monitor Railway dashboard metrics
- Set up alerts for critical issues

Your crypto market watch app is now ready for Railway deployment! 🚀
