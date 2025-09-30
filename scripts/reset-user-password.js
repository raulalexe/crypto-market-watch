#!/usr/bin/env node

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Railway production database URL
const DATABASE_URL = process.env.DATABASE_URL;

async function resetUserPassword() {
  console.log('🔐 Resetting password for raul@palm-tree-tech.xyz...\n');

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to production database');

    // Generate new password hash
    const newPassword = 'Password123'; // New password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('📝 Generated new password hash:');
    console.log(`   New password: ${newPassword}`);
    console.log(`   Hash length: ${newPasswordHash.length}`);
    console.log(`   Hash prefix: ${newPasswordHash.substring(0, 10)}...`);

    // Update user's password
    console.log('\n🔄 Updating user password...');
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
      
      console.log('\n🎉 Password reset completed!');
      console.log('📝 New login credentials:');
      console.log(`   Email: raul@palm-tree-tech.xyz`);
      console.log(`   Password: ${newPassword}`);
      console.log('\n🔧 You can now log in with these credentials');
      
    } else {
      console.log('❌ Failed to update password - user not found');
    }

    await client.release();
    console.log('\n✅ Password reset completed');

  } catch (error) {
    console.log('❌ Password reset failed:', error.message);
    console.log('📝 Error details:', error);
  } finally {
    await pool.end();
  }
}

// Run the reset
resetUserPassword().catch(console.error);
