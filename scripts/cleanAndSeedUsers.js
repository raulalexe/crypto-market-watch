require('dotenv').config();
const bcrypt = require('bcrypt');
const { insertUser, insertSubscription, getUserByEmail, updateUser } = require('../server/database');

async function cleanExistingUsers() {
  try {
    console.log('🧹 Cleaning existing users...');
    
    // Get database connection
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('./data/market_data.db');
    
    // Delete existing users and their subscriptions
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM subscriptions WHERE user_id IN (SELECT id FROM users WHERE email LIKE "%@cryptomarket.com")', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE email LIKE "%@cryptomarket.com"', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    db.close();
    console.log('✅ Existing users cleaned');
  } catch (error) {
    console.error('❌ Error cleaning users:', error);
    throw error;
  }
}

async function createOrUpdateUser(email, password, isAdmin = false) {
  try {
    // Check if user exists
    const existingUser = await getUserByEmail(email);
    
    if (existingUser) {
      console.log(`🔄 User ${email} already exists, updating...`);
      // Update password and admin status
      await updateUser(existingUser.id, {
        password_hash: password,
        is_admin: isAdmin ? 1 : 0
      });
      return existingUser.id;
    } else {
      console.log(`➕ Creating new user ${email}...`);
      const userId = await insertUser(email, password, isAdmin);
      return userId;
    }
  } catch (error) {
    console.error(`❌ Error with user ${email}:`, error.message);
    throw error;
  }
}

async function seedUsers() {
  try {
    console.log('🌱 Starting user seeding with @cryptowatch.com emails...');
    
    // Hash passwords
    const saltRounds = 10;
    const adminPassword = await bcrypt.hash('admin123', saltRounds);
    const proPassword = await bcrypt.hash('pro123', saltRounds);
    const freePassword = await bcrypt.hash('free123', saltRounds);
    
    // Create or update admin user
    console.log('👑 Processing admin user...');
    const adminUserId = await createOrUpdateUser('admin@cryptowatch.com', adminPassword, true);
    console.log(`✅ Admin user ready with ID: ${adminUserId}`);
    
    // Create or update pro user
    console.log('💎 Processing pro user...');
    const proUserId = await createOrUpdateUser('pro@cryptowatch.com', proPassword, false);
    console.log(`✅ Pro user ready with ID: ${proUserId}`);
    
    // Create or update free user
    console.log('🆓 Processing free user...');
    const freeUserId = await createOrUpdateUser('free@cryptowatch.com', freePassword, false);
    console.log(`✅ Free user ready with ID: ${freeUserId}`);
    
    // Create pro subscription
    console.log('💎 Creating pro subscription...');
    const proSubscription = {
      user_id: proUserId,
      plan_type: 'pro',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    };
    await insertSubscription(proSubscription);
    console.log('✅ Pro subscription created');
    
    console.log('\n🎉 User seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('👑 Admin: admin@cryptowatch.com / admin123');
    console.log('💎 Pro: pro@cryptowatch.com / pro123');
    console.log('🆓 Free: free@cryptowatch.com / free123');
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  }
}

async function main() {
  try {
    // First clean existing users
    await cleanExistingUsers();
    
    // Then seed new users
    await seedUsers();
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  }
}

main();
