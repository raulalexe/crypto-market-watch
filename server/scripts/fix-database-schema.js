#!/usr/bin/env node

/**
 * Script to fix database schema issues
 * This script will run the new migration to fix missing column issues
 */

const { fixMissingColumns } = require('./migrations/005-fix-missing-columns');

async function main() {
  try {
    console.log('🔧 Starting database schema fix...');
    await fixMissingColumns();
    console.log('✅ Database schema fix completed successfully!');
  } catch (error) {
    console.error('❌ Database schema fix failed:', error);
    process.exit(1);
  }
}

main();
