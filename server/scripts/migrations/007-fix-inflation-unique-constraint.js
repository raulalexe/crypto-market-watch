// Migration 007: Fix inflation data unique constraint
// This fixes the ON CONFLICT error by ensuring the unique constraint exists

const migrationId = 'fix-inflation-unique-constraint-007';

async function up(pool) {
  try {
    console.log('🔧 Migration 007: Fixing inflation data unique constraint...');
    
    // Check if constraint already exists
    const constraintCheck = await pool.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'inflation_data' 
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'inflation_data_type_date_unique'
    `);
    
    if (constraintCheck.rows.length > 0) {
      console.log('✅ Unique constraint already exists');
      return;
    }
    
    console.log('⚠️ Unique constraint missing, creating it...');
    
    // First, clean up any existing duplicates
    console.log('🧹 Cleaning up duplicate inflation data entries...');
    
    const duplicateCheck = await pool.query(`
      SELECT type, date, COUNT(*) as count
      FROM inflation_data 
      GROUP BY type, date 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicateCheck.rows.length > 0) {
      console.log(`⚠️ Found ${duplicateCheck.rows.length} duplicate combinations, removing older entries...`);
      
      // Remove duplicates, keeping the most recent (highest id)
      await pool.query(`
        DELETE FROM inflation_data 
        WHERE id NOT IN (
          SELECT MAX(id) 
          FROM inflation_data 
          GROUP BY type, date
        )
      `);
      
      console.log('✅ Duplicate entries removed');
    }
    
    // Add the unique constraint
    await pool.query(`
      ALTER TABLE inflation_data 
      ADD CONSTRAINT inflation_data_type_date_unique UNIQUE (type, date)
    `);
    
    console.log('✅ Unique constraint added successfully');
    
    // Test the constraint works
    console.log('🧪 Testing ON CONFLICT functionality...');
    
    try {
      // Insert a test record
      await pool.query(`
        INSERT INTO inflation_data (type, date, value, core_value, yoy_change, core_yoy_change, source, created_at)
        VALUES ('TEST', '2024-01-01', 100.0, 101.0, 2.5, 2.3, 'TEST', CURRENT_TIMESTAMP)
        ON CONFLICT (type, date) DO UPDATE SET
          value = EXCLUDED.value,
          source = EXCLUDED.source,
          created_at = CURRENT_TIMESTAMP
      `);
      
      // Try to insert the same record again (should update, not error)
      await pool.query(`
        INSERT INTO inflation_data (type, date, value, core_value, yoy_change, core_yoy_change, source, created_at)
        VALUES ('TEST', '2024-01-01', 102.0, 103.0, 2.6, 2.4, 'TEST_UPDATED', CURRENT_TIMESTAMP)
        ON CONFLICT (type, date) DO UPDATE SET
          value = EXCLUDED.value,
          source = EXCLUDED.source,
          created_at = CURRENT_TIMESTAMP
      `);
      
      console.log('✅ ON CONFLICT clause working correctly');
      
      // Clean up test data
      await pool.query(`DELETE FROM inflation_data WHERE type = 'TEST'`);
      console.log('✅ Test data cleaned up');
      
    } catch (testError) {
      console.error('❌ Constraint test failed:', testError.message);
      // Don't fail the migration for test issues
    }
    
    console.log('🎉 Migration 007 completed: Inflation data constraint fixed!');
    
  } catch (error) {
    console.error('❌ Migration 007 failed:', error.message);
    throw error; // Re-throw to mark migration as failed
  }
}

async function down(pool) {
  try {
    console.log('🔄 Rolling back migration 007: Removing inflation data unique constraint...');
    
    await pool.query(`
      ALTER TABLE inflation_data 
      DROP CONSTRAINT IF EXISTS inflation_data_type_date_unique
    `);
    
    console.log('✅ Migration 007 rollback completed');
  } catch (error) {
    console.error('❌ Migration 007 rollback failed:', error.message);
    throw error;
  }
}

module.exports = {
  id: migrationId,
  description: 'Fix inflation data unique constraint for ON CONFLICT clause',
  up,
  down
};
