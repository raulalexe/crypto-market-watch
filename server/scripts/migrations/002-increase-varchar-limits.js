#!/usr/bin/env node

/**
 * Migration: Increase VARCHAR field limits to prevent data truncation errors
 * This fixes the varchar.c line 637 error by increasing field sizes
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Running migration: Increase VARCHAR field limits...');
    
    // Increase VARCHAR field sizes to prevent truncation errors
    const alterations = [
      // Layer1 data table - increase chain_id and name limits
      {
        table: 'layer1_data',
        column: 'chain_id',
        newType: 'VARCHAR(100)',
        description: 'Increase chain_id from VARCHAR(50) to VARCHAR(100)'
      },
      {
        table: 'layer1_data', 
        column: 'name',
        newType: 'VARCHAR(200)',
        description: 'Increase name from VARCHAR(100) to VARCHAR(200)'
      },
      {
        table: 'layer1_data',
        column: 'symbol', 
        newType: 'VARCHAR(20)',
        description: 'Increase symbol from VARCHAR(10) to VARCHAR(20)'
      },
      
      // Trending narratives table - increase sentiment limit
      {
        table: 'trending_narratives',
        column: 'sentiment',
        newType: 'VARCHAR(50)',
        description: 'Increase sentiment from VARCHAR(20) to VARCHAR(50)'
      },
      
      // Economic calendar table - increase various field limits
      {
        table: 'economic_calendar',
        column: 'event_id',
        newType: 'VARCHAR(100)',
        description: 'Increase event_id from VARCHAR(50) to VARCHAR(100)'
      },
      {
        table: 'economic_calendar',
        column: 'category',
        newType: 'VARCHAR(100)',
        description: 'Increase category from VARCHAR(50) to VARCHAR(100)'
      },
      {
        table: 'economic_calendar',
        column: 'impact',
        newType: 'VARCHAR(50)',
        description: 'Increase impact from VARCHAR(20) to VARCHAR(50)'
      },
      {
        table: 'economic_calendar',
        column: 'timezone',
        newType: 'VARCHAR(100)',
        description: 'Increase timezone from VARCHAR(50) to VARCHAR(100)'
      },
      {
        table: 'economic_calendar',
        column: 'status',
        newType: 'VARCHAR(50)',
        description: 'Increase status from VARCHAR(20) to VARCHAR(50)'
      },
      
      // Economic data table - increase series_id limit
      {
        table: 'economic_data',
        column: 'series_id',
        newType: 'VARCHAR(100)',
        description: 'Increase series_id from VARCHAR(50) to VARCHAR(100)'
      },
      {
        table: 'economic_data',
        column: 'source',
        newType: 'VARCHAR(50)',
        description: 'Increase source from VARCHAR(10) to VARCHAR(50)'
      },
      
      // Inflation data tables - increase source limits
      {
        table: 'inflation_data',
        column: 'source',
        newType: 'VARCHAR(50)',
        description: 'Increase source from VARCHAR(10) to VARCHAR(50)'
      },
      {
        table: 'inflation_releases',
        column: 'source',
        newType: 'VARCHAR(50)',
        description: 'Increase source from VARCHAR(10) to VARCHAR(50)'
      },
      {
        table: 'inflation_releases',
        column: 'timezone',
        newType: 'VARCHAR(100)',
        description: 'Increase timezone from VARCHAR(50) to VARCHAR(100)'
      },
      {
        table: 'inflation_releases',
        column: 'status',
        newType: 'VARCHAR(50)',
        description: 'Increase status from VARCHAR(20) to VARCHAR(50)'
      },
      
      // Market data table - increase various field limits
      {
        table: 'market_data',
        column: 'data_type',
        newType: 'VARCHAR(100)',
        description: 'Increase data_type from VARCHAR(50) to VARCHAR(100)'
      },
      {
        table: 'market_data',
        column: 'symbol',
        newType: 'VARCHAR(50)',
        description: 'Increase symbol from VARCHAR(20) to VARCHAR(50)'
      },
      {
        table: 'market_data',
        column: 'source',
        newType: 'VARCHAR(200)',
        description: 'Increase source from VARCHAR(100) to VARCHAR(200)'
      }
    ];
    
    // Execute each alteration
    for (const alteration of alterations) {
      try {
        console.log(`🔧 ${alteration.description}...`);
        await client.query(`
          ALTER TABLE ${alteration.table} 
          ALTER COLUMN ${alteration.column} TYPE ${alteration.newType}
        `);
        console.log(`✅ ${alteration.description} - completed`);
      } catch (error) {
        if (error.message.includes('does not exist')) {
          console.log(`⚠️  Column ${alteration.table}.${alteration.column} does not exist, skipping`);
        } else {
          console.error(`❌ Failed to alter ${alteration.table}.${alteration.column}:`, error.message);
        }
      }
    }
    
    console.log('✅ Migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Only run if called directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
