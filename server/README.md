# GreenQuote Server

Node.js TypeScript server for the GreenQuote application - a comprehensive solar quote management system.

## Table of Contents

- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Design](#api-design)
- [Architecture & Design Patterns](#architecture--design-patterns)
- [Module Structure](#module-structure)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)

## Quick Start

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd GreenQuoteApp/server
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Database Setup**
   ```bash
   # Start PostgreSQL
   # Create database: greenquote
   npm run migrate:up
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## Environment Variables

**Important**: You must copy the `.env.example` file to `.env` before running the application:

```bash
cp .env.example .env
```

### Required Environment Variables

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

**Security Note**: The `.env` file is ignored by git. Never commit sensitive credentials.

## Database Schema

### Users Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier |
| full_name | VARCHAR(255) | NOT NULL | User's full name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| role_name | VARCHAR(255) | NOT NULL, DEFAULT 'USER' | User role (USER/ADMIN) |
| address | TEXT | NULL | User's address |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| salt | VARCHAR(255) | NOT NULL | Password salt |
| created_at | TIMESTAMP | NOT NULL | Record creation time |
| updated_at | TIMESTAMP | NOT NULL | Record update time |

### Quotes Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique quote identifier |
| user_id | UUID | FOREIGN KEY → users.id | Reference to quote owner |
| system_size_kw | DECIMAL(10,2) | NOT NULL | Solar system size in kW |
| monthly_consumption_kwh | DECIMAL(10,2) | NOT NULL | Monthly energy consumption |
| down_payment | DECIMAL(12,2) | NOT NULL | Down payment amount |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'USD' | Currency code |
| system_price | DECIMAL(12,2) | NOT NULL | Total system price |
| principal_amount | DECIMAL(12,2) | NOT NULL | Principal loan amount |
| risk_band | ENUM('A','B','C') | NOT NULL | Risk assessment band |
| base_apr | DECIMAL(5,2) | NOT NULL | Base annual percentage rate |
| offers | JSON | NOT NULL | Financing offers array |
| created_at | TIMESTAMP | NOT NULL | Record creation time |
| updated_at | TIMESTAMP | NOT NULL | Record update time |

### Relationships
- **Users → Quotes**: One-to-Many (User can have multiple quotes)
- **Quotes → Users**: Many-to-One (Quote belongs to one user)

## API Design

### Authentication Endpoints

#### POST /api/users/login
**Purpose**: Authenticate user and return JWT token

**Request Body**:
```json
{
  "email": "testuser1@gmail.com",
  "password": "user123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "Test User1",
      "email": "testuser1@gmail.com",
      "roleName": "USER",
      "address": "123 Main St, New York, NY 10001"
    },
    "token": "jwt-token-here"
  },
  "message": "Login successful"
}
```

#### GET /api/users/profile
**Purpose**: Get authenticated user's profile
**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fullName": "Test User1",
    "email": "testuser1@gmail.com",
    "roleName": "USER",
    "address": "123 Main St, New York, NY 10001",
    "createdAt": "2025-09-27T19:52:45.000Z",
    "updatedAt": "2025-09-27T19:52:45.000Z"
  }
}
```

### Quote Endpoints

#### GET /api/quotes
**Purpose**: Get paginated quotes with optional search (admin only)
**Headers**: `Authorization: Bearer <token>`
**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `view` (string): "ADMIN" for admin view (admin only)
- `searchName` (string): Search by customer name (admin only)
- `searchEmail` (string): Search by customer email (admin only)

**Response**:
```json
{
  "quotes": [
    {
      "id": "uuid",
      "userId": "uuid",
      "systemSizeKw": 5.5,
      "monthlyConsumptionKwh": 450,
      "downPayment": 5000,
      "currency": "USD",
      "systemPrice": 16500,
      "principalAmount": 11500,
      "riskBand": "A",
      "baseApr": 4.5,
      "offers": [
        {
          "termYears": 10,
          "apr": 4.5,
          "principalUsed": 11500,
          "monthlyPayment": 119.23
        }
      ],
      "fullName": "Test User1",
      "email": "testuser1@gmail.com",
      "address": "123 Main St, New York, NY 10001",
      "createdAt": "2025-09-27T19:52:45.000Z",
      "updatedAt": "2025-09-27T19:52:45.000Z"
    }
  ],
  "totalCount": 1,
  "totalPages": 1,
  "currentPage": 1
}
```

#### GET /api/quotes/:id
**Purpose**: Get specific quote by ID
**Headers**: `Authorization: Bearer <token>`

**Response**: Same as quote object in GET /api/quotes

#### POST /api/quotes
**Purpose**: Create new quote
**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "systemSizeKw": 5.5,
  "monthlyConsumptionKwh": 450,
  "downPayment": 5000,
  "currency": "USD"
}
```

**Response**: Created quote object

### Health Check

#### GET /api/health
**Purpose**: Server health check

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-27T19:52:45.000Z"
}
```

