// Migration 008: Add missing crypto_news_notifications column to users table
// This fixes the notification system errors

const migrationId = 'add-crypto-news-notifications-column-008';

async function up(pool) {
  try {
    console.log('🔧 Migration 008: Adding crypto_news_notifications column to users table...');
    
    // Check if column already exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'crypto_news_notifications'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✅ crypto_news_notifications column already exists');
      return;
    }
    
    console.log('⚠️ crypto_news_notifications column missing, adding it...');
    
    // Add the missing column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN crypto_news_notifications BOOLEAN DEFAULT true
    `);
    
    console.log('✅ crypto_news_notifications column added successfully');
    
    // Update existing users to have notifications enabled by default
    const updateResult = await pool.query(`
      UPDATE users 
      SET crypto_news_notifications = true 
      WHERE crypto_news_notifications IS NULL
    `);
    
    console.log(`✅ Updated ${updateResult.rowCount} existing users with default notification setting`);
    
    // Verify the column was added correctly
    const verifyCheck = await pool.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'crypto_news_notifications'
    `);
    
    if (verifyCheck.rows.length > 0) {
      const column = verifyCheck.rows[0];
      console.log('✅ Column verification successful:');
      console.log(`   Name: ${column.column_name}`);
      console.log(`   Type: ${column.data_type}`);
      console.log(`   Default: ${column.column_default}`);
      console.log(`   Nullable: ${column.is_nullable}`);
    } else {
      throw new Error('Column verification failed - column not found after creation');
    }
    
    console.log('🎉 Migration 008 completed: Crypto news notifications enabled!');
    
  } catch (error) {
    console.error('❌ Migration 008 failed:', error.message);
    throw error; // Re-throw to mark migration as failed
  }
}

async function down(pool) {
  try {
    console.log('🔄 Rolling back migration 008: Removing crypto_news_notifications column...');
    
    await pool.query(`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS crypto_news_notifications
    `);
    
    console.log('✅ Migration 008 rollback completed');
  } catch (error) {
    console.error('❌ Migration 008 rollback failed:', error.message);
    throw error;
  }
}

module.exports = {
  id: migrationId,
  description: 'Add crypto_news_notifications column to users table for notification system',
  up,
  down
};
