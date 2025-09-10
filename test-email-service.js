#!/usr/bin/env node

/**
 * Email Service Test Script
 * 
 * This script helps debug email sending issues by testing the email service
 * configuration and connection.
 */

require('dotenv').config({ path: '.env.local' });
const EmailService = require('./server/services/emailService');
const BrevoEmailService = require('./server/services/brevoEmailService');

async function testEmailService() {
  console.log('📧 Email Service Debug Information\n');

  // Check environment variables
  console.log('📋 Environment Configuration:');
  console.log('- BREVO_API_KEY:', process.env.BREVO_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('- BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL || '❌ Missing');
  console.log('- SMTP_HOST:', process.env.SMTP_HOST || '❌ Missing');
  console.log('- SMTP_USER:', process.env.SMTP_USER || '❌ Missing');
  console.log('- SMTP_PASS:', process.env.SMTP_PASS ? '✅ Set' : '❌ Missing');

  // Test EmailService
  console.log('\n🔧 Testing EmailService...');
  const emailService = new EmailService();
  
  console.log('- EmailService configured:', emailService.isConfigured);
  console.log('- Email provider:', emailService.emailProvider || 'None');
  
  if (emailService.isConfigured) {
    console.log('\n🔗 Testing connection...');
    const connectionTest = await emailService.testConnection();
    console.log('- Connection test:', connectionTest.success ? '✅ Success' : '❌ Failed');
    if (!connectionTest.success) {
      console.log('- Error:', connectionTest.error);
    } else {
      console.log('- Provider:', connectionTest.provider);
    }
  } else {
    console.log('❌ EmailService is not configured');
  }

  // Test BrevoEmailService
  console.log('\n🔧 Testing BrevoEmailService...');
  const brevoEmailService = new BrevoEmailService();
  
  console.log('- BrevoEmailService configured:', brevoEmailService.isConfigured);
  
  if (brevoEmailService.isConfigured) {
    console.log('\n🔗 Testing Brevo connection...');
    try {
      const brevoTest = await brevoEmailService.testConnection();
      console.log('- Brevo connection test:', brevoTest.success ? '✅ Success' : '❌ Failed');
      if (!brevoTest.success) {
        console.log('- Error:', brevoTest.error);
      }
    } catch (error) {
      console.log('- Brevo connection test: ❌ Failed');
      console.log('- Error:', error.message);
    }
  } else {
    console.log('❌ BrevoEmailService is not configured');
  }

  // Summary and recommendations
  console.log('\n📊 Summary:');
  
  if (!process.env.BREVO_API_KEY && !process.env.SMTP_HOST) {
    console.log('❌ No email service configured');
    console.log('\n💡 SOLUTION:');
    console.log('1. Set up Brevo (recommended):');
    console.log('   - Get API key from https://www.brevo.com/');
    console.log('   - Add to .env.local: BREVO_API_KEY=your_api_key');
    console.log('   - Add to .env.local: BREVO_SENDER_EMAIL=your_verified_email');
    console.log('\n2. Or set up SMTP:');
    console.log('   - Add to .env.local: SMTP_HOST=your_smtp_host');
    console.log('   - Add to .env.local: SMTP_USER=your_smtp_user');
    console.log('   - Add to .env.local: SMTP_PASS=your_smtp_password');
  } else if (process.env.BREVO_API_KEY && !brevoEmailService.isConfigured) {
    console.log('❌ Brevo API key is set but service is not configured');
    console.log('\n💡 SOLUTION:');
    console.log('1. Check your Brevo API key is valid');
    console.log('2. Verify your sender email is verified in Brevo dashboard');
    console.log('3. Check server logs for Brevo initialization errors');
  } else if (emailService.isConfigured && !emailService.emailProvider) {
    console.log('❌ Email service is configured but no provider detected');
    console.log('\n💡 SOLUTION:');
    console.log('1. Check your environment variables');
    console.log('2. Restart your server');
    console.log('3. Check server logs for configuration errors');
  } else {
    console.log('✅ Email service appears to be configured correctly');
    console.log('\n💡 If emails are still not sending:');
    console.log('1. Check server logs for email sending errors');
    console.log('2. Verify sender email is verified in Brevo dashboard');
    console.log('3. Check spam/junk folders');
    console.log('4. Test with a simple email send');
  }

  console.log('\n📖 For more information, see:');
  console.log('- BREVO_EMAIL_SETUP.md');
  console.log('- Your server logs when sending emails');
}

// Run the test
if (require.main === module) {
  testEmailService().catch(console.error);
}

module.exports = { testEmailService };
