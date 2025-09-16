/**
 * Password Reset Script
 * Resets password for a specific user by email
 * 
 * Usage: node scripts/resetPasswords.js <email> <password>
 * Example: node scripts/resetPasswords.js admin@example.com newpassword123
 * 
 * This script requires both email and password to be provided.
 * It will update the password for the specified user if they exist.
 */

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


// Check if specific user email and password are provided
const userEmail = process.argv[2];
const newPassword = process.argv[3];

if (userEmail && newPassword) {
  resetPassword(userEmail, newPassword);
} else {
  console.log('❌ Missing required parameters');
  console.log('Usage: node scripts/resetPasswords.js <email> <password>');
  console.log('Example: node scripts/resetPasswords.js admin@example.com newpassword123');
  process.exit(1);
}
