# NOWPayments Testing Guide

This guide will help you test the NOWPayments integration for crypto payments and subscriptions in your crypto market watch application.

## 🚀 Quick Start

### 1. Prerequisites

- NOWPayments account (sign up at https://nowpayments.io/)
- API key from NOWPayments dashboard
- Your application server running

### 2. Environment Setup

Add your NOWPayments API key to your `.env.local` file:

```bash
# NOWPayments Configuration
NOWPAYMENTS_API_KEY=your_nowpayments_api_key_here
BASE_URL=http://localhost:3001  # or your production URL
```

### 3. Run the Test Script

```bash
# Make the script executable
chmod +x test-nowpayments.js

# Run the comprehensive test
node test-nowpayments.js
```

## 🧪 Test Scenarios

### Test 1: API Connectivity
- ✅ Verifies your API key is valid
- ✅ Tests connection to NOWPayments API
- ✅ Checks account status

### Test 2: Currency Support
- ✅ Lists all supported cryptocurrencies
- ✅ Verifies BTC, ETH, and other major coins are available

### Test 3: Price Estimation
- ✅ Tests price conversion from USD to BTC
- ✅ Verifies the estimation API is working

### Test 4: Payment Creation
- ✅ Creates a test payment request
- ✅ Generates payment address and amount
- ✅ Returns invoice URL for payment

### Test 5: Subscription Creation
- ✅ Creates a test subscription request
- ✅ Sets up recurring payment structure
- ✅ Configures webhook callbacks

## 🔧 Manual Testing

### Frontend Testing

1. **Start your application:**
   ```bash
   npm start
   cd client && npm start
   ```

2. **Navigate to subscription page:**
   - Go to `/app/subscription` or pricing section
   - Select a plan (Pro or Premium)
   - Choose "Crypto Payment" option

3. **Test payment flow:**
   - Click "Subscribe with Crypto"
   - You should be redirected to NOWPayments hosted page
   - Verify payment details are correct

### Backend Testing

1. **Test API endpoints directly:**
   ```bash
   # Test crypto payment endpoint
   curl -X POST http://localhost:3001/api/subscribe/crypto \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"planId": "pro"}'

   # Test crypto subscription endpoint
   curl -X POST http://localhost:3001/api/subscribe/crypto-subscription \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"planId": "pro"}'
   ```

2. **Check server logs:**
   - Monitor console output for NOWPayments API calls
   - Verify webhook handling when payments are made

## 🔗 Webhook Testing

### 1. Set up Webhook Endpoint

In your NOWPayments dashboard:
- Go to Settings → Webhooks
- Add webhook URL: `https://yourdomain.com/api/webhooks/nowpayments`
- Select events: `payment_finished`, `payment_failed`

### 2. Test Webhook Delivery

```bash
# Use ngrok for local testing
ngrok http 3001

# Update webhook URL in NOWPayments dashboard to:
# https://your-ngrok-url.ngrok.io/api/webhooks/nowpayments
```

### 3. Monitor Webhook Calls

Check your server logs for webhook events:
```bash
# In your server console, you should see:
# NOWPayments webhook received: { payment_id: '...', status: 'finished' }
```

## 💰 Supported Cryptocurrencies

NOWPayments supports 200+ cryptocurrencies. Popular options include:

- **Bitcoin (BTC)** - Most widely accepted
- **Ethereum (ETH)** - Fast transactions
- **Litecoin (LTC)** - Low fees
- **Bitcoin Cash (BCH)** - Fast Bitcoin alternative
- **Dogecoin (DOGE)** - Popular meme coin
- **USDT (Tether)** - Stablecoin
- **USDC (USD Coin)** - Stablecoin

## 🐛 Troubleshooting

### Common Issues

#### 1. "Invalid API Key" Error
```bash
❌ NOWPayments test failed: Status: 401
```
**Solution:**
- Verify your API key in NOWPayments dashboard
- Ensure the key is activated and not expired
- Check for typos in your `.env.local` file

#### 2. "Account Not Verified" Error
```bash
❌ NOWPayments test failed: Status: 403
```
**Solution:**
- Complete account verification in NOWPayments dashboard
- Upload required documents (ID, proof of address)
- Wait for manual review (usually 24-48 hours)

#### 3. "Webhook Not Working"
**Solution:**
- Verify webhook URL is accessible from internet
- Check that your server is running and accessible
- Ensure webhook endpoint returns 200 status
- Use ngrok for local testing

#### 4. "Payment Not Processing"
**Solution:**
- Check if the cryptocurrency is supported
- Verify minimum payment amounts
- Ensure payment address is correct
- Check blockchain network status

### Debug Mode

Enable detailed logging by setting:
```bash
DEBUG=nowpayments:*
```

## 📊 Production Checklist

Before going live:

- [ ] API key is production key (not sandbox)
- [ ] Webhook URL is HTTPS and accessible
- [ ] Account is fully verified
- [ ] Test with small amounts first
- [ ] Monitor webhook delivery
- [ ] Set up error alerting
- [ ] Document support procedures

## 🔒 Security Considerations

1. **API Key Security:**
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly

2. **Webhook Security:**
   - Verify webhook signatures (if implemented)
   - Use HTTPS for webhook URLs
   - Implement rate limiting

3. **Payment Security:**
   - Validate all payment data
   - Use idempotency keys
   - Implement proper error handling

## 📞 Support

- **NOWPayments Support:** https://nowpayments.io/contact
- **Documentation:** https://documenter.getpostman.com/view/7907941/S1a32n38
- **Status Page:** https://status.nowpayments.io/

## 🎯 Next Steps

After successful testing:

1. **Deploy to Production:**
   - Update environment variables
   - Configure production webhook URL
   - Test with small real payments

2. **Monitor Performance:**
   - Track payment success rates
   - Monitor webhook delivery
   - Set up alerts for failures

3. **User Experience:**
   - Add payment status indicators
   - Implement payment history
   - Add support for multiple cryptocurrencies

---

**Happy Testing! 🚀**

For questions or issues, check the troubleshooting section above or contact support.
