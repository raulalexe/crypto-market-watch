const { dbAdapter } = require('../../database');

async function createCryptoEventsTable() {
  try {
    console.log('🔄 Creating crypto_events table...');
    
    await dbAdapter.run(`
      CREATE TABLE IF NOT EXISTS crypto_events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        content TEXT,
        url VARCHAR(1000),
        published_at TIMESTAMP NOT NULL,
        source VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        
        -- AI Analysis fields
        significance DECIMAL(3,2) CHECK (significance >= 0 AND significance <= 1),
        market_impact DECIMAL(3,2) CHECK (market_impact >= 0 AND market_impact <= 1),
        confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
        price_impact VARCHAR(20) CHECK (price_impact IN ('bullish', 'bearish', 'neutral')),
        affected_cryptos JSON,
        key_points JSON,
        
        -- Impact score for sorting: (market_impact*2 + confidence)/3
        impact_score DECIMAL(3,2),
        
        -- Metadata
        detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Creating crypto_events indexes...');
    
    // Indexes for efficient querying
    await dbAdapter.run(`
      CREATE INDEX IF NOT EXISTS idx_crypto_events_detected_at ON crypto_events(detected_at DESC);
    `);
    
    await dbAdapter.run(`
      CREATE INDEX IF NOT EXISTS idx_crypto_events_impact_score ON crypto_events(impact_score DESC);
    `);
    
    await dbAdapter.run(`
      CREATE INDEX IF NOT EXISTS idx_crypto_events_published_at ON crypto_events(published_at DESC);
    `);
    
    await dbAdapter.run(`
      CREATE INDEX IF NOT EXISTS idx_crypto_events_source ON crypto_events(source);
    `);
    
    await dbAdapter.run(`
      CREATE INDEX IF NOT EXISTS idx_crypto_events_category ON crypto_events(category);
    `);
    
    console.log('✅ Successfully created crypto_events table and indexes');
    
  } catch (error) {
    console.error('❌ Error creating crypto_events table:', error.message);
    throw error;
  }
}

module.exports = createCryptoEventsTable;
