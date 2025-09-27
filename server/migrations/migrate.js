#!/usr/bin/env node

/**
 * Migration Runner
 * Usage:
 *   node migrate.js up <migration>    - Run migration up
 *   node migrate.js down <migration>  - Run migration down
 */

const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = __dirname;

async function runMigration(migrationName, direction) {
  const migrationFile = direction === 'up' 
    ? path.join(MIGRATIONS_DIR, `${migrationName}.js`)
    : path.join(MIGRATIONS_DIR, `${migrationName}_down.js`);
  
  if (!fs.existsSync(migrationFile)) {
    console.error(`❌ Migration file not found: ${migrationFile}`);
    process.exit(1);
  }
  
  console.log(`🚀 Running migration: ${migrationName} (${direction})`);
  console.log(`📁 File: ${migrationFile}\n`);
  
  try {
    // Clear require cache to ensure fresh import
    delete require.cache[require.resolve(migrationFile)];
    
    const migration = require(migrationFile);
    const functionName = direction === 'up' ? 'createUsers' : 'removeUsers';
    
    if (typeof migration[functionName] === 'function') {
      await migration[functionName]();
    } else {
      console.error(`❌ Function ${functionName} not found in migration file`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`❌ Migration failed:`, error);
    process.exit(1);
  }
}

function showUsage() {
  console.log('🔄 Migration Runner for GreenQuote');
  console.log('==================================\n');
  console.log('Usage:');
  console.log('  node migrate.js up <migration>    - Run migration up');
  console.log('  node migrate.js down <migration>  - Run migration down');
  console.log('\nExamples:');
  console.log('  node migrate.js up 001_create_users');
  console.log('  node migrate.js down 001_create_users');
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showUsage();
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'up':
      if (args.length < 2) {
        console.error('❌ Please specify migration name');
        console.log('Usage: node migrate.js up <migration>');
        process.exit(1);
      }
      await runMigration(args[1], 'up');
      break;
      
    case 'down':
      if (args.length < 2) {
        console.error('❌ Please specify migration name');
        console.log('Usage: node migrate.js down <migration>');
        process.exit(1);
      }
      await runMigration(args[1], 'down');
      break;
      
    default:
      console.error(`❌ Unknown command: ${command}`);
      showUsage();
      process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Migration runner failed:', error);
    process.exit(1);
  });
}