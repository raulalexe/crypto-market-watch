#!/usr/bin/env node

/**
 * Test script for email service
 * Tests both Brevo API and SMTP configurations
 */

require('dotenv').config({ path: '.env.local' });

async function testEmailService() {
  console.log('🧪 Testing Email Service Configuration...\n');
  
  try {
    const EmailService = require('../server/services/emailService');
    const emailService = new EmailService();
    
    console.log('📋 Environment Variables Check:');
    console.log(`  BREVO_API_KEY: ${process.env.BREVO_API_KEY ? '✅ Set' : '❌ Not set'}`);
    console.log(`  BREVO_SENDER_EMAIL: ${process.env.BREVO_SENDER_EMAIL ? '✅ Set' : '❌ Not set'}`);
    console.log(`  SMTP_HOST: ${process.env.SMTP_HOST ? '✅ Set' : '❌ Not set'}`);
    console.log(`  SMTP_USER: ${process.env.SMTP_USER ? '✅ Set' : '❌ Not set'}`);
    console.log(`  SMTP_PASS: ${process.env.SMTP_PASS ? '✅ Set' : '❌ Not set'}\n`);
    
    console.log('🔍 Service Configuration:');
    console.log(`  Is Configured: ${emailService.isConfigured ? '✅ Yes' : '❌ No'}`);
    console.log(`  Email Provider: ${emailService.emailProvider || 'None'}\n`);
    
    if (emailService.isConfigured) {
      console.log('🔍 Testing Connection:');
      try {
        const connectionTest = await emailService.testConnection();
        if (connectionTest.success) {
          console.log(`  ✅ Connection successful with ${connectionTest.provider}`);
        } else {
          console.log(`  ❌ Connection failed: ${connectionTest.error}`);
        }
      } catch (error) {
        console.log(`  ❌ Connection test error: ${error.message}`);
      }
      
      console.log('\n🔍 Testing Email Sending (Test Mode):');
      const testAlert = {
        type: 'test_alert',
        severity: 'medium',
        message: 'This is a test alert to verify email service configuration.',
        metric: 'test_metric',
        value: 'test_value',
        timestamp: new Date().toISOString()
      };
      
      // Test with a dummy email (won't actually send)
      const testEmail = 'test@example.com';
      console.log(`  📧 Would send to: ${testEmail}`);
      console.log(`  📝 Alert type: ${testAlert.type}`);
      console.log(`  🚨 Severity: ${testAlert.severity}`);
      
      console.log('\n📚 Configuration Summary:');
      if (emailService.emailProvider === 'brevo') {
        console.log('  ✅ Brevo API configured');
        console.log('  📤 Will use Brevo REST API for sending emails');
        console.log('  🔑 Uses BREVO_API_KEY for authentication');
        console.log('  📧 Sender email from BREVO_SENDER_EMAIL or default');
      } else if (emailService.emailProvider === 'smtp') {
        console.log('  ✅ SMTP configured');
        console.log('  📤 Will use SMTP server for sending emails');
        console.log('  🔑 Uses SMTP_HOST, SMTP_USER, SMTP_PASS');
      }
      
      console.log('\n💡 Next Steps:');
      console.log('  1. Set BREVO_SENDER_EMAIL if you want a custom sender email');
      console.log('  2. Test with a real email address in your application');
      console.log('  3. Monitor logs for email sending success/failure');
      
    } else {
      console.log('❌ Email service is not configured');
      console.log('\n💡 To configure Brevo:');
      console.log('  1. Set BREVO_API_KEY in your environment');
      console.log('  2. Optionally set BREVO_SENDER_EMAIL');
      console.log('  3. Restart the application');
      console.log('\n💡 To configure SMTP:');
      console.log('  1. Set SMTP_HOST, SMTP_USER, SMTP_PASS');
      console.log('  2. Optionally set SMTP_PORT and SMTP_SECURE');
      console.log('  3. Restart the application');
    }
    
    console.log('\n✅ Email service test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testEmailService().catch(console.error);
}

module.exports = testEmailService;
