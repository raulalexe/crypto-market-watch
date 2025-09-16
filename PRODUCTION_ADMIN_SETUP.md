# Production Admin User Setup Guide

## 🚀 How to Create an Admin User for Your Railway App

### **Prerequisites**
- Your app is deployed to Railway
- You have access to the Railway dashboard
- You have the Railway CLI installed locally

### **Step 1: Access Your Railway App**

#### **Option A: Via Railway CLI**
```bash
# Navigate to your project directory
cd crypto-market-watch

# Open Railway dashboard
railway open

# Or check status
railway status
```

#### **Option B: Via Web Dashboard**
- Go to [railway.app](https://railway.app)
- Sign in and navigate to your project

### **Step 2: Create Admin User via Railway Terminal**

1. **Open Railway Terminal:**
   - In Railway dashboard, go to your service
   - Click on the "Terminal" tab
   - Wait for the terminal to connect

2. **Run the Admin Creation Script:**
   ```bash
   # Create an admin user (replace with your desired credentials)
   node scripts/createProductionAdmin.js admin@crypto-market-watch.xyz YourSecurePassword123
   ```

3. **Example:**
   ```bash
   node scripts/createProductionAdmin.js admin@crypto-market-watch.xyz MySecurePassword2024!
   ```

4. **Using Environment Variables (Recommended):**
   ```bash
   # Set environment variables first
   export ADMIN_EMAIL=admin@yourdomain.com
   export ADMIN_PASSWORD=YourSecurePassword123
   
   # Then run the script (it will use the env vars)
   node scripts/createProductionAdmin.js
   ```

### **Step 3: Verify Admin User Creation**

The script will show:
```
🎉 Production admin user created successfully!

📋 User Details:
   User ID: 1
   Email: admin@yourdomain.com (or your configured ADMIN_EMAIL)
   Admin privileges: ✅ Enabled
   Created: 2024-09-01T...
```

### **Step 4: Test Admin Access**

1. **Visit your app:** `https://your-app-name.railway.app`
2. **Sign in** with your admin credentials
3. **Access admin dashboard** - you should see admin features

### **Step 5: Set Up Environment Variables (If Not Done)**

In Railway dashboard, add these variables:
```env
JWT_SECRET=your_jwt_secret_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
BASE_URL=https://your-app-name.railway.app
TELEGRAM_WEBHOOK_URL=https://your-app-name.railway.app
```

## 🔐 Security Best Practices

### **Password Requirements**
- ✅ **Minimum 8 characters**
- ✅ **Mix of uppercase, lowercase, numbers, symbols**
- ✅ **Avoid common words or patterns**
- ✅ **Use a password manager**

### **Admin Account Security**
- 🔒 **Never share admin credentials**
- 🔒 **Use unique passwords for each service**
- 🔒 **Enable 2FA if available**
- 🔒 **Regular password rotation**

## 🚨 Important Notes

### **What NOT to Do**
- ❌ **Don't use test passwords** like "admin123" or "password"
- ❌ **Don't commit credentials** to Git
- ❌ **Don't share admin access** with unauthorized users
- ❌ **Don't use the same password** for multiple services

### **What TO Do**
- ✅ **Use strong, unique passwords**
- ✅ **Store credentials securely** (password manager)
- ✅ **Limit admin access** to necessary personnel only
- ✅ **Monitor admin account activity**

## 🆘 Troubleshooting

### **Common Issues**

#### **"User already exists" Error**
- The email is already registered
- Use a different email or reset the existing user

#### **"Database not accessible" Error**
- Check if your Railway service is running
- Verify database connection in Railway dashboard

#### **"Invalid email format" Error**
- Ensure email follows standard format: `user@domain.com`
- Check for typos or extra spaces

#### **"Password too short" Error**
- Password must be at least 8 characters
- Use a longer, more secure password

### **Getting Help**
- Check Railway logs: `railway logs`
- Verify environment variables are set
- Ensure your app is running: `railway status`

## 📋 Quick Reference

```bash
# Create admin user (or use environment variables)
node scripts/createProductionAdmin.js admin@yourdomain.com YourPassword123

# Check Railway status
railway status

# View logs
railway logs

# Open dashboard
railway open
```

## 🎯 Next Steps After Admin Setup

1. **Configure Telegram webhook** via admin dashboard
2. **Set up email notifications** (Brevo/Stripe)
3. **Configure payment processing** (Stripe)
4. **Test all admin features**
5. **Set up monitoring and alerts**

---

**Remember:** Keep your admin credentials secure and never share them publicly! 🔒
