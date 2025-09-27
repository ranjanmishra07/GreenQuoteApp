const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/**
 * Migration: Create Admin User and 10 Regular Users
 * Run this script to populate the database with test users
 */

async function createUsers() {
  try {
    // Register ts-node to handle TypeScript imports
    require('ts-node/register');
    
    // Import database connection
    const { createDatabaseConnection } = require('../src/database/connection');
    
    // Create and connect to database
    const db = createDatabaseConnection();
    await db.connect();
    console.log('✅ Database connection established');
    
    // Initialize models
    const { initModels } = require('../src/database/models');
    await initModels(db.getSequelize());
    console.log('✅ Models initialized');
    
    // Import User model after connection is established
    const { User } = require('../src/database/models');
    
    // Create admin user
    const adminSalt = await bcrypt.genSalt(12);
    const adminPasswordHash = await bcrypt.hash('admin123', adminSalt);
    
    const adminUser = await User.create({
      id: uuidv4(),
      fullName: 'System Administrator',
      email: 'admin@greenquote.com',
      passwordHash: adminPasswordHash,
      salt: adminSalt,
      roleName: 'ADMIN',
      address: '123 Admin Street, Admin City, AC 12345'
    });
    
    console.log('✅ Admin user created:', adminUser.email);
    
    // Create 10 regular users
    const regularUsers = [
      { name: 'Test User1', email: 'testuser1@gmail.com', address: '123 Main St, New York, NY 10001' },
      { name: 'Test User2', email: 'testuser2@gmail.com', address: '456 Oak Ave, Los Angeles, CA 90210' },
      { name: 'Test User3', email: 'testuser3@gmail.com', address: '789 Pine Rd, Chicago, IL 60601' },
      { name: 'Test User4', email: 'testuser4@gmail.com', address: '321 Elm St, Houston, TX 77001' },
      { name: 'Test User5', email: 'testuser5@gmail.com', address: '654 Maple Dr, Phoenix, AZ 85001' },
      { name: 'Test User6', email: 'testuser6@gmail.com', address: '987 Cedar Ln, Philadelphia, PA 19101' },
      { name: 'Test User7', email: 'testuser7@gmail.com', address: '147 Birch St, San Antonio, TX 78201' },
      { name: 'Test User8', email: 'testuser8@gmail.com', address: '258 Spruce Ave, San Diego, CA 92101' },
      { name: 'Test User9', email: 'testuser9@gmail.com', address: '369 Willow Rd, Dallas, TX 75201' },
      { name: 'Test User10', email: 'testuser10@gmail.com', address: '741 Poplar St, San Jose, CA 95101' }
    ];
    
    const defaultPassword = 'user123';
    const defaultSalt = await bcrypt.genSalt(12);
    const defaultPasswordHash = await bcrypt.hash(defaultPassword, defaultSalt);
    
    for (const userData of regularUsers) {
      const user = await User.create({
        id: uuidv4(),
        fullName: userData.name,
        email: userData.email,
        passwordHash: defaultPasswordHash,
        salt: defaultSalt,
        roleName: 'USER',
        address: userData.address
      });
      
      console.log('✅ Regular user created:', user.email);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Created Users:');
    console.log('👑 Admin User:');
    console.log('   Email: admin@greenquote.com');
    console.log('   Password: admin123');
    console.log('   Role: ADMIN');
    
    console.log('\n👥 Regular Users (all with password: user123):');
    regularUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} - ${user.name}`);
    });
    
    console.log('\n💡 You can now use these credentials to test the application!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  createUsers()
    .then(() => {
      console.log('\n✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { createUsers };
