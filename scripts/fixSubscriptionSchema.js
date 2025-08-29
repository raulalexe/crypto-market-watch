require('dotenv').config();
const { db } = require('../server/database');

async function fixSubscriptionSchema() {
  try {
    console.log('🔧 Fixing subscription schema...');
    
    // Check if plan_id column exists and plan_type doesn't
    db.get("PRAGMA table_info(subscriptions)", (err, rows) => {
      if (err) {
        console.error('Error checking table schema:', err);
        return;
      }
      
      console.log('Current subscription table columns:', rows);
      
      // Add plan_type column if it doesn't exist
      db.run("ALTER TABLE subscriptions ADD COLUMN plan_type TEXT", (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding plan_type column:', err);
          return;
        }
        
        console.log('✅ plan_type column added (or already exists)');
        
        // Copy data from plan_id to plan_type
        db.run("UPDATE subscriptions SET plan_type = plan_id WHERE plan_type IS NULL AND plan_id IS NOT NULL", (err) => {
          if (err) {
            console.error('Error copying data:', err);
            return;
          }
          
          console.log('✅ Data copied from plan_id to plan_type');
          
          // Drop plan_id column
          db.run("ALTER TABLE subscriptions DROP COLUMN plan_id", (err) => {
            if (err) {
              console.error('Error dropping plan_id column:', err);
              return;
            }
            
            console.log('✅ plan_id column dropped');
            console.log('🎉 Subscription schema fixed successfully!');
            
            // Verify the fix
            db.get("SELECT * FROM subscriptions LIMIT 1", (err, row) => {
              if (err) {
                console.error('Error verifying fix:', err);
                return;
              }
              
              console.log('📋 Sample subscription data:', row);
              process.exit(0);
            });
          });
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Error fixing subscription schema:', error);
    process.exit(1);
  }
}

fixSubscriptionSchema();
