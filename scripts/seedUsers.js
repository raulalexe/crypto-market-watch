require('dotenv').config();
const bcrypt = require('bcrypt');
const { insertUser, insertSubscription, getUserByEmail, updateUser } = require('../server/database');

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
    console.log('🌱 Starting user seeding...');
    
    // Hash passwords
    const saltRounds = 10;
    const adminPassword = await bcrypt.hash('admin123', saltRounds);
    const proPassword = await bcrypt.hash('pro123', saltRounds);
    const freePassword = await bcrypt.hash('free123', saltRounds);
    
    // Create or update admin user
    console.log('👑 Processing admin user...');
    const adminUserId = await createOrUpdateUser('admin@cryptomarket.com', adminPassword, true);
    console.log(`✅ Admin user ready with ID: ${adminUserId}`);
    
    // Create or update pro user
    console.log('💎 Processing pro user...');
    const proUserId = await createOrUpdateUser('pro@cryptomarket.com', proPassword, false);
    console.log(`✅ Pro user ready with ID: ${proUserId}`);
    
    // Create or update free user
    console.log('🆓 Processing free user...');
    const freeUserId = await createOrUpdateUser('free@cryptomarket.com', freePassword, false);
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
    console.log('👑 Admin: admin@cryptomarket.com / admin123');
    console.log('💎 Pro: pro@cryptomarket.com / pro123');
    console.log('🆓 Free: free@cryptomarket.com / free123');
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  }
}

seedUsers();
