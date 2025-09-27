# Database Migrations

This directory contains database migration scripts for the GreenQuote application.

## Available Migrations

### 001_create_users
Creates test users for development and testing purposes.

**Up Migration (`001_create_users.js`):**
- Creates 1 admin user
- Creates 10 regular users
- All users have predictable passwords for testing

**Down Migration (`001_create_users_down.js`):**
- Removes all test users created by the up migration

## Usage

### Using the Migration Runner (Recommended)

```bash
# Run migration up
node migrate.js up 001_create_users

# Run migration down
node migrate.js down 001_create_users
```

### Running Migrations Directly

```bash
# Run migration up
node 001_create_users.js

# Run migration down
node 001_create_users_down.js
```

## Created Users

### Admin User
- **Email**: admin@greenquote.com
- **Password**: admin123
- **Role**: ADMIN
- **Name**: System Administrator

### Regular Users (Password: user123)
1. john.smith@example.com - John Smith
2. sarah.johnson@example.com - Sarah Johnson
3. michael.brown@example.com - Michael Brown
4. emily.davis@example.com - Emily Davis
5. david.wilson@example.com - David Wilson
6. lisa.anderson@example.com - Lisa Anderson
7. robert.taylor@example.com - Robert Taylor
8. jennifer.martinez@example.com - Jennifer Martinez
9. christopher.garcia@example.com - Christopher Garcia
10. amanda.rodriguez@example.com - Amanda Rodriguez

## Prerequisites

Before running migrations, ensure:

1. **Database is running**: PostgreSQL should be accessible
2. **Environment variables**: Database connection settings are configured
3. **Dependencies**: All required npm packages are installed

## Database Connection

The migrations use the same database connection as the main application:
- Host: localhost (or DB_HOST env var)
- Port: 5432 (or DB_PORT env var)
- Database: greenquote (or DB_NAME env var)
- Username: postgres (or DB_USER env var)
- Password: password (or DB_PASSWORD env var)

## Error Handling

- Migrations will fail if users already exist (up migration)
- Down migrations will skip users that don't exist
- All operations are logged with clear success/error messages
- Scripts exit with appropriate exit codes for automation

## Security Notes

⚠️ **These migrations create users with predictable passwords for testing only!**

- Do NOT run these migrations in production
- Change all passwords after running migrations
- Consider using environment variables for passwords in production
- These scripts are intended for development and testing environments only
