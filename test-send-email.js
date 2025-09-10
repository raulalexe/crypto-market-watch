#!/usr/bin/env node

/**
 * Email Sending Test Script
 * 
 * This script tests actual email sending functionality.
 */

require('dotenv').config({ path: '.env.local' });
const BrevoEmailService = require('./server/services/brevoEmailService');

async function testEmailSending() {
  console.log('📧 Testing Email Sending...\n');

  const brevoEmailService = new BrevoEmailService();
  
  if (!brevoEmailService.isConfigured) {
    console.log('❌ Brevo email service is not configured');
    return;
  }

  // Get test email from command line argument or use default
  const testEmail = process.argv[2] || 'test@example.com';
  
  console.log(`📬 Testing email sending to: ${testEmail}`);
  console.log(`📤 Sender email: ${process.env.BREVO_SENDER_EMAIL}`);

  try {
    // Test 1: Send a simple test email
    console.log('\n🧪 Test 1: Sending test email...');
    const testResult = await brevoEmailService.testConnection();
    
    if (testResult.success) {
      console.log('✅ Test email sent successfully!');
    } else {
      console.log('❌ Test email failed:', testResult.error);
    }

    // Test 2: Send a welcome email
    console.log('\n🧪 Test 2: Sending welcome email...');
    const welcomeResult = await brevoEmailService.sendWelcomeEmail(testEmail, 'Test User');
    
    if (welcomeResult) {
      console.log('✅ Welcome email sent successfully!');
    } else {
      console.log('❌ Welcome email failed');
    }

    // Test 3: Send an alert email
    console.log('\n🧪 Test 3: Sending alert email...');
    const testAlert = {
      type: 'price_alert',
      severity: 'medium',
      message: 'This is a test alert',
      data: {
        symbol: 'BTC',
        price: 50000,
        change: 5.2
      }
    };
    
    const alertResult = await brevoEmailService.sendAlertEmail(testEmail, testAlert);
    
    if (alertResult) {
      console.log('✅ Alert email sent successfully!');
    } else {
      console.log('❌ Alert email failed');
    }

    console.log('\n🎉 Email sending tests completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Check your email inbox (and spam folder)');
    console.log('2. If no emails received, check Brevo dashboard for delivery status');
    console.log('3. Verify sender email is verified in Brevo dashboard');
    console.log('4. Check server logs for any errors');

  } catch (error) {
    console.error('❌ Error during email testing:', error);
    console.log('\n💡 Common issues:');
    console.log('1. Sender email not verified in Brevo dashboard');
    console.log('2. Invalid API key');
    console.log('3. Rate limiting');
    console.log('4. Network connectivity issues');
  }
}

// Run the test
if (require.main === module) {
  testEmailSending().catch(console.error);
}

module.exports = { testEmailSending };
