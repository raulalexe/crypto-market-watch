#!/usr/bin/env node

/**
 * Debug Base Chain Payment Script
 * This script helps debug Base chain USDC payment verification issues
 */

const axios = require('axios');

// Base network configuration
const BASE_RPC_URL = 'https://mainnet.base.org';
const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

async function debugBaseTransaction(txHash, expectedAmount, expectedToAddress) {
  console.log('🔍 Debugging Base transaction verification...');
  console.log(`📋 Transaction Hash: ${txHash}`);
  console.log(`📋 Expected Amount: ${expectedAmount} USDC`);
  console.log(`📋 Expected To Address: ${expectedToAddress}`);
  console.log('');

  try {
    // Step 1: Get transaction details
    console.log('📝 Step 1: Getting transaction details...');
    const txResponse = await axios.post(BASE_RPC_URL, {
      jsonrpc: '2.0',
      method: 'eth_getTransactionByHash',
      params: [txHash],
      id: 1
    });

    if (!txResponse.data.result) {
      console.log('❌ Transaction not found on Base network');
      console.log('   This could mean:');
      console.log('   - Transaction hash is incorrect');
      console.log('   - Transaction is on a different network');
      console.log('   - Transaction hasn\'t been mined yet');
      return;
    }

    const tx = txResponse.data.result;
    console.log('✅ Transaction found!');
    console.log(`   From: ${tx.from}`);
    console.log(`   To: ${tx.to}`);
    console.log(`   Value: ${parseInt(tx.value, 16) / Math.pow(10, 18)} ETH`);
    console.log(`   Gas: ${parseInt(tx.gas, 16)}`);
    console.log(`   Gas Price: ${parseInt(tx.gasPrice, 16) / Math.pow(10, 18)} ETH`);
    console.log('');

    // Step 2: Get transaction receipt
    console.log('📝 Step 2: Getting transaction receipt...');
    const receiptResponse = await axios.post(BASE_RPC_URL, {
      jsonrpc: '2.0',
      method: 'eth_getTransactionReceipt',
      params: [txHash],
      id: 2
    });

    if (!receiptResponse.data.result) {
      console.log('❌ Transaction receipt not found');
      console.log('   This means the transaction hasn\'t been confirmed yet');
      return;
    }

    const receipt = receiptResponse.data.result;
    console.log('✅ Transaction receipt found!');
    console.log(`   Status: ${receipt.status === '0x1' ? 'Success' : 'Failed'}`);
    console.log(`   Block Number: ${parseInt(receipt.blockNumber, 16)}`);
    console.log(`   Gas Used: ${parseInt(receipt.gasUsed, 16)}`);
    console.log('');

    // Step 3: Check if it's a USDC transaction
    console.log('📝 Step 3: Checking if it\'s a USDC transaction...');
    if (tx.to.toLowerCase() !== BASE_USDC_ADDRESS.toLowerCase()) {
      console.log('❌ Not a USDC transaction');
      console.log(`   Expected USDC contract: ${BASE_USDC_ADDRESS}`);
      console.log(`   Actual contract: ${tx.to}`);
      console.log('   This transaction is not interacting with the USDC contract');
      return;
    }
    console.log('✅ Transaction is interacting with USDC contract');
    console.log('');

    // Step 4: Parse transaction data
    console.log('📝 Step 4: Parsing transaction data...');
    const data = tx.input;
    console.log(`   Input data: ${data}`);
    
    if (!data.startsWith('0xa9059cbb')) {
      console.log('❌ Not a transfer transaction');
      console.log('   Expected function selector: 0xa9059cbb (transfer)');
      console.log(`   Actual function selector: ${data.slice(0, 10)}`);
      console.log('   This transaction is not a USDC transfer');
      return;
    }
    console.log('✅ Transaction is a USDC transfer');
    console.log('');

    // Step 5: Extract transfer details
    console.log('📝 Step 5: Extracting transfer details...');
    const toAddress = '0x' + data.slice(34, 74); // Skip function selector and padding
    const amountHex = data.slice(74, 138);
    const amount = parseInt(amountHex, 16) / Math.pow(10, 6); // USDC has 6 decimals

    console.log(`   Recipient: ${toAddress}`);
    console.log(`   Amount: ${amount} USDC`);
    console.log('');

    // Step 6: Verify details
    console.log('📝 Step 6: Verifying transaction details...');
    
    // Check recipient address
    if (toAddress.toLowerCase() !== expectedToAddress.toLowerCase()) {
      console.log('❌ Wrong recipient address');
      console.log(`   Expected: ${expectedToAddress}`);
      console.log(`   Actual: ${toAddress}`);
      return;
    }
    console.log('✅ Recipient address is correct');

    // Check amount
    const tolerance = 0.01; // 1 cent tolerance
    if (Math.abs(amount - expectedAmount) > tolerance) {
      console.log('❌ Wrong amount');
      console.log(`   Expected: ${expectedAmount} USDC`);
      console.log(`   Actual: ${amount} USDC`);
      console.log(`   Difference: ${Math.abs(amount - expectedAmount)} USDC`);
      return;
    }
    console.log('✅ Amount is correct');

    console.log('');
    console.log('🎉 Transaction verification successful!');
    console.log('   The transaction should be accepted by the payment system.');
    console.log('');
    console.log('💡 If you\'re still getting "invalid token" error, the issue is with authentication, not the transaction.');
    console.log('   Try logging out and logging back in to get a fresh token.');

  } catch (error) {
    console.error('❌ Error debugging transaction:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('Usage: node debug-base-payment.js <txHash> <expectedAmount> <expectedToAddress>');
  console.log('');
  console.log('Example:');
  console.log('node debug-base-payment.js 0x1234... 10.0 0x4567...');
  process.exit(1);
}

const [txHash, expectedAmount, expectedToAddress] = args;

// Validate inputs
if (!txHash.startsWith('0x') || txHash.length !== 66) {
  console.log('❌ Invalid transaction hash format');
  console.log('   Transaction hash should start with 0x and be 66 characters long');
  process.exit(1);
}

const amount = parseFloat(expectedAmount);
if (isNaN(amount) || amount <= 0) {
  console.log('❌ Invalid expected amount');
  console.log('   Expected amount should be a positive number');
  process.exit(1);
}

if (!expectedToAddress.startsWith('0x') || expectedToAddress.length !== 42) {
  console.log('❌ Invalid expected to address format');
  console.log('   Address should start with 0x and be 42 characters long');
  process.exit(1);
}

// Run the debug
debugBaseTransaction(txHash, amount, expectedToAddress);
