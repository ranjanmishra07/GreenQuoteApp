# GreenQuote Application

A comprehensive solar quote management system built with Node.js, TypeScript, React, and PostgreSQL. This application allows users to create, manage, and view solar energy quotes with dynamic pricing and financing options.

Test Screenshot pdf with combined images are shared in this link -> https://drive.google.com/file/d/10n-7vzLP3zbIAS8muECyxXLRyw4vrc3b/view?usp=sharing

## 🚀 Quick Start with Scripts

The easiest way to run the application is using the provided startup scripts:

> **Note:** If you get a "Permission denied" error when running the scripts, you may need to make them executable first:
> ```bash
> chmod +x ./start-app.sh ./test-app.sh ./stop-app.sh
> ```

### 1. Start the Application
```bash
./start-app.sh
```
This script will:
- Start PostgreSQL database
- Run database migrations (down then up)
- Start Node.js server
- Start React client
- Wait for all services to be healthy

### 2. Test the Application
```bash
./test-app.sh
```
This script will:
- Test PostgreSQL connection
- Test server health endpoint
- Test user authentication
- Test React client accessibility

### 3. Stop the Application
```bash
./stop-app.sh
```
This script will:
- Stop all Docker containers
- Clean up networks and resources

## 📊 Application URLs

Once started, the application will be available at:

- **React Client:** http://localhost:5000
- **Server API:** http://localhost:3000
- **Health Check:** http://localhost:3000/api/health

## 🔑 Test Credentials

- **Admin User:**
  - Email: `admin@greenquote.com`
  - Password: `admin123`

- **Regular Users:**
  - Email: `testuser1@gmail.com` to `testuser10@gmail.com`
  - Password: `user123`

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 5000, and 5432 are available
2. **Database connection**: Check PostgreSQL is running and credentials are correct
3. **Migration errors**: Run `npm run migrate:down` then `npm run migrate:up`
4. **Docker issues**: Try `docker-compose down -v` to remove volumes

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
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


## 🧪 Running Tests

To run the server tests:

```bash
cd server
npm run test
```

This will run all Mocha tests with the following features:
- SQLite in-memory database for testing
- Unit tests for services and controllers
- Integration tests for API endpoints
- Automatic test database setup and teardown

## 🛠️ Manual Setup (Alternative to Scripts)

If you prefer to run components manually:

### Prerequisites
- Node.js (>=20.0.0) - Use `nvm` to manage Node.js versions
- Docker and Docker Compose
- PostgreSQL (or use Docker)

### 1. Database Setup
```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Or use local PostgreSQL and create database
createdb greenquote
```

### 2. Server Setup
```bash
cd server

# Use the correct Node.js version
nvm use

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
npm run migrate:up

# Start development server
npm run dev
```

### 3. Client Setup
```bash
cd client

# Use the correct Node.js version
nvm use

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env if needed (defaults work for local development)

# Start development server
npm run dev
```

## 📁 Project Structure

```
GreenQuoteApp/
├── server/                 # Node.js TypeScript backend
│   ├── src/               # Source code
│   ├── test/              # Test files
│   ├── migrations/        # Database migrations
│   ├── scripts/           # Utility scripts
│   ├── Dockerfile         # Server Docker configuration
│   └── README.md          # Detailed server documentation
├── client/                # React TypeScript frontend
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   ├── Dockerfile         # Client Docker configuration
│   └── README.md          # Detailed client documentation
├── docker-compose.yml     # Multi-container setup
├── start-app.sh          # Application startup script
├── test-app.sh           # Application testing script
├── stop-app.sh           # Application shutdown script
└── SCRIPTS.md            # Scripts documentation
```

## 📚 Detailed Documentation

For comprehensive documentation, refer to:
- **Server Documentation**: `server/README.md` - Complete backend documentation including architecture, API design, database schema, and development guide
- **Client Documentation**: `client/README.md` - Frontend documentation with setup and configuration details

## 🔧 Environment Configuration

### Server Environment (.env)
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=300  # 5 minutes in seconds

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=greenquote
DB_USER=your-db-username
DB_PASSWORD=your-db-password
DB_DIALECT=postgres
```

### Client Environment (.env)
```env
# Client port (default: 5000)
VITE_CLIENT_PORT=5000

# API base URL (default: http://localhost:3000/api)
VITE_API_BASE_URL=http://localhost:3000/api
```

## 🐳 Docker Support

The application includes full Docker support:

```bash
# Start all services with Docker Compose
docker-compose up -d

# Build and start with scripts
./start-app.sh

# View logs
docker-compose logs -f [service]

# Stop all services
docker-compose down
```

## 🧪 Testing

### Server Tests
```bash
cd server
nvm use                     # Use correct Node.js version
npm test                    # Run all tests
npm test -- --grep "Quote" # Run specific tests
```

### Application Tests
```bash
./test-app.sh              # Test all services
```

## 📋 Available Scripts

### Root Level Scripts
- `./start-app.sh` - Start entire application
- `./test-app.sh` - Test application functionality
- `./stop-app.sh` - Stop all services

### Server Scripts
```bash
cd server
nvm use              # Use correct Node.js version
npm run dev          # Development server with hot reload
npm run build        # Build TypeScript
npm start           # Production server
npm test            # Run tests
npm run migrate:up  # Run database migrations
npm run migrate:down # Rollback migrations
```

### Client Scripts
```bash
cd client
nvm use             # Use correct Node.js version
npm run dev         # Development server
npm run build       # Production build
npm run preview     # Preview production build
```

## 🏗️ Architecture Overview

### Backend (Node.js + TypeScript)
- **Express.js** web framework
- **Sequelize** ORM with PostgreSQL
- **JWT** authentication
- **Winston** structured logging
- **Mocha/Chai** testing framework

### Frontend (React + TypeScript)
- **React 18** with hooks
- **TanStack Query** for data fetching
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Vite** build tool

### Database
- **PostgreSQL** for production
- **SQLite** for testing
- **Sequelize** migrations
- **UUID** primary keys

## 🔮 Future Roadmap

The application is designed for scalability with planned features:

- **RBAC Implementation**: Advanced role-based access control
- **OpenAPI Documentation**: Interactive API documentation
- **Redis Caching**: Performance optimization
- **Microservices**: Service decomposition
- **Monitoring**: Prometheus metrics and health checks
- **Security**: Enhanced security middleware

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Follow TypeScript best practices
2. Write tests for new features
3. Update documentation
4. Follow the established module structure
5. Use proper error handling and logging

---
