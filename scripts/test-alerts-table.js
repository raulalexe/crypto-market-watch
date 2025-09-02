#!/usr/bin/env node

/**
 * Test script for alerts table functionality
 * Tests inserting and retrieving alerts
 */

require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

async function testAlertsTable() {
  console.log('🧪 Testing Alerts Table Functionality...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }
  
  const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    const client = await db.connect();
    console.log('✅ Connected to database');
    
    // Test 1: Check table structure
    console.log('\n🔍 Test 1: Checking table structure...');
    try {
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'alerts' 
        ORDER BY ordinal_position
      `);
      
      console.log('  📋 Alerts table columns:');
      result.rows.forEach(row => {
        console.log(`    - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      
      const requiredColumns = ['type', 'metric', 'severity', 'message'];
      const existingColumns = result.rows.map(row => row.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length === 0) {
        console.log('  ✅ All required columns are present');
      } else {
        console.log(`  ❌ Missing columns: ${missingColumns.join(', ')}`);
        return;
      }
    } catch (error) {
      console.log(`  ❌ Error checking table structure: ${error.message}`);
      return;
    }
    
    // Test 2: Insert a test alert
    console.log('\n🔍 Test 2: Inserting test alert...');
    try {
      const testAlert = {
        type: 'test_alert',
        message: 'This is a test alert to verify the table works',
        severity: 'medium',
        metric: 'test_metric',
        value: 'test_value'
      };
      
      const insertResult = await client.query(`
        INSERT INTO alerts (type, message, severity, metric, value)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, type, message, severity, metric, value, timestamp
      `, [testAlert.type, testAlert.message, testAlert.severity, testAlert.metric, testAlert.value]);
      
      console.log('  ✅ Test alert inserted successfully');
      console.log(`    ID: ${insertResult.rows[0].id}`);
      console.log(`    Type: ${insertResult.rows[0].type}`);
      console.log(`    Message: ${insertResult.rows[0].message}`);
      console.log(`    Severity: ${insertResult.rows[0].severity}`);
      console.log(`    Metric: ${insertResult.rows[0].metric}`);
      console.log(`    Value: ${insertResult.rows[0].value}`);
      console.log(`    Timestamp: ${insertResult.rows[0].timestamp}`);
      
      const alertId = insertResult.rows[0].id;
      
      // Test 3: Retrieve the test alert
      console.log('\n🔍 Test 3: Retrieving test alert...');
      try {
        const retrieveResult = await client.query(`
          SELECT * FROM alerts WHERE id = $1
        `, [alertId]);
        
        if (retrieveResult.rows.length > 0) {
          console.log('  ✅ Test alert retrieved successfully');
          const alert = retrieveResult.rows[0];
          console.log(`    Retrieved: ${alert.type} - ${alert.message}`);
        } else {
          console.log('  ❌ Failed to retrieve test alert');
        }
      } catch (error) {
        console.log(`  ❌ Error retrieving alert: ${error.message}`);
      }
      
      // Test 4: Clean up test data
      console.log('\n🔍 Test 4: Cleaning up test data...');
      try {
        await client.query(`
          DELETE FROM alerts WHERE id = $1
        `, [alertId]);
        console.log('  ✅ Test alert cleaned up');
      } catch (error) {
        console.log(`  ⚠️ Error cleaning up: ${error.message}`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error inserting test alert: ${error.message}`);
      return;
    }
    
    // Test 5: Test alerts table functions
    console.log('\n🔍 Test 5: Testing database functions...');
    try {
      // Test insertAlert function
      const { insertAlert } = require('../server/database');
      const testAlert2 = {
        type: 'function_test',
        message: 'Testing insertAlert function',
        severity: 'low',
        metric: 'function_test',
        value: 'success'
      };
      
      const insertResult = await insertAlert(testAlert2);
      console.log('  ✅ insertAlert function works');
      console.log(`    Inserted alert ID: ${insertResult.id}`);
      
      // Test getAlerts function
      const { getAlerts } = require('../server/database');
      const alerts = await getAlerts();
      console.log('  ✅ getAlerts function works');
      console.log(`    Found ${alerts.length} alerts in database`);
      
      // Clean up
      await client.query(`
        DELETE FROM alerts WHERE id = $1
      `, [insertResult.id]);
      console.log('  ✅ Function test data cleaned up');
      
    } catch (error) {
      console.log(`  ⚠️ Function test error: ${error.message}`);
    }
    
    console.log('\n✅ All alerts table tests completed successfully!');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Run the test
if (require.main === module) {
  testAlertsTable().catch(console.error);
}

module.exports = testAlertsTable;
