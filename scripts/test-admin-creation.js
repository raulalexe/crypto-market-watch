#!/usr/bin/env node

/**
 * Test script for admin creation functionality
 * Tests both automatic and manual admin creation
 */

require('dotenv').config({ path: '.env.local' });

async function testAdminCreation() {
  console.log('🧪 Testing Admin Creation Functionality...\n');
  
  // Test 1: Check environment variables
  console.log('📋 Environment Variables Check:');
  console.log(`  ADMIN_EMAIL: ${process.env.ADMIN_EMAIL ? '✅ Set' : '❌ Not set'}`);
  console.log(`  ADMIN_PASSWORD: ${process.env.ADMIN_PASSWORD ? '✅ Set' : '❌ Not set'}`);
  console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}\n`);
  
  // Test 2: Test import functionality
  console.log('📦 Testing Import Functionality:');
  try {
    const { createAdminOnDeploy } = require('./createAdminOnDeploy');
    console.log('  ✅ createAdminOnDeploy import successful');
  } catch (error) {
    console.log('  ❌ createAdminOnDeploy import failed:', error.message);
  }
  
  try {
    const { createProductionAdmin } = require('./createProductionAdmin');
    console.log('  ✅ createProductionAdmin import successful');
  } catch (error) {
    console.log('  ❌ createProductionAdmin import failed:', error.message);
  }
  
  // Test 3: Test server import path
  console.log('\n🔗 Testing Server Import Path:');
  try {
    const { createAdminOnDeploy } = require('../scripts/createAdminOnDeploy');
    console.log('  ✅ Server import path working');
  } catch (error) {
    console.log('  ❌ Server import path failed:', error.message);
  }
  
  // Test 4: Check if admin creation would run
  console.log('\n🚀 Admin Creation Logic Test:');
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    console.log('  ✅ Admin creation would run automatically on server start');
    console.log(`  📧 Email: ${process.env.ADMIN_EMAIL}`);
    console.log(`  🔑 Password: ${'*'.repeat(process.env.ADMIN_PASSWORD.length)}`);
  } else {
    console.log('  ⏭️  Admin creation would be skipped (missing env vars)');
    console.log('  💡 To enable automatic admin creation, set:');
    console.log('     - ADMIN_EMAIL=admin@crypto-market-watch.xyz');
    console.log('     - ADMIN_PASSWORD=your-secure-password');
  }
  
  console.log('\n📚 Available Admin Creation Methods:');
  console.log('  1. Automatic (on server start): Set ADMIN_EMAIL and ADMIN_PASSWORD');
  console.log('  2. Manual script: npm run create-admin');
  console.log('  3. Direct script: node scripts/createAdminOnDeploy.js');
  console.log('  4. Production script: node scripts/createProductionAdmin.js');
  
  console.log('\n✅ Admin creation functionality test complete!');
}

// Run the test
if (require.main === module) {
  testAdminCreation().catch(console.error);
}

module.exports = testAdminCreation;
