const { Sequelize } = require('sequelize');

// Database configuration
const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'greenquote',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  dialect: 'postgres',
  logging: false
});

// Define User model (simplified for script)
const User = sequelize.define('User', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: false
  },
  fullName: {
    type: Sequelize.STRING(255),
    allowNull: false,
    field: 'full_name'
  },
  roleName: {
    type: Sequelize.STRING(255),
    allowNull: false,
    field: 'role_name'
  },
  email: {
    type: Sequelize.STRING(255),
    allowNull: false,
    unique: true
  },
  address: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  passwordHash: {
    type: Sequelize.STRING(255),
    allowNull: false,
    field: 'password_hash'
  },
  salt: {
    type: Sequelize.STRING(255),
    allowNull: false
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true
});

// Define Quote model (simplified for script)
const Quote = sequelize.define('Quote', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false
  },
  userId: {
    type: Sequelize.UUID,
    allowNull: false,
    field: 'user_id'
  },
  systemSizeKw: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
    field: 'system_size_kw'
  },
  monthlyConsumptionKwh: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
    field: 'monthly_consumption_kwh'
  },
  downPayment: {
    type: Sequelize.DECIMAL(12, 2),
    allowNull: false,
    field: 'down_payment'
  },
  currency: {
    type: Sequelize.STRING(3),
    allowNull: false,
    defaultValue: 'USD'
  },
  systemPrice: {
    type: Sequelize.DECIMAL(12, 2),
    allowNull: false,
    field: 'system_price'
  },
  principalAmount: {
    type: Sequelize.DECIMAL(12, 2),
    allowNull: false,
    field: 'principal_amount'
  },
  riskBand: {
    type: Sequelize.ENUM('A', 'B', 'C'),
    allowNull: false,
    field: 'risk_band'
  },
  baseApr: {
    type: Sequelize.DECIMAL(5, 2),
    allowNull: false,
    field: 'base_apr'
  },
  offers: {
    type: Sequelize.JSON,
    allowNull: false
  }
}, {
  tableName: 'quotes',
  timestamps: true,
  underscored: true
});

// Sample quote data
const sampleQuotes = [
  {
    systemSizeKw: 5.5,
    monthlyConsumptionKwh: 650,
    downPayment: 5000,
    currency: 'USD'
  },
  {
    systemSizeKw: 8.2,
    monthlyConsumptionKwh: 950,
    downPayment: 8000,
    currency: 'USD'
  },
  {
    systemSizeKw: 12.0,
    monthlyConsumptionKwh: 1400,
    downPayment: 12000,
    currency: 'USD'
  },
  {
    systemSizeKw: 6.8,
    monthlyConsumptionKwh: 780,
    downPayment: 6000,
    currency: 'USD'
  },
  {
    systemSizeKw: 10.5,
    monthlyConsumptionKwh: 1200,
    downPayment: 10000,
    currency: 'USD'
  }
];

// Pricing calculation function (simplified)
function calculateQuotePricing(systemSizeKw, monthlyConsumptionKwh, downPayment, currency = 'USD') {
  const basePricePerKw = 3000; // $3000 per kW
  const systemPrice = systemSizeKw * basePricePerKw;
  const principalAmount = systemPrice - downPayment;
  
  // Risk band calculation based on down payment percentage
  const downPaymentPercentage = (downPayment / systemPrice) * 100;
  let riskBand = 'C';
  let baseApr = 8.5;
  
  if (downPaymentPercentage >= 30) {
    riskBand = 'A';
    baseApr = 4.5;
  } else if (downPaymentPercentage >= 20) {
    riskBand = 'B';
    baseApr = 6.5;
  }
  
  // Generate financing offers
  const offers = [
    {
      termYears: 10,
      apr: baseApr + 0.5,
      principalUsed: principalAmount,
      monthlyPayment: calculateMonthlyPayment(principalAmount, baseApr + 0.5, 10)
    },
    {
      termYears: 15,
      apr: baseApr + 1.0,
      principalUsed: principalAmount,
      monthlyPayment: calculateMonthlyPayment(principalAmount, baseApr + 1.0, 15)
    },
    {
      termYears: 20,
      apr: baseApr + 1.5,
      principalUsed: principalAmount,
      monthlyPayment: calculateMonthlyPayment(principalAmount, baseApr + 1.5, 20)
    }
  ];
  
  return {
    systemPrice,
    principalAmount,
    riskBand,
    baseApr,
    offers
  };
}

function calculateMonthlyPayment(principal, annualRate, years) {
  const monthlyRate = annualRate / 100 / 12;
  const numberOfPayments = years * 12;
  
  if (monthlyRate === 0) {
    return principal / numberOfPayments;
  }
  
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
         (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
}

async function createSampleQuotes() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Find non-admin users
    const nonAdminUsers = await User.findAll({
      where: {
        roleName: 'USER'
      },
      limit: 5
    });
    
    if (nonAdminUsers.length === 0) {
      console.log('❌ No non-admin users found. Please create some users first.');
      return;
    }
    
    console.log(`📋 Found ${nonAdminUsers.length} non-admin users. Creating quotes...`);
    
    // Create quotes for each user
    for (let i = 0; i < Math.min(nonAdminUsers.length, sampleQuotes.length); i++) {
      const user = nonAdminUsers[i];
      const quoteData = sampleQuotes[i];
      
      // Calculate pricing
      const pricing = calculateQuotePricing(
        quoteData.systemSizeKw,
        quoteData.monthlyConsumptionKwh,
        quoteData.downPayment,
        quoteData.currency
      );
      
      // Create quote
      const quote = await Quote.create({
        userId: user.id,
        systemSizeKw: quoteData.systemSizeKw,
        monthlyConsumptionKwh: quoteData.monthlyConsumptionKwh,
        downPayment: quoteData.downPayment,
        currency: quoteData.currency,
        systemPrice: pricing.systemPrice,
        principalAmount: pricing.principalAmount,
        riskBand: pricing.riskBand,
        baseApr: pricing.baseApr,
        offers: pricing.offers
      });
      
      console.log(`✅ Created quote for ${user.fullName} (${user.email}):`);
      console.log(`   - System Size: ${quoteData.systemSizeKw} kW`);
      console.log(`   - System Price: $${pricing.systemPrice.toLocaleString()}`);
      console.log(`   - Down Payment: $${quoteData.downPayment.toLocaleString()}`);
      console.log(`   - Risk Band: ${pricing.riskBand}`);
      console.log(`   - Quote ID: ${quote.id}`);
      console.log('');
    }
    
    console.log('🎉 Successfully created sample quotes for non-admin users!');
    
  } catch (error) {
    console.error('❌ Error creating sample quotes:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
createSampleQuotes();
