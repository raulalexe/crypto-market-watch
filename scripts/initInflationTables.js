require('dotenv').config();
const { db } = require('../server/database');

async function initInflationTables() {
  try {
    console.log('🗄️ Initializing inflation database tables...');
    
    // Create tables with promises
    const createTables = () => {
      return new Promise((resolve, reject) => {
        db.serialize(() => {
          // Create inflation_data table
          db.run(`
            CREATE TABLE IF NOT EXISTS inflation_data (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              type TEXT NOT NULL,
              date TEXT NOT NULL,
              value REAL,
              core_value REAL,
              yoy_change REAL,
              core_yoy_change REAL,
              source TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) {
              console.error('Error creating inflation_data table:', err);
              reject(err);
            } else {
              console.log('✅ inflation_data table created/verified');
            }
          });

          // Create inflation_releases table
          db.run(`
            CREATE TABLE IF NOT EXISTS inflation_releases (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              type TEXT NOT NULL,
              date TEXT NOT NULL,
              time TEXT,
              timezone TEXT,
              source TEXT,
              status TEXT DEFAULT 'scheduled',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(type, date)
            )
          `, (err) => {
            if (err) {
              console.error('Error creating inflation_releases table:', err);
              reject(err);
            } else {
              console.log('✅ inflation_releases table created/verified');
            }
          });

          // Create inflation_forecasts table
          db.run(`
            CREATE TABLE IF NOT EXISTS inflation_forecasts (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              type TEXT NOT NULL,
              forecast_data TEXT,
              confidence REAL,
              factors TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) {
              console.error('Error creating inflation_forecasts table:', err);
              reject(err);
            } else {
              console.log('✅ inflation_forecasts table created/verified');
              resolve();
            }
          });
        });
      });
    };

    await createTables();
    console.log('🎉 All inflation tables initialized successfully!');
    
    // Wait a moment for tables to be fully created
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test the tables by inserting some sample data
    console.log('🧪 Testing table functionality...');
    
    // Test inflation_releases table
    const testReleases = () => {
      return new Promise((resolve, reject) => {
        db.run(`
          INSERT OR REPLACE INTO inflation_releases (
            type, date, time, timezone, source, status
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, ['CPI', '2025-09-09', '08:30', 'America/New_York', 'BLS', 'scheduled'], (err) => {
          if (err) {
            console.error('Error testing inflation_releases table:', err);
            reject(err);
          } else {
            console.log('✅ inflation_releases table test successful');
            resolve();
          }
        });
      });
    };

    // Test inflation_data table
    const testData = () => {
      return new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO inflation_data (
            type, date, value, core_value, yoy_change, core_yoy_change, source
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, ['CPI', '2025-07-01', 322.132, 328.656, 3.1, 3.9, 'BLS'], (err) => {
          if (err) {
            console.error('Error testing inflation_data table:', err);
            reject(err);
          } else {
            console.log('✅ inflation_data table test successful');
            resolve();
          }
        });
      });
    };

    // Test inflation_forecasts table
    const testForecasts = () => {
      return new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO inflation_forecasts (
            type, forecast_data, confidence, factors
          ) VALUES (?, ?, ?, ?)
        `, ['CPI', JSON.stringify({forecast: 'Test forecast'}), 75.5, JSON.stringify({factors: ['test']})], (err) => {
          if (err) {
            console.error('Error testing inflation_forecasts table:', err);
            reject(err);
          } else {
            console.log('✅ inflation_forecasts table test successful');
            resolve();
          }
        });
      });
    };

    await Promise.all([testReleases(), testData(), testForecasts()]);
    console.log('🎉 All inflation tables tested successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing inflation tables:', error);
  }
}

// Run the initialization
initInflationTables();
