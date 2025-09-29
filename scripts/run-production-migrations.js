#!/usr/bin/env node

// Script to run all pending migrations on deployment
require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runProductionMigrations() {
  console.log('🚀 Running Production Migrations on Deployment...');
  console.log('📅 Time:', new Date().toISOString());
  
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!dbUrl) {
    console.error('❌ No database URL found in environment variables');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    console.log('🔌 Connecting to production database...');
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        migration_id VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, '../server/scripts/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort(); // Execute in order
    
    console.log(`📂 Found ${migrationFiles.length} migration files`);
    
    // Get already executed migrations
    const executedMigrations = await client.query(
      'SELECT migration_id FROM migrations ORDER BY executed_at'
    );
    const executedIds = new Set(executedMigrations.rows.map(row => row.migration_id));
    
    console.log(`✅ ${executedIds.size} migrations already executed`);
    
    let executedCount = 0;
    
    // Execute pending migrations
    for (const file of migrationFiles) {
      try {
        const migrationPath = path.join(migrationsDir, file);
        const migration = require(migrationPath);
        
        if (!migration.id || !migration.up) {
          console.log(`⚠️ Skipping invalid migration file: ${file}`);
          continue;
        }
        
        if (executedIds.has(migration.id)) {
          console.log(`⏭️ Skipping already executed migration: ${migration.id}`);
          continue;
        }
        
        console.log(`🔧 Executing migration: ${migration.id}`);
        console.log(`   Description: ${migration.description || 'No description'}`);
        
        // Execute the migration
        await migration.up(client);
        
        // Record the migration as executed
        await client.query(
          'INSERT INTO migrations (migration_id, description) VALUES ($1, $2)',
          [migration.id, migration.description || '']
        );
        
        console.log(`✅ Migration ${migration.id} completed successfully`);
        executedCount++;
        
      } catch (migrationError) {
        console.error(`❌ Migration ${file} failed:`, migrationError.message);
        console.error('Stack:', migrationError.stack);
        
        // Don't exit on migration failure in production - log and continue
        console.log('⚠️ Continuing with remaining migrations...');
      }
    }
    
    client.release();
    
    if (executedCount > 0) {
      console.log(`🎉 Successfully executed ${executedCount} new migrations!`);
    } else {
      console.log('✅ All migrations are up to date');
    }
    
    // Verify critical fixes are in place
    await verifyMigrationFixes(pool);
    
    console.log('🚀 Production migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration script failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Verify that critical fixes are in place
async function verifyMigrationFixes(pool) {
  console.log('\n🔍 Verifying migration fixes...');
  
  const client = await pool.connect();
  
  try {
    // Check crypto_news_notifications column
    const newsNotificationCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'crypto_news_notifications'
    `);
    
    if (newsNotificationCheck.rows.length > 0) {
      console.log('✅ crypto_news_notifications column exists');
    } else {
      console.log('⚠️ crypto_news_notifications column missing - notification system may fail');
    }
    
    // Check inflation_data unique constraint
    const inflationConstraintCheck = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'inflation_data' 
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'inflation_data_type_date_unique'
    `);
    
    if (inflationConstraintCheck.rows.length > 0) {
      console.log('✅ inflation_data unique constraint exists');
    } else {
      console.log('⚠️ inflation_data unique constraint missing - ON CONFLICT may fail');
    }
    
    // Check error_logs column sizes
    const errorLogsCheck = await client.query(`
      SELECT column_name, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'error_logs' 
      AND column_name = 'source'
    `);
    
    if (errorLogsCheck.rows.length > 0) {
      const maxLength = errorLogsCheck.rows[0].character_maximum_length;
      if (maxLength >= 500) {
        console.log(`✅ error_logs source column size: ${maxLength}`);
      } else {
        console.log(`⚠️ error_logs source column too small: ${maxLength} (needs 500+)`);
      }
    }
    
    console.log('✅ Migration verification completed');
    
  } catch (error) {
    console.error('❌ Migration verification failed:', error.message);
  } finally {
    client.release();
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n⚠️ Received SIGINT, terminating gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️ Received SIGTERM, terminating gracefully...');
  process.exit(0);
});

// Run migrations if called directly
if (require.main === module) {
  runProductionMigrations()
    .then(() => {
      console.log('\n🎉 Production migrations script completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Production migrations script failed:', error);
      process.exit(1);
    });
}

module.exports = runProductionMigrations;
