#!/usr/bin/env node

/**
 * Database migration runner
 * Automatically runs all migrations in the migrations directory
 */

const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  
  // Check if migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    console.log('📁 No migrations directory found, skipping migrations');
    return;
  }
  
  // Get all migration files
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.js'))
    .sort(); // Run migrations in alphabetical order
  
  if (migrationFiles.length === 0) {
    console.log('📁 No migration files found, skipping migrations');
    return;
  }
  
  console.log(`🔧 Found ${migrationFiles.length} migration(s) to run`);
  
  // Run each migration
  for (const file of migrationFiles) {
    try {
      console.log(`🚀 Running migration: ${file}`);
      const migrationPath = path.join(migrationsDir, file);
      const migration = require(migrationPath);
      
      if (typeof migration.runMigration === 'function') {
        await migration.runMigration();
      } else {
        console.log(`⚠️  Migration ${file} does not export runMigration function, skipping`);
      }
      
      console.log(`✅ Migration ${file} completed successfully`);
    } catch (error) {
      console.error(`❌ Migration ${file} failed:`, error.message);
      // Continue with other migrations even if one fails
    }
  }
  
  console.log('🎉 All migrations completed');
}

module.exports = { runMigrations };
