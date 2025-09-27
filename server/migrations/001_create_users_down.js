/**
 * Migration Down: Remove Test Users
 * Run this script to remove the test users created by 001_create_users.js
 */

async function removeUsers() {
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
    
    // Import models after connection is established
    const { User, Quote } = require('../src/database/models');
    
    // List of test user emails to remove
    const testUserEmails = [
      'admin@greenquote.com',
      'testuser1@gmail.com',
      'testuser2@gmail.com',
      'testuser3@gmail.com',
      'testuser4@gmail.com',
      'testuser5@gmail.com',
      'testuser6@gmail.com',
      'testuser7@gmail.com',
      'testuser8@gmail.com',
      'testuser9@gmail.com',
      'testuser10@gmail.com'
    ];
    
    console.log('🗑️  Removing test quotes and users...');
    
    // First, remove all quotes (they will be automatically removed when users are deleted due to CASCADE)
    // But let's be explicit about it
    const quoteCount = await Quote.count();
    if (quoteCount > 0) {
      await Quote.destroy({ where: {} });
      console.log(`🗑️  Removed ${quoteCount} quotes`);
    }
    
    let removedCount = 0;
    
    for (const email of testUserEmails) {
      const deletedRows = await User.destroy({
        where: { email: email }
      });
      
      if (deletedRows > 0) {
        console.log(`✅ Removed user: ${email}`);
        removedCount++;
      } else {
        console.log(`⚠️  User not found: ${email}`);
      }
    }
    
    console.log(`\n🎉 Migration down completed successfully!`);
    console.log(`📊 Removed ${removedCount} users out of ${testUserEmails.length} attempted`);
    console.log(`📊 Removed ${quoteCount} quotes`);
    
    if (removedCount === 0) {
      console.log('💡 No test users were found to remove. They may have already been deleted.');
    }
    
  } catch (error) {
    console.error('❌ Migration down failed:', error);
    throw error;
  }
}

// Run migration down if this file is executed directly
if (require.main === module) {
  removeUsers()
    .then(() => {
      console.log('\n✅ Migration down script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration down script failed:', error);
      process.exit(1);
    });
}

module.exports = { removeUsers };
