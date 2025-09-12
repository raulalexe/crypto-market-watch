const crypto = require('crypto');

// Test webhook secret validation
function testWebhookSecret() {
  const testSecret = process.env.STRIPE_TEST_WEBHOOK_SECRET;
  
  console.log('🔍 Testing webhook secret configuration...');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('STRIPE_TEST_WEBHOOK_SECRET exists:', !!testSecret);
  
  if (testSecret) {
    console.log('Secret starts with:', testSecret.substring(0, 15) + '...');
    console.log('Secret length:', testSecret.length);
    
    // Test signature creation
    const testPayload = '{"test": "payload"}';
    const signature = crypto
      .createHmac('sha256', testSecret)
      .update(testPayload)
      .digest('hex');
    
    console.log('✅ Secret is valid and can create signatures');
    console.log('Test signature:', signature.substring(0, 20) + '...');
  } else {
    console.log('❌ STRIPE_TEST_WEBHOOK_SECRET is not set');
  }
}

testWebhookSecret();
