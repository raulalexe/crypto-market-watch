const { Pool } = require('pg');

async function checkLayer1Data() {
  console.log('🔍 Checking Layer 1 data in database...');
  
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'crypto_market_watch',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });
  
  try {
    // Check if layer1_data table exists and has data
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'layer1_data'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ layer1_data table does not exist');
      return;
    }
    
    // Check table structure
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'layer1_data'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Table structure:');
    structure.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check if there's any data
    const countResult = await pool.query('SELECT COUNT(*) FROM layer1_data;');
    const totalCount = parseInt(countResult.rows[0].count);
    
    console.log(`\n📊 Total records: ${totalCount}`);
    
    if (totalCount === 0) {
      console.log('❌ No Layer 1 data found in database');
      console.log('\n🔧 This means:');
      console.log('  1. Data collection has never run');
      console.log('  2. Data collection failed');
      console.log('  3. Data was cleared/deleted');
      return;
    }
    
    // Get all Layer 1 data
    const layer1Data = await pool.query(`
      SELECT * FROM layer1_data ORDER BY market_cap DESC;
    `);
    
    console.log('\n⛓️ Layer 1 blockchain data:');
    layer1Data.rows.forEach(chain => {
      console.log(`\n  ${chain.name} (${chain.symbol}):`);
      console.log(`    Price: $${parseFloat(chain.price || 0).toFixed(2)}`);
      console.log(`    Change 24h: ${parseFloat(chain.change_24h || 0).toFixed(2)}%`);
      console.log(`    Market Cap: $${chain.market_cap ? (parseFloat(chain.market_cap) / 1e9).toFixed(2) + 'B' : 'N/A'}`);
      console.log(`    Volume 24h: $${chain.volume_24h ? (parseFloat(chain.volume_24h) / 1e6).toFixed(2) + 'M' : 'N/A'}`);
      console.log(`    TPS: ${parseFloat(chain.tps || 0).toFixed(0)}`);
      console.log(`    Active Addresses: ${chain.active_addresses ? (parseFloat(chain.active_addresses) / 1000).toFixed(1) + 'K' : 'N/A'}`);
      console.log(`    Hash Rate: ${chain.hash_rate ? (parseFloat(chain.hash_rate) / 1e9).toFixed(2) + ' GH/s' : 'N/A'}`);
      console.log(`    Dominance: ${parseFloat(chain.dominance || 0).toFixed(2)}%`);
      console.log(`    Narrative: ${chain.narrative || 'N/A'}`);
      console.log(`    Sentiment: ${chain.sentiment || 'N/A'}`);
      console.log(`    Last Updated: ${chain.timestamp}`);
    });
    
    // Check when data was last collected
    const lastCollection = await pool.query(`
      SELECT MAX(timestamp) as last_collection FROM layer1_data;
    `);
    
    const lastCollectionTime = lastCollection.rows[0].last_collection;
    if (lastCollectionTime) {
      const now = new Date();
      const timeDiff = now - new Date(lastCollectionTime);
      const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutesAgo = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      console.log(`\n⏰ Last data collection: ${lastCollectionTime}`);
      console.log(`   ${hoursAgo > 0 ? hoursAgo + ' hours' : ''} ${minutesAgo} minutes ago`);
      
      if (hoursAgo > 24) {
        console.log('⚠️  Warning: Data is more than 24 hours old');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking Layer 1 data:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

checkLayer1Data();
