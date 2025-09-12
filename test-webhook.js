const crypto = require('crypto');

// Test webhook payload (simulating checkout.session.completed)
const testPayload = {
  id: 'evt_test_webhook',
  object: 'event',
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_123',
      object: 'checkout.session',
      customer: 'cus_test_123',
      subscription: 'sub_test_123',
      metadata: {
        userId: '6', // Your test user ID
        planId: 'pro'
      },
      payment_status: 'paid',
      status: 'complete'
    }
  }
};

// Create a test signature
const webhookSecret = 'whsec_test_secret'; // Replace with your actual webhook secret
const payload = JSON.stringify(testPayload);
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(payload)
  .digest('hex');

const stripeSignature = `t=${Date.now()},v1=${signature}`;

console.log('🧪 Testing webhook endpoint...');
console.log('📝 Payload:', JSON.stringify(testPayload, null, 2));
console.log('🔐 Signature:', stripeSignature);

// Test the webhook
fetch('https://crypto-market-watch.xyz/api/webhooks/stripe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Stripe-Signature': stripeSignature
  },
  body: payload
})
.then(response => response.json())
.then(data => {
  console.log('✅ Webhook response:', data);
})
.catch(error => {
  console.error('❌ Webhook error:', error);
});
