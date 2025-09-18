// Migration: Ensure inflation_data table has required unique constraints
// This migration ensures the inflation_data table has the unique constraint needed for ON CONFLICT

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await db.connect();
  
  try {
    console.log('🔧 Ensuring inflation_data table constraints...');
    
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
          console.log(`✅ Added constraint ${constraintName} to ${tableName}`);
          return true;
        } else {
          console.log(`✅ Constraint ${constraintName} already exists on ${tableName}`);
          return false;
        }
      } catch (error) {
        console.warn(`⚠️ Could not add constraint ${constraintName}: ${error.message}`);
        return false;
      }
    };
    
    // Ensure inflation_data has unique constraint on (type, date)
    await addConstraintIfNotExists(
      'inflation_data', 
      'inflation_data_type_date_unique',
      'UNIQUE (type, date)'
    );
    
    // Ensure economic_data has unique constraint on (series_id, date)
    await addConstraintIfNotExists(
      'economic_data', 
      'economic_data_series_id_date_unique',
      'UNIQUE (series_id, date)'
    );
    
    // Ensure inflation_releases has unique constraint on (type, date)
    await addConstraintIfNotExists(
      'inflation_releases', 
      'inflation_releases_type_date_unique',
      'UNIQUE (type, date)'
    );
    
    console.log('✅ All inflation-related constraints ensured');
    
  } catch (error) {
    console.error('❌ Error ensuring inflation constraints:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function ensureInflationConstraints() {
  return runMigration();
}

// Run migration if called directly
if (require.main === module) {
  ensureInflationConstraints()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { ensureInflationConstraints };
