// Migration: Fix constraints and VARCHAR limits
// This migration fixes the missing unique constraint on inflation_data table
// and increases VARCHAR column limits to prevent truncation errors

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixConstraintsAndVarcharLimits() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing constraints and VARCHAR limits...');
    
    // 1. Fix inflation_data table unique constraint
    console.log('📊 Fixing inflation_data table constraints...');
    
    // First, check if the constraint exists
    const constraintCheck = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'inflation_data' 
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%type%'
    `);
    
    if (constraintCheck.rows.length === 0) {
      console.log('⚠️ Unique constraint missing on inflation_data table, adding it...');
      await client.query(`
        ALTER TABLE inflation_data 
        ADD CONSTRAINT inflation_data_type_date_unique UNIQUE (type, date)
      `);
      console.log('✅ Added unique constraint to inflation_data table');
    } else {
      console.log('✅ Unique constraint already exists on inflation_data table');
    }
    
    // 2. Fix VARCHAR column limits across all tables
    console.log('📏 Increasing VARCHAR column limits...');
    
    const varcharFixes = [
      // Market data table
      { table: 'market_data', column: 'data_type', newType: 'VARCHAR(255)', description: 'Increase data_type limit' },
      { table: 'market_data', column: 'symbol', newType: 'VARCHAR(50)', description: 'Increase symbol limit' },
      { table: 'market_data', column: 'source', newType: 'VARCHAR(255)', description: 'Increase source limit' },
      
      // AI analysis table
      { table: 'ai_analysis', column: 'market_direction', newType: 'VARCHAR(50)', description: 'Increase market_direction limit' },
      
      // Crypto prices table
      { table: 'crypto_prices', column: 'symbol', newType: 'VARCHAR(20)', description: 'Increase symbol limit' },
      
      // Fear greed index table
      { table: 'fear_greed_index', column: 'classification', newType: 'VARCHAR(50)', description: 'Increase classification limit' },
      { table: 'fear_greed_index', column: 'source', newType: 'VARCHAR(255)', description: 'Increase source limit' },
      
      // Upcoming events table
      { table: 'upcoming_events', column: 'title', newType: 'VARCHAR(500)', description: 'Increase title limit' },
      { table: 'upcoming_events', column: 'category', newType: 'VARCHAR(100)', description: 'Increase category limit' },
      { table: 'upcoming_events', column: 'impact', newType: 'VARCHAR(50)', description: 'Increase impact limit' },
      { table: 'upcoming_events', column: 'source', newType: 'VARCHAR(255)', description: 'Increase source limit' },
      
      // Layer1 data table
      { table: 'layer1_data', column: 'chain_id', newType: 'VARCHAR(50)', description: 'Increase chain_id limit' },
      { table: 'layer1_data', column: 'name', newType: 'VARCHAR(100)', description: 'Increase name limit' },
      { table: 'layer1_data', column: 'symbol', newType: 'VARCHAR(20)', description: 'Increase symbol limit' },
      { table: 'layer1_data', column: 'narrative', newType: 'TEXT', description: 'Change narrative to TEXT' },
      { table: 'layer1_data', column: 'sentiment', newType: 'VARCHAR(50)', description: 'Increase sentiment limit' },
      
      // Bitcoin dominance table
      { table: 'bitcoin_dominance', column: 'source', newType: 'VARCHAR(255)', description: 'Increase source limit' },
      
      // Stablecoin metrics table
      { table: 'stablecoin_metrics', column: 'symbol', newType: 'VARCHAR(20)', description: 'Increase symbol limit' },
      { table: 'stablecoin_metrics', column: 'source', newType: 'VARCHAR(255)', description: 'Increase source limit' },
      
      // Exchange flows table
      { table: 'exchange_flows', column: 'symbol', newType: 'VARCHAR(20)', description: 'Increase symbol limit' },
      { table: 'exchange_flows', column: 'flow_type', newType: 'VARCHAR(50)', description: 'Increase flow_type limit' },
      { table: 'exchange_flows', column: 'source', newType: 'VARCHAR(255)', description: 'Increase source limit' },
      
      // Inflation data table
      { table: 'inflation_data', column: 'type', newType: 'VARCHAR(20)', description: 'Increase type limit' },
      { table: 'inflation_data', column: 'source', newType: 'VARCHAR(100)', description: 'Increase source limit' },
      
      // Inflation releases table
      { table: 'inflation_releases', column: 'type', newType: 'VARCHAR(20)', description: 'Increase type limit' },
      { table: 'inflation_releases', column: 'timezone', newType: 'VARCHAR(100)', description: 'Increase timezone limit' },
      { table: 'inflation_releases', column: 'source', newType: 'VARCHAR(100)', description: 'Increase source limit' },
      { table: 'inflation_releases', column: 'status', newType: 'VARCHAR(50)', description: 'Increase status limit' },
      
      // Economic calendar table
      { table: 'economic_calendar', column: 'title', newType: 'VARCHAR(500)', description: 'Increase title limit' },
      { table: 'economic_calendar', column: 'category', newType: 'VARCHAR(100)', description: 'Increase category limit' },
      { table: 'economic_calendar', column: 'impact', newType: 'VARCHAR(50)', description: 'Increase impact limit' },
      { table: 'economic_calendar', column: 'timezone', newType: 'VARCHAR(100)', description: 'Increase timezone limit' },
      { table: 'economic_calendar', column: 'source', newType: 'VARCHAR(255)', description: 'Increase source limit' },
      { table: 'economic_calendar', column: 'status', newType: 'VARCHAR(50)', description: 'Increase status limit' },
      
      // Economic data table
      { table: 'economic_data', column: 'series_id', newType: 'VARCHAR(255)', description: 'Increase series_id limit' },
      { table: 'economic_data', column: 'source', newType: 'VARCHAR(100)', description: 'Increase source limit' },
      { table: 'economic_data', column: 'description', newType: 'TEXT', description: 'Change description to TEXT' },
      
      // API usage table
      { table: 'api_usage', column: 'endpoint', newType: 'VARCHAR(255)', description: 'Increase endpoint limit' },
      { table: 'api_usage', column: 'user_agent', newType: 'TEXT', description: 'Change user_agent to TEXT' },
      { table: 'api_usage', column: 'ip_address', newType: 'VARCHAR(45)', description: 'Increase ip_address limit for IPv6' },
      
      // Alerts table
      { table: 'alerts', column: 'type', newType: 'VARCHAR(50)', description: 'Increase type limit' },
      { table: 'alerts', column: 'message', newType: 'TEXT', description: 'Change message to TEXT' },
      { table: 'alerts', column: 'severity', newType: 'VARCHAR(20)', description: 'Increase severity limit' },
      { table: 'alerts', column: 'metric', newType: 'VARCHAR(100)', description: 'Increase metric limit' },
      
      // User alert thresholds table
      { table: 'user_alert_thresholds', column: 'metric', newType: 'VARCHAR(100)', description: 'Increase metric limit' },
      
      // Derivatives data table
      { table: 'derivatives_data', column: 'symbol', newType: 'VARCHAR(20)', description: 'Increase symbol limit' },
      { table: 'derivatives_data', column: 'source', newType: 'VARCHAR(255)', description: 'Increase source limit' },
      
      // Onchain data table
      { table: 'onchain_data', column: 'metric', newType: 'VARCHAR(100)', description: 'Increase metric limit' },
      { table: 'onchain_data', column: 'source', newType: 'VARCHAR(255)', description: 'Increase source limit' },
      
      // Market sentiment table
      { table: 'market_sentiment', column: 'source', newType: 'VARCHAR(255)', description: 'Increase source limit' },
      
      // Trending narratives table
      { table: 'trending_narratives', column: 'narrative', newType: 'TEXT', description: 'Change narrative to TEXT' },
      { table: 'trending_narratives', column: 'sentiment', newType: 'VARCHAR(50)', description: 'Increase sentiment limit' },
      { table: 'trending_narratives', column: 'source', newType: 'TEXT', description: 'Change source to TEXT' }
    ];
    
    for (const fix of varcharFixes) {
      try {
        await client.query(`
          ALTER TABLE ${fix.table} 
          ALTER COLUMN ${fix.column} TYPE ${fix.newType}
        `);
        console.log(`✅ ${fix.description} for ${fix.table}.${fix.column}`);
      } catch (error) {
        if (error.message.includes('does not exist')) {
          console.log(`⚠️ Column ${fix.table}.${fix.column} does not exist, skipping`);
        } else {
          console.warn(`⚠️ Could not update ${fix.table}.${fix.column}: ${error.message}`);
        }
      }
    }
    
    // 3. Ensure all unique constraints exist for ON CONFLICT clauses
    console.log('🔗 Ensuring unique constraints exist...');
    
    const uniqueConstraints = [
      { table: 'inflation_releases', columns: ['type', 'date'], name: 'inflation_releases_type_date_unique' },
      { table: 'economic_data', columns: ['series_id', 'date'], name: 'economic_data_series_date_unique' },
      { table: 'crypto_prices', columns: ['symbol', 'timestamp'], name: 'crypto_prices_symbol_timestamp_unique' }
    ];
    
    for (const constraint of uniqueConstraints) {
      try {
        // Check if constraint exists
        const exists = await client.query(`
          SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE table_name = $1 AND constraint_name = $2
        `, [constraint.table, constraint.name]);
        
        if (exists.rows.length === 0) {
          await client.query(`
            ALTER TABLE ${constraint.table} 
            ADD CONSTRAINT ${constraint.name} UNIQUE (${constraint.columns.join(', ')})
          `);
          console.log(`✅ Added unique constraint ${constraint.name} to ${constraint.table}`);
        } else {
          console.log(`✅ Unique constraint ${constraint.name} already exists on ${constraint.table}`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not add constraint ${constraint.name}: ${error.message}`);
      }
    }
    
    console.log('🎉 All constraints and VARCHAR limits fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing constraints and VARCHAR limits:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if called directly
if (require.main === module) {
  fixConstraintsAndVarcharLimits()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { fixConstraintsAndVarcharLimits };
