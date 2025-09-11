#!/usr/bin/env node

/**
 * Test script to verify database migration works
 * This can be run on Railway to fix the schema
 */

const { Pool } = require('pg');
require('dotenv').config();

async function testMigration() {
  console.log('🔌 Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  const client = await pool.connect();
  
  try {
    console.log('✅ Database connected successfully');
    
    // Check current schema
    const schema = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'inflation_data'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Current inflation_data table schema:');
    schema.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check if mom_change columns exist
    const hasMomChange = schema.rows.some(row => row.column_name === 'mom_change');
    const hasCoreMomChange = schema.rows.some(row => row.column_name === 'core_mom_change');
    
    console.log(`\n🔍 Missing columns check:`);
    console.log(`  - mom_change: ${hasMomChange ? '✅ Exists' : '❌ Missing'}`);
    console.log(`  - core_mom_change: ${hasCoreMomChange ? '✅ Exists' : '❌ Missing'}`);
    
    if (!hasMomChange || !hasCoreMomChange) {
      console.log('\n🔧 Adding missing columns...');
      
      if (!hasMomChange) {
        await client.query(`ALTER TABLE inflation_data ADD COLUMN mom_change DECIMAL`);
        console.log('✅ Added mom_change column');
      }
      
      if (!hasCoreMomChange) {
        await client.query(`ALTER TABLE inflation_data ADD COLUMN core_mom_change DECIMAL`);
        console.log('✅ Added core_mom_change column');
      }
      
      console.log('🎉 Schema migration completed!');
    } else {
      console.log('✅ Schema is already up to date');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

testMigration()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
