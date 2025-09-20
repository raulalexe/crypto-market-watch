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
    
    // Helper function to add constraint if it doesn't exist
    const addConstraintIfNotExists = async (tableName, constraintName, constraintSQL) => {
      try {
        // Check if constraint already exists
        const result = await client.query(`
          SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE table_name = $1 AND constraint_name = $2
        `, [tableName, constraintName]);
        
        if (result.rows.length === 0) {
          await client.query(`ALTER TABLE ${tableName} ADD CONSTRAINT ${constraintName} ${constraintSQL}`);
          return true;
        }
        return false;
      } catch (error) {
        console.warn(`⚠️ Could not add constraint ${constraintName}: ${error.message}`);
        return false;
      }
    };
    
    // Add email format constraint to users table
    const emailConstraintAdded = await addConstraintIfNotExists(
      'users', 
      'users_email_format_check',
      `CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')`
    );
    if (emailConstraintAdded) console.log('✅ Added email format constraint to users table');
    
    // Add password hash length constraint
    const passwordConstraintAdded = await addConstraintIfNotExists(
      'users', 
      'users_password_hash_length_check',
      'CHECK (length(password_hash) >= 60)'
    );
    if (passwordConstraintAdded) console.log('✅ Added password hash length constraint');
    
    // Add positive value constraints to market data
    const marketDataConstraintAdded = await addConstraintIfNotExists(
      'market_data', 
      'market_data_value_positive_check',
      'CHECK (value IS NULL OR value >= 0)'
    );
    if (marketDataConstraintAdded) console.log('✅ Added positive value constraint to market_data');
    
    // Add fear greed index range constraint
    const fearGreedConstraintAdded = await addConstraintIfNotExists(
      'fear_greed_index', 
      'fear_greed_index_value_range_check',
      'CHECK (value >= 0 AND value <= 100)'
    );
    if (fearGreedConstraintAdded) console.log('✅ Added fear greed index range constraint');
    
    // Add crypto prices positive constraints
    const cryptoPriceConstraintAdded = await addConstraintIfNotExists(
      'crypto_prices', 
      'crypto_prices_price_positive_check',
      'CHECK (price > 0)'
    );
    if (cryptoPriceConstraintAdded) console.log('✅ Added crypto prices positive constraint');
    
    const cryptoVolumeConstraintAdded = await addConstraintIfNotExists(
      'crypto_prices', 
      'crypto_prices_volume_positive_check',
      'CHECK (volume_24h IS NULL OR volume_24h >= 0)'
    );
    if (cryptoVolumeConstraintAdded) console.log('✅ Added crypto volume positive constraint');
    
    const cryptoMarketCapConstraintAdded = await addConstraintIfNotExists(
      'crypto_prices', 
      'crypto_prices_market_cap_positive_check',
      'CHECK (market_cap IS NULL OR market_cap >= 0)'
    );
    if (cryptoMarketCapConstraintAdded) console.log('✅ Added crypto market cap positive constraint');
    
    // Add AI analysis confidence range constraint (0-100 to handle both decimal and percentage formats)
    const aiConfidenceConstraintAdded = await addConstraintIfNotExists(
      'ai_analysis', 
      'ai_analysis_confidence_range_check',
      'CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 100))'
    );
    if (aiConfidenceConstraintAdded) console.log('✅ Added AI analysis confidence range constraint');
    
    // Add layer1 data positive constraints
    const layer1PriceConstraintAdded = await addConstraintIfNotExists(
      'layer1_data', 
      'layer1_data_price_positive_check',
      'CHECK (price > 0)'
    );
    if (layer1PriceConstraintAdded) console.log('✅ Added layer1 price positive constraint');
    
    const layer1TpsConstraintAdded = await addConstraintIfNotExists(
      'layer1_data', 
      'layer1_data_tps_positive_check',
      'CHECK (tps >= 0)'
    );
    if (layer1TpsConstraintAdded) console.log('✅ Added layer1 TPS positive constraint');
    
    const layer1AddressesConstraintAdded = await addConstraintIfNotExists(
      'layer1_data', 
      'layer1_data_active_addresses_positive_check',
      'CHECK (active_addresses >= 0)'
    );
    if (layer1AddressesConstraintAdded) console.log('✅ Added layer1 active addresses positive constraint');
    
    // Add bitcoin dominance range constraint
    const btcDominanceConstraintAdded = await addConstraintIfNotExists(
      'bitcoin_dominance', 
      'bitcoin_dominance_value_range_check',
      'CHECK (value >= 0 AND value <= 100)'
    );
    if (btcDominanceConstraintAdded) console.log('✅ Added bitcoin dominance range constraint');
    
    // Add stablecoin metrics positive constraint
    const stablecoinConstraintAdded = await addConstraintIfNotExists(
      'stablecoin_metrics', 
      'stablecoin_metrics_value_positive_check',
      'CHECK (value IS NULL OR value >= 0)'
    );
    if (stablecoinConstraintAdded) console.log('✅ Added stablecoin metrics positive constraint');
    
    // Add exchange flows positive constraint
    const exchangeFlowsConstraintAdded = await addConstraintIfNotExists(
      'exchange_flows', 
      'exchange_flows_amount_positive_check',
      'CHECK (amount IS NULL OR amount >= 0)'
    );
    if (exchangeFlowsConstraintAdded) console.log('✅ Added exchange flows positive constraint');
    
    // Add inflation data constraints (more reasonable ranges)
    const inflationValueConstraintAdded = await addConstraintIfNotExists(
      'inflation_data', 
      'inflation_data_value_range_check',
      'CHECK (value IS NULL OR (value >= -1000 AND value <= 1000))'
    );
    if (inflationValueConstraintAdded) console.log('✅ Added inflation data value range constraint');
    
    const inflationCoreConstraintAdded = await addConstraintIfNotExists(
      'inflation_data', 
      'inflation_data_core_value_range_check',
      'CHECK (core_value IS NULL OR (core_value >= -1000 AND core_value <= 1000))'
    );
    if (inflationCoreConstraintAdded) console.log('✅ Added inflation data core value range constraint');
    
    // Add economic data constraints (more reasonable ranges)
    const economicDataConstraintAdded = await addConstraintIfNotExists(
      'economic_data', 
      'economic_data_value_range_check',
      'CHECK (value IS NULL OR (value >= -1000000 AND value <= 1000000))'
    );
    if (economicDataConstraintAdded) console.log('✅ Added economic data value range constraint');
    
    // Add upcoming events date constraint
    const eventsDateConstraintAdded = await addConstraintIfNotExists(
      'upcoming_events', 
      'upcoming_events_date_future_check',
      'CHECK (date >= CURRENT_DATE - INTERVAL \'1 year\')'
    );
    if (eventsDateConstraintAdded) console.log('✅ Added upcoming events date constraint');
    
    // Add API usage constraints
    const apiUsageConstraintAdded = await addConstraintIfNotExists(
      'api_usage', 
      'api_usage_timestamp_recent_check',
      'CHECK (timestamp >= CURRENT_TIMESTAMP - INTERVAL \'1 year\')'
    );
    if (apiUsageConstraintAdded) console.log('✅ Added API usage timestamp constraint');
    
    // Add alert constraints
    const alertsConstraintAdded = await addConstraintIfNotExists(
      'alerts', 
      'alerts_timestamp_recent_check',
      'CHECK (timestamp >= CURRENT_TIMESTAMP - INTERVAL \'1 year\')'
    );
    if (alertsConstraintAdded) console.log('✅ Added alerts timestamp constraint');
    
    // Add user alert thresholds constraints
    const alertThresholdsConstraintAdded = await addConstraintIfNotExists(
      'user_alert_thresholds', 
      'user_alert_thresholds_value_range_check',
      'CHECK (value >= -1000 AND value <= 1000)'
    );
    if (alertThresholdsConstraintAdded) console.log('✅ Added user alert thresholds value range constraint');
    
    // Add derivatives data constraints
    const derivativesOpenInterestConstraintAdded = await addConstraintIfNotExists(
      'derivatives_data', 
      'derivatives_data_open_interest_positive_check',
      'CHECK (open_interest IS NULL OR open_interest >= 0)'
    );
    if (derivativesOpenInterestConstraintAdded) console.log('✅ Added derivatives open interest positive constraint');
    
    const derivativesVolumeConstraintAdded = await addConstraintIfNotExists(
      'derivatives_data', 
      'derivatives_data_volume_positive_check',
      'CHECK (volume_24h IS NULL OR volume_24h >= 0)'
    );
    if (derivativesVolumeConstraintAdded) console.log('✅ Added derivatives volume positive constraint');
    
    const derivativesFundingConstraintAdded = await addConstraintIfNotExists(
      'derivatives_data', 
      'derivatives_data_funding_rate_range_check',
      'CHECK (funding_rate IS NULL OR (funding_rate >= -1 AND funding_rate <= 1))'
    );
    if (derivativesFundingConstraintAdded) console.log('✅ Added derivatives funding rate range constraint');
    
    // Add onchain data constraints
    const onchainDataConstraintAdded = await addConstraintIfNotExists(
      'onchain_data', 
      'onchain_data_value_positive_check',
      'CHECK (value IS NULL OR value >= 0)'
    );
    if (onchainDataConstraintAdded) console.log('✅ Added onchain data value positive constraint');
    
    // Add market sentiment constraints (more reasonable ranges)
    const marketSentimentConstraintAdded = await addConstraintIfNotExists(
      'market_sentiment', 
      'market_sentiment_value_range_check',
      'CHECK (value IS NULL OR (value >= -1000 AND value <= 1000))'
    );
    if (marketSentimentConstraintAdded) console.log('✅ Added market sentiment value range constraint');
    
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