#!/usr/bin/env node

/**
 * Test script for actual email sending via Brevo
 * WARNING: This will send a real email!
 */

require('dotenv').config({ path: '.env.local' });

async function testEmailSending() {
  console.log('🧪 Testing Actual Email Sending via Brevo...\n');
  console.log('⚠️  WARNING: This will send a real email!\n');
  
  // Get test email from command line or use default
  const testEmail = process.argv[2] || process.env.TEST_EMAIL;
  
  if (!testEmail) {
    console.log('❌ No test email provided');
    console.log('Usage: node scripts/test-email-sending.js <email@example.com>');
    console.log('Or set TEST_EMAIL in your environment');
    process.exit(1);
  }
  
  console.log(`📧 Test email will be sent to: ${testEmail}`);
  console.log('Press Ctrl+C to cancel, or any key to continue...');
  
  // Wait for user input
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', async (data) => {
    if (data[0] === 3) { // Ctrl+C
      console.log('\n❌ Cancelled');
      process.exit(0);
    }
    
    process.stdin.setRawMode(false);
    process.stdin.pause();
    
    try {
      const EmailService = require('../server/services/emailService');
      const emailService = new EmailService();
      
      if (!emailService.isConfigured) {
        console.log('❌ Email service not configured');
        process.exit(1);
      }
      
      console.log(`\n🔍 Sending test email via ${emailService.emailProvider}...`);
      
      const testAlert = {
        type: 'test_alert',
        severity: 'medium',
        message: 'This is a test alert to verify the email service is working correctly. If you receive this, the Brevo integration is successful!',
        metric: 'email_service_test',
        value: 'success',
        timestamp: new Date().toISOString()
      };
      
      const result = await emailService.sendAlertEmail(testEmail, testAlert);
      
      if (result) {
        console.log('✅ Test email sent successfully!');
        console.log('📧 Check your inbox (and spam folder)');
      } else {
        console.log('❌ Test email failed to send');
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
    
    process.exit(0);
  });
}

// Run the test
if (require.main === module) {
  testEmailSending().catch(console.error);
}

module.exports = testEmailSending;
