#!/usr/bin/env node

/**
 * Upgrade Email Test Script
 * 
 * This script tests the upgrade email functionality.
 */

require('dotenv').config({ path: '.env.local' });
const BrevoEmailService = require('./server/services/brevoEmailService');

async function testUpgradeEmail() {
  console.log('📧 Testing Upgrade Email...\n');

  const brevoEmailService = new BrevoEmailService();
  
  if (!brevoEmailService.isConfigured) {
    console.log('❌ Brevo email service is not configured');
    return;
  }

  // Get test email from command line argument or use default
  const testEmail = process.argv[2] || 'test@example.com';
  
  console.log(`📬 Testing upgrade email to: ${testEmail}`);
  console.log(`📤 Sender email: ${process.env.BREVO_SENDER_EMAIL}`);

  try {
    // Test Pro upgrade email
    console.log('\n🧪 Test 1: Sending Pro upgrade email...');
    const proSubscriptionDetails = {
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      payment_method: 'stripe',
      payment_id: 'sub_test_123'
    };
    
    const proResult = await brevoEmailService.sendUpgradeEmail(
      testEmail, 
      'Test User', 
      'Pro', 
      proSubscriptionDetails
    );
    
    if (proResult) {
      console.log('✅ Pro upgrade email sent successfully!');
    } else {
      console.log('❌ Pro upgrade email failed');
    }

    // Test Premium upgrade email
    console.log('\n🧪 Test 2: Sending Premium upgrade email...');
    const premiumSubscriptionDetails = {
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      payment_method: 'stripe',
      payment_id: 'sub_test_456'
    };
    
    const premiumResult = await brevoEmailService.sendUpgradeEmail(
      testEmail, 
      'Test User', 
      'Premium', 
      premiumSubscriptionDetails
    );
    
    if (premiumResult) {
      console.log('✅ Premium upgrade email sent successfully!');
    } else {
      console.log('❌ Premium upgrade email failed');
    }

    console.log('\n🎉 Upgrade email tests completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Check your email inbox (and spam folder)');
    console.log('2. Verify the email content and formatting');
    console.log('3. Test with a real upgrade flow in your application');

  } catch (error) {
    console.error('❌ Error during upgrade email testing:', error);
    console.log('\n💡 Common issues:');
    console.log('1. Sender email not verified in Brevo dashboard');
    console.log('2. Invalid API key');
    console.log('3. Rate limiting');
    console.log('4. Network connectivity issues');
  }
}

// Run the test
if (require.main === module) {
  testUpgradeEmail().catch(console.error);
}

module.exports = { testUpgradeEmail };
