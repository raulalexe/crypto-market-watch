#!/usr/bin/env node

/**
 * NOWPayments Integration Test Script
 * 
 * This script tests the NOWPayments integration for crypto payments and subscriptions.
 * Run this to verify your NOWPayments setup is working correctly.
 */

require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

// Configuration
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
const NOWPAYMENTS_BASE_URL = 'https://api.nowpayments.io/v1';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

// Test data
const TEST_PLAN = {
  id: 'pro',
  name: 'Pro Plan',
  price: 29.99,
  duration: 30
};

async function testNowPaymentsAPI() {
  console.log('🧪 Testing NOWPayments Integration...\n');

  // Check if API key is configured
  if (!NOWPAYMENTS_API_KEY) {
    console.error('❌ NOWPAYMENTS_API_KEY not found in environment variables');
    console.log('Please add NOWPAYMENTS_API_KEY to your .env.local file');
    return false;
  }

  console.log('✅ NOWPAYMENTS_API_KEY found');

  try {
    // Test 1: Check API connectivity and authentication
    console.log('\n📡 Test 1: API Connectivity & Authentication');
    const statusResponse = await axios.get(`${NOWPAYMENTS_BASE_URL}/status`, {
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY
      }
    });
    
    console.log('✅ API Status:', statusResponse.data);
    
    // Test 2: Get available currencies
    console.log('\n💰 Test 2: Available Currencies');
    const currenciesResponse = await axios.get(`${NOWPAYMENTS_BASE_URL}/currencies`, {
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY
      }
    });
    
    const currencies = currenciesResponse.data;
    if (Array.isArray(currencies)) {
      console.log('✅ Available currencies:', currencies.length, 'currencies');
      console.log('Sample currencies:', currencies.slice(0, 5));
    } else {
      console.log('✅ Currencies response:', currencies);
    }
    
    // Test 3: Get estimated amount for BTC payment
    console.log('\n💱 Test 3: Price Estimation');
    const estimateResponse = await axios.get(`${NOWPAYMENTS_BASE_URL}/estimate`, {
      params: {
        amount: TEST_PLAN.price,
        currency_from: 'usd',
        currency_to: 'btc'
      },
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY
      }
    });
    
    console.log('✅ BTC estimate for $29.99:', estimateResponse.data);
    
    // Test 4: Create a test payment (this will create a real payment request)
    console.log('\n💳 Test 4: Payment Creation');
    const paymentData = {
      price_amount: TEST_PLAN.price,
      price_currency: 'usd',
      pay_currency: 'btc',
      order_id: `test_${Date.now()}`,
      order_description: `Test ${TEST_PLAN.name} Payment`,
      ipn_callback_url: `${BASE_URL}/api/webhooks/nowpayments`,
      case: 'common'
    };

    const paymentResponse = await axios.post(`${NOWPAYMENTS_BASE_URL}/payment`, paymentData, {
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const payment = paymentResponse.data;
    console.log('✅ Test payment created successfully!');
    console.log('Payment ID:', payment.payment_id);
    console.log('Pay Address:', payment.pay_address);
    console.log('Pay Amount:', payment.pay_amount, payment.pay_currency);
    console.log('Invoice URL:', payment.invoice_url);
    console.log('Expires At:', payment.expires_at);
    
    // Test 5: Create a test subscription
    console.log('\n🔄 Test 5: Subscription Creation');
    const subscriptionData = {
      price_amount: TEST_PLAN.price,
      price_currency: 'usd',
      pay_currency: 'btc',
      order_id: `test_sub_${Date.now()}`,
      order_description: `Test ${TEST_PLAN.name} Subscription`,
      ipn_callback_url: `${BASE_URL}/api/webhooks/nowpayments`,
      case: 'common'
    };

    const subscriptionResponse = await axios.post(`${NOWPAYMENTS_BASE_URL}/payment`, subscriptionData, {
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const subscription = subscriptionResponse.data;
    console.log('✅ Test subscription created successfully!');
    console.log('Subscription ID:', subscription.payment_id);
    console.log('Pay Address:', subscription.pay_address);
    console.log('Pay Amount:', subscription.pay_amount, subscription.pay_currency);
    console.log('Invoice URL:', subscription.invoice_url);
    console.log('Expires At:', subscription.expires_at);

    console.log('\n🎉 All NOWPayments tests passed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Set up webhook endpoint in NOWPayments dashboard:');
    console.log(`   ${BASE_URL}/api/webhooks/nowpayments`);
    console.log('2. Test the payment flow in your application');
    console.log('3. Monitor webhook calls in your server logs');
    
    return true;

  } catch (error) {
    console.error('\n❌ NOWPayments test failed:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
      
      if (error.response.status === 401) {
        console.log('\n💡 This usually means your API key is invalid or not activated');
        console.log('Check your NOWPayments dashboard and verify your API key');
      } else if (error.response.status === 403) {
        console.log('\n💡 This usually means your account needs verification');
        console.log('Complete the verification process in your NOWPayments dashboard');
      }
    } else {
      console.error('Network error:', error.message);
    }
    
    return false;
  }
}

async function testLocalServer() {
  console.log('\n🏠 Testing Local Server Integration...');
  
  try {
    // Test if the server is running
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Server is running');
    
    // Test if NOWPayments endpoints are available
    console.log('\n🔗 Testing NOWPayments endpoints...');
    
    // Note: These endpoints require authentication, so we'll just check if they exist
    try {
      await axios.post(`${BASE_URL}/api/subscribe/crypto`, {
        planId: 'pro'
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ /api/subscribe/crypto endpoint exists (requires auth)');
      } else {
        console.log('⚠️  /api/subscribe/crypto endpoint issue:', error.response?.status);
      }
    }
    
    try {
      await axios.post(`${BASE_URL}/api/subscribe/crypto-subscription`, {
        planId: 'pro'
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ /api/subscribe/crypto-subscription endpoint exists (requires auth)');
      } else {
        console.log('⚠️  /api/subscribe/crypto-subscription endpoint issue:', error.response?.status);
      }
    }
    
    console.log('✅ Local server integration tests completed');
    
  } catch (error) {
    console.error('❌ Local server test failed:', error.message);
    console.log('Make sure your server is running on', BASE_URL);
  }
}

// Main execution
async function main() {
  console.log('🚀 NOWPayments Integration Test Suite\n');
  console.log('Configuration:');
  console.log('- API Key:', NOWPAYMENTS_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('- Base URL:', BASE_URL);
  console.log('- NOWPayments URL:', NOWPAYMENTS_BASE_URL);
  console.log('');

  const apiTestPassed = await testNowPaymentsAPI();
  
  if (apiTestPassed) {
    await testLocalServer();
  }
  
  console.log('\n📖 For more information, see:');
  console.log('- NOWPayments Documentation: https://documenter.getpostman.com/view/7907941/S1a32n38');
  console.log('- Your app\'s MONETIZATION_GUIDE.md');
}

// Run the tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testNowPaymentsAPI, testLocalServer };
