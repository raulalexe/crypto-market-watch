const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data/market_data.db');
const db = new sqlite3.Database(dbPath);

async function clearAITable() {
  try {
    console.log('🧹 Clearing AI analysis table...');
    
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM ai_analysis', (err) => {
        if (err) {
          console.error('Error clearing ai_analysis table:', err);
          reject(err);
        } else {
          console.log('✅ AI analysis table cleared');
          resolve();
        }
      });
    });

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM backtest_results', (err) => {
        if (err) {
          console.error('Error clearing backtest_results table:', err);
          reject(err);
        } else {
          console.log('✅ Backtest results table cleared');
          resolve();
        }
      });
    });

  } catch (error) {
    console.error('❌ Error clearing tables:', error.message);
  } finally {
    db.close();
    console.log('✅ Database connection closed');
  }
}

clearAITable();
