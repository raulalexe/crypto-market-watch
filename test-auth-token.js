#!/usr/bin/env node

/**
 * Test Authentication Token Script
 * This script helps debug JWT token issues
 */

const jwt = require('jsonwebtoken');

function testAuthToken(token) {
  console.log('🔐 Testing authentication token...');
  console.log(`📋 Token: ${token.substring(0, 20)}...`);
  console.log('');

  try {
    // Try to decode without verification first
    const decoded = jwt.decode(token);
    if (!decoded) {
      console.log('❌ Token is not a valid JWT format');
      return;
    }

    console.log('✅ Token is valid JWT format');
    console.log(`   User ID: ${decoded.userId}`);
    console.log(`   Issued at: ${new Date(decoded.iat * 1000).toISOString()}`);
    console.log(`   Expires at: ${new Date(decoded.exp * 1000).toISOString()}`);
    console.log('');

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      console.log('❌ Token is expired');
      console.log(`   Current time: ${new Date(now * 1000).toISOString()}`);
      console.log(`   Token expires: ${new Date(decoded.exp * 1000).toISOString()}`);
      console.log('');
      console.log('💡 Solution: Log out and log back in to get a fresh token');
      return;
    }

    console.log('✅ Token is not expired');
    console.log('');

    // Try to verify with JWT secret
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.log('⚠️  JWT_SECRET environment variable not set');
      console.log('   Cannot verify token signature');
      return;
    }

    try {
      const verified = jwt.verify(token, jwtSecret);
      console.log('✅ Token signature is valid');
      console.log('   The token should work for API requests');
    } catch (verifyError) {
      console.log('❌ Token signature verification failed');
      console.log(`   Error: ${verifyError.message}`);
      console.log('');
      console.log('💡 This could mean:');
      console.log('   - JWT_SECRET has changed since the token was issued');
      console.log('   - Token was issued by a different server');
      console.log('   - Token is corrupted');
      console.log('');
      console.log('💡 Solution: Log out and log back in to get a fresh token');
    }

  } catch (error) {
    console.log('❌ Error testing token:', error.message);
  }
}

// Get token from command line
const token = process.argv[2];
if (!token) {
  console.log('Usage: node test-auth-token.js <token>');
  console.log('');
  console.log('To get your token:');
  console.log('1. Open browser Developer Tools (F12)');
  console.log('2. Go to Application/Storage tab');
  console.log('3. Look for localStorage');
  console.log('4. Find the "authToken" key');
  console.log('5. Copy the value and use it as the argument');
  process.exit(1);
}

testAuthToken(token);
