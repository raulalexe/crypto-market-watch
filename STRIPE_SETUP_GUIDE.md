# Stripe Test vs Live Configuration Guide

This guide explains how to switch between Stripe test and live environments for your crypto market watch application.

## 🔑 Environment Variables

### Test Environment (Development)
```bash
# Stripe Test Keys
STRIPE_SECRET_KEY=sk_test_your_test_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret_here

# Environment
NODE_ENV=development
```

### Live Environment (Production)
```bash
# Stripe Live Keys
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret_here

# Environment
NODE_ENV=production
```

## 🚀 How to Switch Between Test and Live

### Method 1: Environment Variables (Recommended)

#### For Local Development:
```bash
# Test mode
export STRIPE_SECRET_KEY="sk_test_your_test_key"
export STRIPE_WEBHOOK_SECRET="whsec_your_test_webhook"
export NODE_ENV="development"

# Live mode (be careful!)
export STRIPE_SECRET_KEY="sk_live_your_live_key"
export STRIPE_WEBHOOK_SECRET="whsec_your_live_webhook"
export NODE_ENV="production"
```

#### For Railway Deployment:
```bash
# Set test keys
railway variables set STRIPE_SECRET_KEY=sk_test_your_test_key
railway variables set STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook

# Set live keys (for production)
railway variables set STRIPE_SECRET_KEY=sk_live_your_live_key
railway variables set STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook

# Note: NODE_ENV should be set manually in Railway dashboard
# Set NODE_ENV=development for test environment
# Set NODE_ENV=production for live environment
```

### Method 2: .env Files

#### Create separate environment files:

**`.env.test`** (for testing):
```bash
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook
NODE_ENV=development
```

**`.env.production`** (for live):
```bash
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook
NODE_ENV=production
```

#### Load the appropriate file:
```bash
# For testing
cp .env.test .env.local
npm start

# For production
cp .env.production .env.local
npm start
```

## 🔍 How to Identify Test vs Live Keys

### Stripe Secret Keys:
- **Test keys** start with `sk_test_`
- **Live keys** start with `sk_live_`

### Stripe Publishable Keys:
- **Test keys** start with `pk_test_`
- **Live keys** start with `pk_live_`

### Webhook Secrets:
- Both test and live webhook secrets start with `whsec_`
- You need to check in your Stripe dashboard which environment they belong to

## 🛠️ Stripe Dashboard Setup

### Test Environment:
1. Go to [Stripe Test Dashboard](https://dashboard.stripe.com/test)
2. Navigate to **Developers** → **Webhooks**
3. Create webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
4. Select events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
5. Copy the webhook secret

### Live Environment:
1. Go to [Stripe Live Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Create webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
4. Select the same events as test environment
5. Copy the webhook secret

## 📋 Subscription Plans Configuration

### Test Plans (Development):
```javascript
// In your subscription plans configuration
const testPlans = {
  basic: {
    name: 'Basic',
    price: 9.99,
    priceId: 'price_test_basic_plan_id'
  },
  pro: {
    name: 'Pro',
    price: 29.99,
    priceId: 'price_test_pro_plan_id'
  }
};
```

### Live Plans (Production):
```javascript
// In your subscription plans configuration
const livePlans = {
  basic: {
    name: 'Basic',
    price: 9.99,
    priceId: 'price_live_basic_plan_id'
  },
  pro: {
    name: 'Pro',
    price: 29.99,
    priceId: 'price_live_pro_plan_id'
  }
};
```

## 🔄 Manual Environment Switching

To switch between test and live Stripe environments, simply update the environment variables:

### Local Development:
```bash
# Switch to test environment
export STRIPE_SECRET_KEY="sk_test_your_test_key"
export STRIPE_WEBHOOK_SECRET="whsec_your_test_webhook"

# Switch to live environment
export STRIPE_SECRET_KEY="sk_live_your_live_key"
export STRIPE_WEBHOOK_SECRET="whsec_your_live_webhook"
```

### Railway Deployment:
```bash
# Switch to test environment
railway variables set STRIPE_SECRET_KEY=sk_test_your_test_key
railway variables set STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook

# Switch to live environment
railway variables set STRIPE_SECRET_KEY=sk_live_your_live_key
railway variables set STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook
```

## ⚠️ Important Notes

### Security:
- **Never commit live Stripe keys to git**
- Use environment variables for all sensitive data
- Test thoroughly in test mode before switching to live

### Testing:
- Always test payments in test mode first
- Use Stripe's test card numbers for testing
- Verify webhook endpoints work in both environments

### Production Checklist:
- [ ] Live Stripe keys are set
- [ ] Webhook endpoints are configured
- [ ] Subscription plans are created in live mode
- [ ] Test payments work correctly
- [ ] Webhook events are being received
- [ ] Database is properly configured

## 🧪 Test Card Numbers

Use these test card numbers in test mode:

- **Successful payment**: `4242 4242 4242 4242`
- **Declined payment**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`

## 📞 Support

If you encounter issues:
1. Check Stripe dashboard logs
2. Verify webhook endpoints are accessible
3. Ensure environment variables are set correctly
4. Check application logs for errors
