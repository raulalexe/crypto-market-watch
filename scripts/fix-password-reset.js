#!/usr/bin/env node

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Railway production database URL
const DATABASE_URL = process.env.DATABASE_URL;

async function fixPasswordReset() {
  console.log('🔐 Fixing password reset for raul@palm-tree-tech.xyz...\n');

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to production database');

    // Get current user info
    const userResult = await client.query(`
      SELECT id, email, password_hash, updated_at
      FROM users 
      WHERE email = $1
    `, ['raul@palm-tree-tech.xyz']);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = userResult.rows[0];
    console.log('📝 Current user info:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current hash: ${user.password_hash.substring(0, 20)}...`);
    console.log(`   Updated: ${user.updated_at}`);

    // Test current password
    console.log('\n🔍 Testing current password...');
    const currentPasswordValid = await bcrypt.compare('Password123', user.password_hash);
    console.log(`   "Password123" is valid: ${currentPasswordValid}`);

    // Generate a completely new password hash
    console.log('\n🔄 Generating new password hash...');
    const newPassword = 'NewPassword123';
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    
    console.log(`   New password: ${newPassword}`);
    console.log(`   New hash: ${newPasswordHash.substring(0, 20)}...`);

    // Update the password
    console.log('\n💾 Updating password in database...');
    const updateResult = await client.query(`
      UPDATE users 
      SET password_hash = $1, updated_at = NOW()
      WHERE email = $2
      RETURNING id, email, updated_at
    `, [newPasswordHash, 'raul@palm-tree-tech.xyz']);
    
    if (updateResult.rows.length > 0) {
      const updatedUser = updateResult.rows[0];
      console.log('✅ Password updated successfully:');
      console.log(`   User ID: ${updatedUser.id}`);
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Updated: ${updatedUser.updated_at}`);
      
      // Verify the new password works
      console.log('\n✅ Verifying new password...');
      const newPasswordValid = await bcrypt.compare(newPassword, newPasswordHash);
      console.log(`   New password "${newPassword}" is valid: ${newPasswordValid}`);
      
      console.log('\n🎉 Password reset completed!');
      console.log('📝 New login credentials:');
      console.log(`   Email: raul@palm-tree-tech.xyz`);
      console.log(`   Password: ${newPassword}`);
      console.log('\n🔧 You can now log in with these credentials');
      
    } else {
      console.log('❌ Failed to update password');
    }

    await client.release();
    console.log('\n✅ Password fix completed');

  } catch (error) {
    console.log('❌ Password fix failed:', error.message);
    console.log('📝 Error details:', error);
  } finally {
    await pool.end();
  }
}

// Run the fix
fixPasswordReset().catch(console.error);
