require('dotenv').config({ path: '.env.local' });
const BrevoEmailService = require('./server/services/brevoEmailService');

async function testBrevoEmail() {
  console.log('🧪 Testing Brevo Email Service...\n');
  
  const emailService = new BrevoEmailService();
  
  // Test 1: Check configuration
  console.log('1. Checking configuration...');
  if (emailService.isConfigured) {
    console.log('✅ Brevo email service is configured');
  } else {
    console.log('❌ Brevo email service is not configured');
    console.log('   Make sure BREVO_API_KEY is set in your .env file');
    return;
  }
  
  // Test 2: Test connection
  console.log('\n2. Testing connection...');
  const connectionTest = await emailService.testConnection();
  if (connectionTest.success) {
    console.log('✅ Connection test successful');
  } else {
    console.log('❌ Connection test failed:', connectionTest.error);
    return;
  }
  
  // Test 3: Test welcome email (only if email is provided)
  const testEmail = process.argv[2];
  if (testEmail) {
    console.log(`\n3. Testing welcome email to ${testEmail}...`);
    const welcomeEmailSent = await emailService.sendWelcomeEmail(testEmail);
    if (welcomeEmailSent) {
      console.log('✅ Welcome email sent successfully');
    } else {
      console.log('❌ Failed to send welcome email');
    }
    
    // Test 4: Test alert email
    console.log('\n4. Testing alert email...');
    const testAlert = {
      type: 'price_alert',
      severity: 'medium',
      message: 'Bitcoin price has moved significantly',
      metric: 'BTC Price',
      value: '$45,000',
      timestamp: new Date().toISOString()
    };
    
    const alertEmailSent = await emailService.sendAlertEmail(testEmail, testAlert);
    if (alertEmailSent) {
      console.log('✅ Alert email sent successfully');
    } else {
      console.log('❌ Failed to send alert email');
    }
  } else {
    console.log('\n3. Skipping email tests (no email provided)');
    console.log('   To test email sending, run: node test-brevo-email.js your@email.com');
  }
  
  console.log('\n🎉 Brevo email service test completed!');
}

// Run the test
testBrevoEmail().catch(console.error);
