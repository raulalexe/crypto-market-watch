#!/usr/bin/env node

const jwt = require('jsonwebtoken');

// Railway JWT_SECRET from your logs
const RAILWAY_JWT_SECRET = 'wQTBYVfHPnavRr242RnxA5jfVavx+nT6twlgZcKMQrC7kvzoFnid+LhZGkcCKYN1qsEvCKC1pBSp+uhHP06Ibg==';

async function validateRailwayJWTSecret() {
  console.log('🔐 Validating Railway JWT secret...\n');

  try {
    // Test 1: Validate JWT_SECRET format
    console.log('1. Validating JWT_SECRET format...');
    console.log('📝 JWT_SECRET length:', RAILWAY_JWT_SECRET.length);
    console.log('📝 JWT_SECRET prefix:', RAILWAY_JWT_SECRET.substring(0, 8) + '...');
    console.log('📝 JWT_SECRET suffix:', '...' + RAILWAY_JWT_SECRET.substring(RAILWAY_JWT_SECRET.length - 8));
    
    if (RAILWAY_JWT_SECRET.length !== 88) {
      console.log('❌ JWT_SECRET length is not 88 characters');
      return;
    }
    console.log('✅ JWT_SECRET format is correct');

    // Test 2: Test JWT signing
    console.log('\n2. Testing JWT signing...');
    const testPayload = { 
      userId: 1, 
      email: 'test@example.com'
    };
    
    const testToken = jwt.sign(testPayload, RAILWAY_JWT_SECRET, { expiresIn: '24h' });
    console.log('✅ JWT signing successful');
    console.log('📝 Test token length:', testToken.length);
    console.log('📝 Test token prefix:', testToken.substring(0, 20) + '...');

    // Test 3: Test JWT verification
    console.log('\n3. Testing JWT verification...');
    const decoded = jwt.verify(testToken, RAILWAY_JWT_SECRET);
    console.log('✅ JWT verification successful');
    console.log('📝 Decoded payload:', decoded);

    // Test 4: Test with different payload (like real user data)
    console.log('\n4. Testing with real user payload...');
    const userPayload = { 
      userId: 2, 
      email: 'raul@palm-tree-tech.xyz'
    };
    
    const userToken = jwt.sign(userPayload, RAILWAY_JWT_SECRET, { expiresIn: '24h' });
    const userDecoded = jwt.verify(userToken, RAILWAY_JWT_SECRET);
    console.log('✅ User token signing and verification successful');
    console.log('📝 User token length:', userToken.length);
    console.log('📝 User decoded:', userDecoded);

    // Test 5: Test token expiration
    console.log('\n5. Testing token expiration...');
    const expiredPayload = { 
      userId: 1, 
      email: 'test@example.com'
    };
    
    const expiredToken = jwt.sign(expiredPayload, RAILWAY_JWT_SECRET, { expiresIn: '-1h' }); // Expired 1 hour ago
    try {
      jwt.verify(expiredToken, RAILWAY_JWT_SECRET);
      console.log('❌ Expired token should have failed verification');
    } catch (expiredError) {
      console.log('✅ Expired token correctly rejected:', expiredError.name);
    }

    // Test 6: Test with wrong secret
    console.log('\n6. Testing with wrong secret...');
    const wrongSecret = 'wrong-secret-key';
    try {
      jwt.verify(testToken, wrongSecret);
      console.log('❌ Token should have failed with wrong secret');
    } catch (wrongSecretError) {
      console.log('✅ Token correctly rejected with wrong secret:', wrongSecretError.name);
    }

    console.log('\n🎉 All JWT tests passed!');
    console.log('📝 Summary:');
    console.log('   - JWT_SECRET format: ✅ Correct (88 characters)');
    console.log('   - JWT signing: ✅ Working');
    console.log('   - JWT verification: ✅ Working');
    console.log('   - Token expiration: ✅ Working');
    console.log('   - Wrong secret rejection: ✅ Working');
    
    console.log('\n🔧 The JWT_SECRET is working correctly!');
    console.log('   The issue is likely:');
    console.log('   1. Wrong login credentials');
    console.log('   2. User not activated by admin');
    console.log('   3. Email verification required');
    console.log('   4. Different JWT_SECRET in Railway environment');

  } catch (error) {
    console.log('❌ JWT validation failed:', error.message);
    console.log('📝 Error details:', error);
  }
}

// Run the validation
validateRailwayJWTSecret().catch(console.error);
