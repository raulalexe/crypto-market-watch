const { dbAdapter } = require('../../database');

async function addCryptoNewsNotificationColumns() {
  try {
    console.log('🔄 Adding crypto news notification columns to users table...');
    
    // Add new columns for crypto news notifications
    await dbAdapter.run(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS crypto_news_notifications BOOLEAN DEFAULT TRUE
    `);
    
    await dbAdapter.run(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS crypto_news_channels TEXT DEFAULT '["email","push","telegram"]'
    `);
    
    await dbAdapter.run(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS crypto_news_impact_filter VARCHAR(20) DEFAULT 'medium'
    `);
    
    console.log('✅ Successfully added crypto news notification columns');
    
    // Update existing users to have default crypto news notification settings
    await dbAdapter.run(`
      UPDATE users 
      SET crypto_news_notifications = TRUE,
          crypto_news_channels = '["email","push","telegram"]',
          crypto_news_impact_filter = 'medium'
      WHERE crypto_news_notifications IS NULL
    `);
    
    console.log('✅ Updated existing users with default crypto news notification settings');
    
  } catch (error) {
    console.error('❌ Error adding crypto news notification columns:', error);
    throw error;
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  addCryptoNewsNotificationColumns()
    .then(() => {
      console.log('🎉 Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addCryptoNewsNotificationColumns;
