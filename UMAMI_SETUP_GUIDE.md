# Umami Analytics Setup Guide

## 🚀 Quick Setup Steps

### 1. Deploy Umami on Railway
1. Go to: https://railway.com/template/umami-analytics
2. Click **"Deploy on Railway"**
3. Name your project: `crypto-market-analytics`
4. Wait for deployment (2-3 minutes)

### 2. Initial Configuration
1. Access your Umami URL (e.g., `https://crypto-market-analytics-production.up.railway.app`)
2. Create admin account:
   - Username: `admin`
   - Password: [create strong password]
   - Email: [your email]
3. Add your website:
   - Name: `Crypto Market Watch`
   - Domain: `your-app.railway.app` (replace with your actual domain)

### 3. Get Tracking Code
1. In Umami dashboard, go to your website settings
2. Copy the Website ID (looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
3. Note your Umami URL (e.g., `https://crypto-market-analytics-production.up.railway.app`)

### 4. Configure Environment Variables
Add these to your main app's Railway environment variables:

```bash
REACT_APP_UMAMI_URL=https://crypto-market-analytics-production.up.railway.app
REACT_APP_UMAMI_WEBSITE_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### 5. Deploy Your App
1. Commit and push your changes
2. Railway will automatically rebuild your app
3. Analytics will start tracking once deployed

## 📊 What You'll Get

- **Real-time visitor tracking**
- **Page view analytics**
- **Referrer information**
- **Device/browser stats**
- **Privacy-compliant data**
- **No cookie banners needed**

## 🔧 Manual Setup (Alternative)

If you prefer to add the script manually, uncomment and replace this line in `client/public/index.html`:

```html
<script async src="https://your-umami-url.railway.app/script.js" data-website-id="your-website-id"></script>
```

## ✅ Verification

1. Deploy your app with the environment variables
2. Visit your app in production
3. Check your Umami dashboard - you should see real-time visitors
4. Analytics only work in production (not localhost)

## 🎯 Benefits for Your Crypto App

- **Privacy-first**: No GDPR compliance issues
- **Lightweight**: Only ~2KB script
- **Self-hosted**: Complete data control
- **Real-time**: See visitors as they arrive
- **Free**: No usage limits or costs