## Architecture & Design Patterns

### 1. Factory Pattern - Database Connection
The database connection uses the Factory pattern to create and manage Sequelize instances:

```typescript
// src/database/connection.ts
export class DatabaseConnection {
  private sequelize: Sequelize;
  
  constructor() {
    this.sequelize = new Sequelize(/* config */);
  }
  
  async connect(): Promise<void> {
    await this.sequelize.authenticate();
  }
  
  getSequelize(): Sequelize {
    return this.sequelize;
  }
}
```

**Benefits**:
- Centralized database configuration
- Singleton-like behavior for connection management
- Easy testing with mock connections
- Clean separation of concerns

### 2. MVC Pattern - Module Structure
Each feature module follows the Model-View-Controller pattern:

```
modules/
├── user/
│   ├── controllers/     # Controllers (View layer)
│   ├── services/        # Business Logic (Model layer)
│   ├── repository/      # Data Access (Model layer)
│   ├── middleware/      # Request/Response handling
│   └── dto/            # Data Transfer Objects
└── quotes/
    ├── controllers/
    ├── services/
    ├── dto/
    └── services/pricingService.ts
```

### 3. Repository Pattern
Data access is abstracted through repository classes:

```typescript
// src/modules/user/repository/UserRepository.ts
export class UserRepository {
  async create(data: CreateUserRequest): Promise<User> {
    // Database operations
  }
  
  async findByEmail(email: string): Promise<User | null> {
    // Database operations
  }
}
```

### 4. Service Layer Pattern
Business logic is encapsulated in service classes:

```typescript
// src/modules/quotes/services/QuoteService.ts
export class QuoteService {
  async createQuote(data: CreateQuoteRequest): Promise<QuoteResponse> {
    // Business logic, validation, pricing calculations
  }
}
```

### 5. DTO Pattern
Data Transfer Objects ensure type safety and API contracts:

```typescript
// src/modules/quotes/dto/api/quote.dto.ts
export interface CreateQuoteRequest {
  systemSizeKw: number;
  monthlyConsumptionKwh: number;
  downPayment?: number;
  currency?: string;
}
```

## Module Structure

### User Module Features
- **Authentication**: JWT-based login system
- **Authorization**: Role-based access control (USER/ADMIN)
- **Profile Management**: User profile retrieval
- **Password Security**: Bcrypt hashing with salt
- **Input Validation**: Email format, password strength

### Quote Module Features
- **Quote Creation**: Solar system quote generation
- **Pricing Engine**: Dynamic pricing based on system size and risk
- **Risk Assessment**: Automatic risk band calculation (A/B/C)
- **Financing Options**: Multiple term and APR options
- **Search & Filter**: Admin-only search by customer details
- **Pagination**: Efficient data loading for large datasets

### Database Module
- **Connection Management**: Factory pattern for Sequelize instances
- **Model Definitions**: TypeScript interfaces with Sequelize models
- **Associations**: Proper foreign key relationships
- **Migrations**: Version-controlled database schema changes
- **Seeding**: Test data population scripts

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start with nodemon and TypeScript
npm run build        # Compile TypeScript to JavaScript
npm start           # Start production server
npm run type-check  # TypeScript type checking

