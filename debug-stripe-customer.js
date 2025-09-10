#!/usr/bin/env node

/**
 * Debug Stripe Customer Issue
 * 
 * This script helps debug the "No such customer" error by testing
 * customer retrieval and creation.
 */

require('dotenv').config({ path: '.env.local' });

// Stripe key selection based on NODE_ENV
const stripeKey = process.env.NODE_ENV === 'production' 
  ? process.env.STRIPE_SECRET_KEY 
  : process.env.STRIPE_TEST_SECRET_KEY;

const stripe = require('stripe')(stripeKey);

async function debugStripeCustomer() {
  console.log('🔍 Debugging Stripe Customer Issue...\n');

  console.log('📋 Configuration:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- Using Stripe Key:', stripeKey ? `${stripeKey.substring(0, 20)}...` : 'None');
  console.log('- Key Type:', stripeKey?.startsWith('sk_test_') ? 'Test' : stripeKey?.startsWith('sk_live_') ? 'Live' : 'Unknown');

  // Test the problematic customer ID
  const testCustomerId = 'cus_T1iopYOmASO2DD';
  
  console.log(`\n🧪 Testing customer retrieval for: ${testCustomerId}`);
  
  try {
    const customer = await stripe.customers.retrieve(testCustomerId);
    console.log('✅ Customer found successfully!');
    console.log('- Customer ID:', customer.id);
    console.log('- Email:', customer.email);
    console.log('- Created:', new Date(customer.created * 1000).toISOString());
    console.log('- Deleted:', customer.deleted || false);
  } catch (error) {
    console.log('❌ Customer retrieval failed:');
    console.log('- Error Code:', error.code);
    console.log('- Error Message:', error.message);
    console.log('- Error Type:', error.type);
    
    if (error.code === 'resource_missing') {
      console.log('\n💡 This customer ID does not exist in Stripe');
      console.log('This could happen if:');
      console.log('1. Customer was deleted from Stripe');
      console.log('2. Customer was created with different Stripe keys');
      console.log('3. Customer ID is corrupted in database');
    }
  }

  // Test creating a new customer
  console.log('\n🧪 Testing customer creation...');
  try {
    const newCustomer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test Customer'
    });
    console.log('✅ New customer created successfully!');
    console.log('- Customer ID:', newCustomer.id);
    console.log('- Email:', newCustomer.email);
    
    // Clean up - delete the test customer
    await stripe.customers.del(newCustomer.id);
    console.log('✅ Test customer deleted');
  } catch (error) {
    console.log('❌ Customer creation failed:');
    console.log('- Error Code:', error.code);
    console.log('- Error Message:', error.message);
  }

  // Test Stripe API connectivity
  console.log('\n🧪 Testing Stripe API connectivity...');
  try {
    const balance = await stripe.balance.retrieve();
    console.log('✅ Stripe API connection successful!');
    console.log('- Available Balance:', balance.available[0]?.amount || 0, balance.available[0]?.currency || 'usd');
  } catch (error) {
    console.log('❌ Stripe API connection failed:');
    console.log('- Error Code:', error.code);
    console.log('- Error Message:', error.message);
  }

  console.log('\n📋 Recommendations:');
  console.log('1. If customer retrieval failed, the customer ID in your database is invalid');
  console.log('2. The fix I implemented should create a new customer when this happens');
  console.log('3. Check your server logs for the "Customer not found, creating new customer" message');
  console.log('4. Make sure you\'re using the correct Stripe keys for your environment');
}

// Run the debug
if (require.main === module) {
  debugStripeCustomer().catch(console.error);
}

module.exports = { debugStripeCustomer };
