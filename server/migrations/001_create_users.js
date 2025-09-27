const bcrypt = require('bcrypt');

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
    
    // Import models after connection is established
    const { User, Quote } = require('../src/database/models');
    
    // Import PricingService for quote calculations
    const { PricingService } = require('../src/modules/quotes/services/pricingService');
    
    // Create admin user
    const adminSalt = await bcrypt.genSalt(12);
    const adminPasswordHash = await bcrypt.hash('admin123', adminSalt);
    
    const adminUser = await User.create({
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
        fullName: userData.name,
        email: userData.email,
        passwordHash: defaultPasswordHash,
        salt: defaultSalt,
        roleName: 'USER',
        address: userData.address
      });
      
      console.log('✅ Regular user created:', user.email);
    }
    
    // Create quotes for users
    console.log('\n📋 Creating sample quotes...');
    
    // Quote data templates
    const quoteTemplates = [
      { systemSizeKw: 5.5, monthlyConsumptionKwh: 450, downPayment: 5000, currency: 'USD' },
      { systemSizeKw: 8.2, monthlyConsumptionKwh: 600, downPayment: 8000, currency: 'USD' },
      { systemSizeKw: 12.0, monthlyConsumptionKwh: 900, downPayment: 12000, currency: 'USD' },
      { systemSizeKw: 6.8, monthlyConsumptionKwh: 500, downPayment: 6000, currency: 'USD' },
      { systemSizeKw: 10.5, monthlyConsumptionKwh: 750, downPayment: 10000, currency: 'USD' },
      { systemSizeKw: 7.0, monthlyConsumptionKwh: 550, downPayment: 2000, currency: 'USD' },
      { systemSizeKw: 9.5, monthlyConsumptionKwh: 700, downPayment: 3000, currency: 'USD' },
      { systemSizeKw: 15.0, monthlyConsumptionKwh: 1100, downPayment: 15000, currency: 'USD' },
      { systemSizeKw: 4.0, monthlyConsumptionKwh: 300, downPayment: 1000, currency: 'USD' },
      { systemSizeKw: 11.0, monthlyConsumptionKwh: 800, downPayment: 4000, currency: 'USD' },
      { systemSizeKw: 6.5, monthlyConsumptionKwh: 480, downPayment: 3500, currency: 'USD' },
      { systemSizeKw: 13.5, monthlyConsumptionKwh: 950, downPayment: 11000, currency: 'USD' },
      { systemSizeKw: 8.8, monthlyConsumptionKwh: 650, downPayment: 7000, currency: 'USD' },
      { systemSizeKw: 14.2, monthlyConsumptionKwh: 1050, downPayment: 13000, currency: 'USD' },
      { systemSizeKw: 5.2, monthlyConsumptionKwh: 420, downPayment: 2500, currency: 'USD' },
      { systemSizeKw: 9.8, monthlyConsumptionKwh: 720, downPayment: 9000, currency: 'USD' },
      { systemSizeKw: 7.5, monthlyConsumptionKwh: 580, downPayment: 4500, currency: 'USD' },
      { systemSizeKw: 11.5, monthlyConsumptionKwh: 850, downPayment: 12000, currency: 'USD' },
      { systemSizeKw: 6.2, monthlyConsumptionKwh: 460, downPayment: 3000, currency: 'USD' },
      { systemSizeKw: 10.8, monthlyConsumptionKwh: 780, downPayment: 8000, currency: 'USD' },
      { systemSizeKw: 8.5, monthlyConsumptionKwh: 620, downPayment: 5500, currency: 'USD' },
      { systemSizeKw: 12.8, monthlyConsumptionKwh: 920, downPayment: 14000, currency: 'USD' }
    ];
    
    // Create 2 quotes for admin user
    console.log('👑 Creating quotes for admin user...');
    for (let i = 0; i < 2; i++) {
      const template = quoteTemplates[i];
      const pricing = PricingService.calculateQuotePricing(
        template.systemSizeKw,
        template.monthlyConsumptionKwh,
        template.downPayment,
        template.currency
      );
      
      const adminQuote = await Quote.create({
        userId: adminUser.id,
        systemSizeKw: template.systemSizeKw,
        monthlyConsumptionKwh: template.monthlyConsumptionKwh,
        downPayment: template.downPayment,
        currency: template.currency,
        systemPrice: pricing.systemPrice,
        principalAmount: pricing.principalAmount,
        riskBand: pricing.riskBand,
        baseApr: pricing.baseApr,
        offers: pricing.offers
      });
      
      console.log(`   ✅ Admin quote ${i + 1} created: ${template.systemSizeKw}kW system, $${template.downPayment} down payment`);
    }
    
    // Create 2 quotes for each regular user
    console.log('👥 Creating quotes for regular users...');
    const allUsers = await User.findAll({
      where: { roleName: 'USER' },
      order: [['email', 'ASC']]
    });
    
    let templateIndex = 2; // Start after admin quotes
    
    for (const user of allUsers) {
      for (let i = 0; i < 2; i++) {
        const template = quoteTemplates[templateIndex % quoteTemplates.length];
        const pricing = PricingService.calculateQuotePricing(
          template.systemSizeKw,
          template.monthlyConsumptionKwh,
          template.downPayment,
          template.currency
        );
        
        const userQuote = await Quote.create({
          userId: user.id,
          systemSizeKw: template.systemSizeKw,
          monthlyConsumptionKwh: template.monthlyConsumptionKwh,
          downPayment: template.downPayment,
          currency: template.currency,
          systemPrice: pricing.systemPrice,
          principalAmount: pricing.principalAmount,
          riskBand: pricing.riskBand,
          baseApr: pricing.baseApr,
          offers: pricing.offers
        });
        
        console.log(`   ✅ Quote for ${user.email}: ${template.systemSizeKw}kW system, $${template.downPayment} down payment`);
        templateIndex++;
      }
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
    
    console.log('\n📊 Created Quotes:');
    console.log('👑 Admin User: 2 quotes');
    console.log('👥 Regular Users: 2 quotes each (20 total)');
    console.log('📈 Total Quotes: 22 quotes');
    
    console.log('\n💡 You can now use these credentials to test the application!');
    console.log('💡 Admin users can view all quotes, regular users see only their own quotes.');
    
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