# Testing
npm test            # Run Mocha tests
npm run test:watch  # Run tests in watch mode

# Database
npm run migrate:up   # Run database migrations
npm run migrate:down # Rollback migrations
```

### Code Quality
- **TypeScript**: Full type safety
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Mocha/Chai**: Unit testing framework
- **Sinon**: Mocking and stubbing

## Testing

### Test Structure
```
test/
├── helpers/           # Test utilities and setup
├── modules/
│   ├── user/         # User module tests
│   └── quotes/       # Quote module tests
└── db-setup.ts       # Database test setup
```

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- --grep "QuoteService"

# Run with coverage
npm run test:coverage
```

### Test Database
- Uses SQLite in-memory database for testing
- Automatic setup and teardown
- Isolated test environment

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Configuration
- Set `NODE_ENV=production`
- Configure production database credentials
- Set secure JWT secret
- Configure proper logging levels

### Docker Support
```bash
# Build Docker image
docker build -t greenquote-server .

# Run with Docker Compose
docker-compose up
```

## Project Structure

```
src/
├── config/              # Configuration management
│   └── index.ts
├── database/            # Database layer
│   ├── connection.ts    # Factory pattern for DB connection
│   ├── models/          # Sequelize models
│   │   ├── user.model.ts
│   │   ├── quote.model.ts
│   │   └── index.ts
├── logger/              # Winston logging configuration
│   └── index.ts
├── modules/             # Feature modules (MVC)
│   ├── health/          # Health check module
│   │   ├── controller.ts
│   │   └── router.ts
│   ├── user/            # User management module
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repository/
│   │   ├── middleware/
│   │   └── dto/
│   └── quotes/          # Quote management module
│       ├── controllers/
│       ├── services/
│       └── dto/
├── migrations/          # Database migrations
└── index.ts            # Application entry point
```

## Future Implementations and Architectural Roadmap

### Phase 1: Enhanced User Management & RBAC  - 
• **RBAC Implementation**: Separate tables for roles, permissions, user-role mappings
• **User Management**: Create, Update, delete, list users with search
• **Role Assignment**: Admin endpoints for role management
• **Permission Middleware**: Route protection based on granular permissions

### Phase 2: API Documentation & Standards -
• **OpenAPI/Swagger**: Interactive API docs at `/api-docs`
• **API Versioning**: `/api/v1/` and `/api/v2/` endpoints
• **Request/Response Schemas**: Complete API documentation
• **Authentication Docs**: JWT examples and error responses

### Phase 3: Advanced Features 
• **Redis Caching**: Quote and user data caching with TTL
• **Rate Limiting**: Login attempts , API throttling
• **File Upload**: Document management for quotes
• **Input Validation**: Joi schemas for all endpoints

### Phase 4: Microservices Architecture 
• **Service Decomposition**: User, Quote, Pricing, Notification, Reporting services
• **Event-Driven**: RabbitMQ/Kafka for inter-service communication
• **API Gateway**: Request routing and authentication
• **Domain Events**: QuoteCreated, UserRegistered event handlers

### Phase 5: Security & Monitoring 
• **Security Stack**: Helmet, CORS, compression middleware
• **Monitoring**: Prometheus metrics, health checks 
• **Observability**: Service dependency monitoring
• **Performance Metrics**: Request duration, error rates

### Phase 6: Performance & Scalability 
• **Database Optimization**: Strategic indexes, table partitioning
• **Horizontal Scaling**: Load balancers, read replicas
• **Containerization**: Docker + Kubernetes orchestration
• **CDN Integration**: Static asset optimization

### Technology Stack Evolution
**Current**: Node.js + TypeScript + Express + PostgreSQL + Sequelize + JWT
**Future**: + Redis + RabbitMQ + Docker + Kubernetes + Prometheus + GCP/AWS+ Elasticsearch

## Contributing

1. Follow TypeScript best practices
2. Write tests for new features
3. Update documentation
4. Follow the established module structure
5. Use proper error handling and logging
6. Consider the architectural roadmap when implementing new features

## License

This project is licensed under the MIT License.
