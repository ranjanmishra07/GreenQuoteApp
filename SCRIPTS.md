# GreenQuote Application Scripts

This directory contains utility scripts to manage the GreenQuote application.

## Available Scripts

### 🚀 `start-app.sh` - Start Application
Starts the entire application in the correct order with health checks.

**What it does:**
1. Starts PostgreSQL database
2. Waits for PostgreSQL to be healthy
3. Runs database migrations (`migrate:down` then `migrate:up`)
4. Starts Node.js server
5. Waits for server to be healthy
6. Starts React client
7. Waits for client to be healthy

**Usage:**
```bash
./start-app.sh
```

### 🛑 `stop-app.sh` - Stop Application
Stops all running services.

**Usage:**
```bash
./stop-app.sh
```

### 🧪 `test-app.sh` - Test Application
Tests if all services are running and accessible.

**What it tests:**
- PostgreSQL database connection
- Server health endpoint
- User authentication (admin login)
- React client accessibility

**Usage:**
```bash
./test-app.sh
```

## Quick Start Guide

1. **Start the application:**
   ```bash
   ./start-app.sh
   ```

2. **Test if everything is working:**
   ```bash
   ./test-app.sh
   ```

3. **Stop the application:**
   ```bash
   ./stop-app.sh
   ```

## Application URLs

Once started, the application will be available at:

- **React Client:** http://localhost:5000
- **Server API:** http://localhost:3000
- **Health Check:** http://localhost:3000/api/health

## Test Credentials

- **Admin User:**
  - Email: `admin@greenquote.com`
  - Password: `admin123`

- **Regular Users:**
  - Email: `testuser1@gmail.com` to `testuser10@gmail.com`
  - Password: `user123`

## Troubleshooting

### View Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f postgres
```

### Reset Everything
```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Start fresh
./start-app.sh
```

### Manual Migration
If migrations fail, you can run them manually:

```bash
cd server
npm run migrate:down
npm run migrate:up
```

## Script Features

- **Colored Output:** Easy to read status messages
- **Health Checks:** Waits for services to be ready before proceeding
- **Error Handling:** Stops on any error and provides helpful messages
- **Cleanup:** Handles script interruption gracefully
- **Dependency Management:** Automatically installs server dependencies if needed

## Requirements

- Docker and Docker Compose installed
- Node.js and npm (for migrations)
- Internet connection (for downloading Docker images)
