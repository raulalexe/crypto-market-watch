#!/usr/bin/env node

/**
 * Stripe Webhook Test Script
 * 
 * This script helps debug Stripe webhook issues by testing the webhook endpoint
 * and checking environment configuration.
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Stripe Webhook Debug Information\n');

// Check environment variables
console.log('📋 Environment Configuration:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '✅ Set' : '❌ Missing');
console.log('- STRIPE_TEST_WEBHOOK_SECRET:', process.env.STRIPE_TEST_WEBHOOK_SECRET ? '✅ Set' : '❌ Missing');

// Determine which webhook secret should be used
const webhookSecret = process.env.NODE_ENV === 'production' 
  ? process.env.STRIPE_WEBHOOK_SECRET 
  : process.env.STRIPE_TEST_WEBHOOK_SECRET;

console.log('\n🎯 Webhook Secret Selection:');
console.log('- Environment:', process.env.NODE_ENV);
console.log('- Selected Secret:', webhookSecret ? '✅ Available' : '❌ Missing');
console.log('- Secret Value:', webhookSecret ? `${webhookSecret.substring(0, 20)}...` : 'None');

if (!webhookSecret) {
  console.log('\n❌ ISSUE FOUND:');
  if (process.env.NODE_ENV === 'development') {
    console.log('You are running in development mode but STRIPE_TEST_WEBHOOK_SECRET is not set.');
    console.log('This means Stripe webhooks will fail with "Webhook secret not configured" error.');
  } else {
    console.log('You are running in production mode but STRIPE_WEBHOOK_SECRET is not set.');
  }
  
  console.log('\n💡 SOLUTION:');
  console.log('1. Go to your Stripe Dashboard → Developers → Webhooks');
  console.log('2. Find your webhook endpoint');
  console.log('3. Copy the signing secret (starts with whsec_)');
  console.log('4. Add it to your .env.local file:');
  
  if (process.env.NODE_ENV === 'development') {
    console.log('   STRIPE_TEST_WEBHOOK_SECRET=whsec_your_test_webhook_secret_here');
  } else {
    console.log('   STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret_here');
  }
  
  console.log('\n5. Restart your server');
} else {
  console.log('\n✅ Webhook configuration looks correct!');
  console.log('If webhooks are still not working, check:');
  console.log('1. Webhook endpoint URL in Stripe Dashboard');
  console.log('2. Server logs for webhook processing');
  console.log('3. Webhook event types are enabled');
}

console.log('\n📖 For more information, see:');
console.log('- STRIPE_WEBHOOK_SETUP.md');
console.log('- Your server logs when processing payments');
