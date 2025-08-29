require('dotenv').config();
const bcrypt = require('bcrypt');
const { getUserByEmail, updateUser } = require('../server/database');

async function resetPassword(email, newPassword) {
  try {
    console.log(`🔄 Resetting password for ${email}...`);
    
    // Check if user exists
    const user = await getUserByEmail(email);
    if (!user) {
      console.log(`❌ User ${email} not found`);
      return false;
    }
    
    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password
    await updateUser(user.id, {
      password_hash: hashedPassword
    });
    
    console.log(`✅ Password reset successfully for ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Error resetting password for ${email}:`, error.message);
    return false;
  }
}

async function resetAllPasswords() {
  try {
    console.log('🔐 Resetting all user passwords...');
    
    const users = [
      { email: 'admin@cryptowatch.com', password: 'admin123' },
      { email: 'pro@cryptowatch.com', password: 'pro123' },
      { email: 'free@cryptowatch.com', password: 'free123' }
    ];
    
    for (const user of users) {
      await resetPassword(user.email, user.password);
    }
    
    console.log('\n🎉 All passwords reset successfully!');
    console.log('\n📋 Updated Login Credentials:');
    console.log('👑 Admin: admin@cryptowatch.com / admin123');
    console.log('💎 Pro: pro@cryptowatch.com / pro123');
    console.log('🆓 Free: free@cryptowatch.com / free123');
    
  } catch (error) {
    console.error('❌ Error resetting passwords:', error);
  }
}

// Check if specific user email is provided
const userEmail = process.argv[2];
const newPassword = process.argv[3];

if (userEmail && newPassword) {
  resetPassword(userEmail, newPassword);
} else {
  resetAllPasswords();
}
