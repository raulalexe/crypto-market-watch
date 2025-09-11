#!/usr/bin/env node

/**
 * Railway Database Fix Script
 * Run this on Railway to fix the inflation_data table schema
 */

const { Pool } = require('pg');

async function fixDatabase() {
  console.log('🚂 Railway Database Fix Script');
  console.log('================================');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
  }
  
  console.log('🔌 Connecting to Railway PostgreSQL database...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  const client = await pool.connect();
  
  try {
    console.log('✅ Connected to database successfully');
    
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
      
      // Show updated schema
      const updatedSchema = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'inflation_data'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 Updated inflation_data table schema:');
      updatedSchema.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } else {
      console.log('✅ Schema is already up to date');
    }
    
    // Test inserting sample data
    console.log('\n🧪 Testing data insertion...');
    try {
      await client.query(`
        INSERT INTO inflation_data (type, date, value, core_value, yoy_change, core_yoy_change, mom_change, core_mom_change, source)
        VALUES ('TEST', CURRENT_DATE, 100.0, 100.0, 2.0, 2.0, 0.1, 0.1, 'TEST')
        ON CONFLICT (type, date) DO NOTHING
      `);
      console.log('✅ Test data insertion successful');
      
      // Clean up test data
      await client.query(`DELETE FROM inflation_data WHERE type = 'TEST'`);
      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.error('❌ Test data insertion failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixDatabase()
  .then(() => {
    console.log('\n🎉 Database fix completed successfully!');
    console.log('The inflation data collection should now work without errors.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Database fix failed:', error);
    process.exit(1);
  });
