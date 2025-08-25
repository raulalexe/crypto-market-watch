const bcrypt = require('bcrypt');
const { insertUser } = require('../server/database');

async function createAdminUser() {
  try {
    const email = process.argv[2];
    const password = process.argv[3];
    
    if (!email || !password) {
      console.error('Usage: node createAdmin.js <email> <password>');
      process.exit(1);
    }
    
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create admin user
    const userId = await insertUser(email, passwordHash, true);
    
    console.log(`✅ Admin user created successfully!`);
    console.log(`Email: ${email}`);
    console.log(`User ID: ${userId}`);
    console.log(`Admin privileges: Enabled`);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

// Initialize database and create admin
const { initDatabase } = require('../server/database');

initDatabase()
  .then(() => {
    console.log('Database initialized');
    return createAdminUser();
  })
  .then(() => {
    console.log('Admin user creation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  });
