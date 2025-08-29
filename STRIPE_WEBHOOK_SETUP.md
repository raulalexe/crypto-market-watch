# Stripe Webhook Setup Guide

## Overview
This guide will help you set up Stripe webhooks for your crypto market watch subscription system. The webhooks handle subscription lifecycle events like payments, cancellations, and updates.

## Prerequisites
- Stripe account with API access
- Your application deployed and accessible via HTTPS
- Environment variables configured

## Step 1: Environment Variables

Add these to your `.env` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Your webhook endpoint secret (you'll get this in step 3)
```

## Step 2: Create Stripe Products and Prices

### 2.1 Create Products
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Products** → **Add Product**
3. Create these products:

#### Pro Plan Product
- **Name**: Pro Plan
- **Description**: Advanced features for serious traders
- **Price**: $29/month

#### Premium Plan Product
- **Name**: Premium+ Plan  
- **Description**: Professional tools for institutions
- **Price**: $99/month

### 2.2 Create Recurring Prices
For each product:
1. Click **Add price**
2. Set **Billing** to "Recurring"
3. Set **Billing period** to "Monthly"
4. Set **Price** to the appropriate amount
5. **Save** the price

**Note**: Copy the Price IDs (e.g., `price_1ABC123...`) - you'll need these for your subscription logic.

## Step 3: Set Up Webhook Endpoint

### 3.1 Create Webhook Endpoint
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set **Endpoint URL** to: `https://yourdomain.com/api/webhooks/stripe`
4. Select these events:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
   - `customer.subscription.created`
   - `invoice.payment_action_required`
5. Click **Add endpoint**

### 3.2 Get Webhook Secret
1. After creating the endpoint, click on it
2. In the **Signing secret** section, click **Reveal**
3. Copy the secret (starts with `whsec_`)
4. Add this to your `.env` file as `STRIPE_WEBHOOK_SECRET`

## Step 4: Test Your Webhook

### 4.1 Using Stripe CLI (Recommended)
1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3001/api/webhooks/stripe
   ```
4. This will give you a webhook signing secret for testing

### 4.2 Using Stripe Dashboard
1. Go to your webhook endpoint in the dashboard
2. Click **Send test webhook**
3. Select an event type (e.g., `invoice.payment_succeeded`)
4. Click **Send test webhook**
5. Check your server logs for the webhook processing

## Step 5: Update Your Code

### 5.1 Update Price IDs
In `server/services/paymentService.js`, update the price IDs:

```javascript
const subscriptionPlans = {
  pro: {
    name: 'Pro',
    price: 29,
    duration: 30,
    priceId: 'price_1ABC123...', // Your actual Pro plan price ID
    features: [...]
  },
  premium: {
    name: 'Premium+',
    price: 99,
    duration: 30,
    priceId: 'price_1DEF456...', // Your actual Premium plan price ID
    features: [...]
  }
};
```

### 5.2 Verify Webhook Endpoint
Your webhook endpoint is already set up at `/api/webhooks/stripe` in `server/index.js`.

## Step 6: Webhook Event Handling

Your system now handles these webhook events:

### Payment Events
- **`invoice.payment_succeeded`**: Payment successful, update subscription status
- **`invoice.payment_failed`**: Payment failed, mark subscription as past due
- **`invoice.payment_action_required`**: Payment requires action (3D Secure, etc.)

### Subscription Events  
- **`customer.subscription.created`**: New subscription created
- **`customer.subscription.updated`**: Subscription updated (plan change, etc.)
- **`customer.subscription.deleted`**: Subscription cancelled

## Step 7: Production Deployment

### 7.1 Update Webhook URL
When deploying to production:
1. Update the webhook endpoint URL in Stripe Dashboard
2. Use your production domain: `https://yourdomain.com/api/webhooks/stripe`

### 7.2 Environment Variables
Make sure these are set in your production environment:
```bash
STRIPE_SECRET_KEY=sk_live_... # Production secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Production webhook secret
```

### 7.3 SSL Certificate
Ensure your production server has a valid SSL certificate (required for webhooks).

## Step 8: Monitoring and Debugging

### 8.1 Webhook Logs
Check your server logs for webhook processing:
```bash
# Look for these log messages:
Processing Stripe webhook: invoice.payment_succeeded
Successfully processed Stripe webhook: invoice.payment_succeeded
```

### 8.2 Stripe Dashboard
Monitor webhook delivery in Stripe Dashboard:
1. Go to **Developers** → **Webhooks**
2. Click on your endpoint
3. View **Recent deliveries** for success/failure status

### 8.3 Common Issues
- **404 errors**: Check webhook URL is correct
- **Signature verification errors**: Verify `STRIPE_WEBHOOK_SECRET` is correct
- **Timeout errors**: Ensure webhook processing completes within 10 seconds

## Step 9: Security Best Practices

### 9.1 Webhook Security
- Always verify webhook signatures
- Use HTTPS in production
- Keep webhook secrets secure
- Don't log sensitive payment data

### 9.2 Rate Limiting
Your webhook endpoint should handle multiple events efficiently:
- Process webhooks asynchronously if needed
- Implement idempotency to handle duplicate events
- Add retry logic for failed webhook processing

## Testing Checklist

- [ ] Webhook endpoint responds to test events
- [ ] Payment succeeded events update subscription status
- [ ] Payment failed events mark subscription as past due
- [ ] Subscription cancellation events work correctly
- [ ] Webhook signature verification works
- [ ] Error handling works for invalid events
- [ ] Logging provides useful debugging information

## Support

If you encounter issues:
1. Check Stripe Dashboard webhook delivery logs
2. Review your server logs for error messages
3. Verify environment variables are set correctly
4. Test with Stripe CLI for local development
5. Contact Stripe support for webhook-specific issues
