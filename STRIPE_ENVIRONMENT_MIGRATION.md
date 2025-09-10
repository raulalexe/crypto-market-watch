# Stripe Environment Variable Configuration Guide

## Overview

This document explains the simplified Stripe environment variable configuration that automatically switches between test and live keys based on `NODE_ENV`.

## Configuration

The system uses a **simple naming convention**:

### **Live/Production Keys** (no prefix)
```bash
# Used when NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
```

### **Test/Development Keys** (TEST prefix)
```bash
# Used when NODE_ENV=development (or any value other than 'production')
STRIPE_TEST_SECRET_KEY=sk_test_your_test_secret_key_here
STRIPE_TEST_WEBHOOK_SECRET=whsec_your_test_webhook_secret_here
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here
```

## How It Works

### Simple Logic
The system automatically selects the appropriate Stripe keys based on `NODE_ENV`:

```javascript
// Stripe Secret Key Selection
const stripeKey = process.env.NODE_ENV === 'production' 
  ? process.env.STRIPE_SECRET_KEY 
  : process.env.STRIPE_TEST_SECRET_KEY;

// Webhook Secret Selection
const webhookSecret = process.env.NODE_ENV === 'production' 
  ? process.env.STRIPE_WEBHOOK_SECRET 
  : process.env.STRIPE_TEST_WEBHOOK_SECRET;

// Publishable Key Selection
const publishableKey = process.env.NODE_ENV === 'production' 
  ? process.env.STRIPE_PUBLISHABLE_KEY 
  : process.env.STRIPE_TEST_PUBLISHABLE_KEY;
```

## Environment Setup

### For Development
```bash
NODE_ENV=development

# Test keys (used in development)
STRIPE_TEST_SECRET_KEY=sk_test_your_test_secret_key
STRIPE_TEST_WEBHOOK_SECRET=whsec_your_test_webhook_secret
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_your_test_publishable_key

# Live keys (not used in development, but define for completeness)
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
```

### For Production
```bash
NODE_ENV=production

# Live keys (used in production)
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key

# Test keys (not used in production, but define for completeness)
STRIPE_TEST_SECRET_KEY=sk_test_your_test_secret_key
STRIPE_TEST_WEBHOOK_SECRET=whsec_your_test_webhook_secret
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_your_test_publishable_key
```

## Benefits

- **Simple and Clean** - Only two sets of variables: `STRIPE_*` for live, `STRIPE_TEST_*` for test
- **Automatic Switching** - No manual key changes needed, just set `NODE_ENV`
- **Environment Safety** - Impossible to accidentally use live keys in development
- **CI/CD Friendly** - Easy to set different keys per environment
- **Consistent Naming** - Clear convention that's easy to understand and maintain

## Usage Examples

### Development
```bash
# Set environment to development
export NODE_ENV=development

# Start your application - it will automatically use STRIPE_TEST_* keys
npm start
```

### Production
```bash
# Set environment to production
export NODE_ENV=production

# Start your application - it will automatically use STRIPE_* keys
npm start
```

### CI/CD Pipeline
```bash
# Development/Staging Pipeline
NODE_ENV=development

# Production Pipeline
NODE_ENV=production
```

## API Endpoint

The system provides an API endpoint to get the current Stripe configuration:

```bash
GET /api/stripe/config
```

Response:
```json
{
  "publishableKey": "pk_test_...",
  "environment": "development"
}
```

This endpoint automatically returns the correct publishable key based on the current `NODE_ENV`.

## Testing

The system includes comprehensive tests covering:
- Development environment key selection
- Production environment key selection
- Missing variable handling
- Integration with PaymentService
- Webhook secret selection
- Publishable key selection

Run tests with:
```bash
npm test -- tests/unit/stripe-env-switching.test.js
```

## Support

If you have questions about this configuration:
1. Check the test file for examples
2. Review the `env.example` file for configuration options
3. Open an issue if you need help with your specific setup

## Summary

This configuration provides a **clean and simple** way to manage Stripe keys across different environments. Just set your `NODE_ENV` and the system automatically uses the correct keys:

- **Development**: Uses `STRIPE_TEST_*` keys
- **Production**: Uses `STRIPE_*` keys

No complex fallback logic, no legacy support complexity - just a straightforward naming convention that works reliably across all environments.
