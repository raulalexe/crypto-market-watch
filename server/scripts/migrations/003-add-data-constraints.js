// Migration: Add data integrity constraints
// This migration adds proper constraints to ensure data integrity

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addDataConstraints() {
  const client = await db.connect();
  
  try {
    console.log('🔧 Adding data integrity constraints...');
    
    // Add email format constraint to users table
    await client.query(`
      ALTER TABLE users 
      ADD CONSTRAINT IF NOT EXISTS users_email_format_check 
      CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
    `);
    console.log('✅ Added email format constraint to users table');
    
    // Add password hash length constraint
    await client.query(`
      ALTER TABLE users 
      ADD CONSTRAINT IF NOT EXISTS users_password_hash_length_check 
      CHECK (length(password_hash) >= 60)
    `);
    console.log('✅ Added password hash length constraint');
    
    // Add positive value constraints to market data
    await client.query(`
      ALTER TABLE market_data 
      ADD CONSTRAINT IF NOT EXISTS market_data_value_positive_check 
      CHECK (value IS NULL OR value >= 0)
    `);
    console.log('✅ Added positive value constraint to market_data');
    
    // Add fear greed index range constraint
    await client.query(`
      ALTER TABLE fear_greed_index 
      ADD CONSTRAINT IF NOT EXISTS fear_greed_index_value_range_check 
      CHECK (value >= 0 AND value <= 100)
    `);
    console.log('✅ Added fear greed index range constraint');
    
    // Add crypto prices positive constraints
    await client.query(`
      ALTER TABLE crypto_prices 
      ADD CONSTRAINT IF NOT EXISTS crypto_prices_price_positive_check 
      CHECK (price > 0)
    `);
    console.log('✅ Added crypto prices positive constraint');
    
    await client.query(`
      ALTER TABLE crypto_prices 
      ADD CONSTRAINT IF NOT EXISTS crypto_prices_volume_positive_check 
      CHECK (volume_24h IS NULL OR volume_24h >= 0)
    `);
    console.log('✅ Added crypto volume positive constraint');
    
    await client.query(`
      ALTER TABLE crypto_prices 
      ADD CONSTRAINT IF NOT EXISTS crypto_prices_market_cap_positive_check 
      CHECK (market_cap IS NULL OR market_cap >= 0)
    `);
    console.log('✅ Added crypto market cap positive constraint');
    
    // Add AI analysis confidence range constraint
    await client.query(`
      ALTER TABLE ai_analysis 
      ADD CONSTRAINT IF NOT EXISTS ai_analysis_confidence_range_check 
      CHECK (confidence >= 0 AND confidence <= 1)
    `);
    console.log('✅ Added AI analysis confidence range constraint');
    
    // Add layer1 data positive constraints
    await client.query(`
      ALTER TABLE layer1_data 
      ADD CONSTRAINT IF NOT EXISTS layer1_data_price_positive_check 
      CHECK (price > 0)
    `);
    console.log('✅ Added layer1 price positive constraint');
    
    await client.query(`
      ALTER TABLE layer1_data 
      ADD CONSTRAINT IF NOT EXISTS layer1_data_tps_positive_check 
      CHECK (tps >= 0)
    `);
    console.log('✅ Added layer1 TPS positive constraint');
    
    await client.query(`
      ALTER TABLE layer1_data 
      ADD CONSTRAINT IF NOT EXISTS layer1_data_active_addresses_positive_check 
      CHECK (active_addresses >= 0)
    `);
    console.log('✅ Added layer1 active addresses positive constraint');
    
    // Add bitcoin dominance range constraint
    await client.query(`
      ALTER TABLE bitcoin_dominance 
      ADD CONSTRAINT IF NOT EXISTS bitcoin_dominance_value_range_check 
      CHECK (value >= 0 AND value <= 100)
    `);
    console.log('✅ Added bitcoin dominance range constraint');
    
    // Add stablecoin metrics positive constraint
    await client.query(`
      ALTER TABLE stablecoin_metrics 
      ADD CONSTRAINT IF NOT EXISTS stablecoin_metrics_value_positive_check 
      CHECK (value IS NULL OR value >= 0)
    `);
    console.log('✅ Added stablecoin metrics positive constraint');
    
    // Add exchange flows positive constraint
    await client.query(`
      ALTER TABLE exchange_flows 
      ADD CONSTRAINT IF NOT EXISTS exchange_flows_amount_positive_check 
      CHECK (amount IS NULL OR amount >= 0)
    `);
    console.log('✅ Added exchange flows positive constraint');
    
    // Add inflation data constraints
    await client.query(`
      ALTER TABLE inflation_data 
      ADD CONSTRAINT IF NOT EXISTS inflation_data_value_range_check 
      CHECK (value IS NULL OR (value >= -50 AND value <= 50))
    `);
    console.log('✅ Added inflation data value range constraint');
    
    await client.query(`
      ALTER TABLE inflation_data 
      ADD CONSTRAINT IF NOT EXISTS inflation_data_core_value_range_check 
      CHECK (core_value IS NULL OR (core_value >= -50 AND core_value <= 50))
    `);
    console.log('✅ Added inflation data core value range constraint');
    
    // Add economic data constraints
    await client.query(`
      ALTER TABLE economic_data 
      ADD CONSTRAINT IF NOT EXISTS economic_data_value_range_check 
      CHECK (value IS NULL OR (value >= -1000 AND value <= 1000))
    `);
    console.log('✅ Added economic data value range constraint');
    
    // Add upcoming events date constraint
    await client.query(`
      ALTER TABLE upcoming_events 
      ADD CONSTRAINT IF NOT EXISTS upcoming_events_date_future_check 
      CHECK (date >= CURRENT_DATE - INTERVAL '1 year')
    `);
    console.log('✅ Added upcoming events date constraint');
    
    // Add API usage constraints
    await client.query(`
      ALTER TABLE api_usage 
      ADD CONSTRAINT IF NOT EXISTS api_usage_timestamp_recent_check 
      CHECK (timestamp >= CURRENT_TIMESTAMP - INTERVAL '1 year')
    `);
    console.log('✅ Added API usage timestamp constraint');
    
    // Add alert constraints
    await client.query(`
      ALTER TABLE alerts 
      ADD CONSTRAINT IF NOT EXISTS alerts_timestamp_recent_check 
      CHECK (timestamp >= CURRENT_TIMESTAMP - INTERVAL '1 year')
    `);
    console.log('✅ Added alerts timestamp constraint');
    
    // Add user alert thresholds constraints
    await client.query(`
      ALTER TABLE user_alert_thresholds 
      ADD CONSTRAINT IF NOT EXISTS user_alert_thresholds_value_range_check 
      CHECK (value >= -1000 AND value <= 1000)
    `);
    console.log('✅ Added user alert thresholds value range constraint');
    
    // Add derivatives data constraints
    await client.query(`
      ALTER TABLE derivatives_data 
      ADD CONSTRAINT IF NOT EXISTS derivatives_data_open_interest_positive_check 
      CHECK (open_interest IS NULL OR open_interest >= 0)
    `);
    console.log('✅ Added derivatives open interest positive constraint');
    
    await client.query(`
      ALTER TABLE derivatives_data 
      ADD CONSTRAINT IF NOT EXISTS derivatives_data_volume_positive_check 
      CHECK (volume_24h IS NULL OR volume_24h >= 0)
    `);
    console.log('✅ Added derivatives volume positive constraint');
    
    await client.query(`
      ALTER TABLE derivatives_data 
      ADD CONSTRAINT IF NOT EXISTS derivatives_data_funding_rate_range_check 
      CHECK (funding_rate IS NULL OR (funding_rate >= -1 AND funding_rate <= 1))
    `);
    console.log('✅ Added derivatives funding rate range constraint');
    
    // Add onchain data constraints
    await client.query(`
      ALTER TABLE onchain_data 
      ADD CONSTRAINT IF NOT EXISTS onchain_data_value_positive_check 
      CHECK (value IS NULL OR value >= 0)
    `);
    console.log('✅ Added onchain data value positive constraint');
    
    // Add market sentiment constraints
    await client.query(`
      ALTER TABLE market_sentiment 
      ADD CONSTRAINT IF NOT EXISTS market_sentiment_value_range_check 
      CHECK (value IS NULL OR (value >= -1 AND value <= 1))
    `);
    console.log('✅ Added market sentiment value range constraint');
    
    console.log('🎉 All data integrity constraints added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding constraints:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if called directly
if (require.main === module) {
  addDataConstraints()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addDataConstraints };