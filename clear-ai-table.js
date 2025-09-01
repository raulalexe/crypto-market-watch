const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Create PostgreSQL connection
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function clearAITable() {
  try {
    console.log('🧹 Clearing AI analysis table...');
    
    await db.query('DELETE FROM ai_analysis');
    console.log('✅ AI analysis table cleared');

    await db.query('DELETE FROM backtest_results');
    console.log('✅ Backtest results table cleared');

  } catch (error) {
    console.error('❌ Error clearing tables:', error.message);
  } finally {
    await db.end();
    console.log('✅ Database connection closed');
  }
}

clearAITable();
