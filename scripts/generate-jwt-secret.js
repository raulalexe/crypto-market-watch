#!/usr/bin/env node

/**
 * Generate a secure JWT secret for production use
 * Usage: node scripts/generate-jwt-secret.js
 */

const crypto = require('crypto');

function generateJWTSecret() {
  // Generate a 64-byte random secret and encode as base64
  const secret = crypto.randomBytes(64).toString('base64');
  
  console.log('🔐 Generated JWT Secret:');
  console.log('='.repeat(80));
  console.log(secret);
  console.log('='.repeat(80));
  console.log('');
  console.log('📋 Instructions:');
  console.log('1. Copy the secret above');
  console.log('2. Set it as JWT_SECRET in your environment variables');
  console.log('3. Keep this secret secure and never commit it to version control');
  console.log('');
  console.log('⚠️  Security Notes:');
  console.log('- This secret is used to sign and verify JWT tokens');
  console.log('- Anyone with this secret can create valid tokens');
  console.log('- Store it securely (environment variables, secret management)');
  console.log('- Use different secrets for different environments');
  console.log('');
  console.log('🚀 For Railway deployment:');
  console.log('Add this as JWT_SECRET in your Railway environment variables');
}

if (require.main === module) {
  generateJWTSecret();
}

module.exports = { generateJWTSecret };
