# GreenQuote API Specification

Complete API documentation for the GreenQuote application backend.

## Base URL
```
http://localhost:3000/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

## Response Format
All API responses follow this format:
```json
{
  "success": boolean,
  "message": string,
  "data": object | array,
  "error": string (only on error)
}
```

---

## Health Check

### GET /health
**Purpose**: Check server health status

**Request**:
```http
GET /api/health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-27T19:52:45.000Z"
}
```

---

## Authentication Endpoints

### POST /users/login
**Purpose**: Authenticate user and return JWT token

**Request**:
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "admin@greenquote.com",
  "password": "admin123"
}
```

**Response** (Success):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1738012345ABCD",
      "fullName": "System Administrator",
      "email": "admin@greenquote.com",
      "roleName": "ADMIN",
      "address": "123 Admin St, New York, NY 10001",
      "createdAt": "2025-09-27T19:52:45.000Z",
      "updatedAt": "2025-09-27T19:52:45.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**Response** (Error):
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### GET /users/profile
**Purpose**: Get authenticated user's profile

**Request**:
```http
GET /api/users/profile
Authorization: Bearer <jwt-token>
```

**Response** (Success):
```json
{
  "success": true,
  "data": {
    "id": "1738012345ABCD",
    "fullName": "Test User1",
    "email": "testuser1@gmail.com",
    "roleName": "USER",
    "address": "123 Main St, New York, NY 10001",
    "createdAt": "2025-09-27T19:52:45.000Z",
    "updatedAt": "2025-09-27T19:52:45.000Z"
  }
}
```

**Response** (Error):
```json
{
  "success": false,
  "message": "Access token required"
}
```

---

## Quote Endpoints

### GET /quotes
**Purpose**: Get paginated quotes with optional search (admin only)

**Request**:
```http
GET /api/quotes?page=1&limit=10&view=ADMIN&searchName=John&searchEmail=john@example.com
Authorization: Bearer <jwt-token>
```

**Query Parameters**:
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)
- `view` (string, optional): "ADMIN" for admin view (admin users only)
- `searchName` (string, optional): Search by customer name (admin users only)
- `searchEmail` (string, optional): Search by customer email (admin users only)

**Response** (Success):
```json
{
  "quotes": [
    {
      "id": "1738012346EFGH",
      "userId": "1738012345ABCD",
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
        },
        {
          "termYears": 15,
          "apr": 4.8,
          "principalUsed": 11500,
          "monthlyPayment": 89.45
        },
        {
          "termYears": 20,
          "apr": 5.2,
          "principalUsed": 11500,
          "monthlyPayment": 76.89
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

**Response** (Error - Unauthorized):
```json
{
  "success": false,
  "message": "Admin functionality is only available for admin users"
}
```

### GET /quotes/:id
**Purpose**: Get specific quote by ID

**Request**:
```http
GET /api/quotes/1738012346EFGH
Authorization: Bearer <jwt-token>
```

**Response** (Success):
```json
{
  "id": "1738012346EFGH",
  "userId": "1738012345ABCD",
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
    },
    {
      "termYears": 15,
      "apr": 4.8,
      "principalUsed": 11500,
      "monthlyPayment": 89.45
    },
    {
      "termYears": 20,
      "apr": 5.2,
      "principalUsed": 11500,
      "monthlyPayment": 76.89
    }
  ],
  "fullName": "Test User1",
  "email": "testuser1@gmail.com",
  "address": "123 Main St, New York, NY 10001",
  "author": {
    "id": "1738012345ABCD",
    "fullName": "Test User1",
    "email": "testuser1@gmail.com"
  },
  "createdAt": "2025-09-27T19:52:45.000Z",
  "updatedAt": "2025-09-27T19:52:45.000Z"
}
```

**Response** (Error - Not Found):
```json
{
  "error": "Quote not found"
}
```

### POST /quotes
**Purpose**: Create new quote

**Request**:
```http
POST /api/quotes
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "systemSizeKw": 5.5,
  "monthlyConsumptionKwh": 450,
  "downPayment": 5000,
  "currency": "USD"
}
```

**Request Body**:
- `systemSizeKw` (number, required): Solar system size in kW
- `monthlyConsumptionKwh` (number, required): Monthly energy consumption in kWh
- `downPayment` (number, optional): Down payment amount (default: 0)
- `currency` (string, optional): Currency code (default: "USD")

**Response** (Success):
```json
{
  "id": "1738012346EFGH",
  "userId": "1738012345ABCD",
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
    },
    {
      "termYears": 15,
      "apr": 4.8,
      "principalUsed": 11500,
      "monthlyPayment": 89.45
    },
    {
      "termYears": 20,
      "apr": 5.2,
      "principalUsed": 11500,
      "monthlyPayment": 76.89
    }
  ],
  "fullName": "Test User1",
  "email": "testuser1@gmail.com",
  "address": "123 Main St, New York, NY 10001",
  "createdAt": "2025-09-27T19:52:45.000Z",
  "updatedAt": "2025-09-27T19:52:45.000Z"
}
```

**Response** (Error - Validation):
```json
{
  "error": "systemSizeKw and monthlyConsumptionKwh are required"
}
```

**Response** (Error - Invalid Values):
```json
{
  "error": "systemSizeKw and monthlyConsumptionKwh must be positive"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Page must be greater than 0"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "error": "Quote not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "requestId": "req_123456789"
}
```

---

## Data Models

### User Model
```typescript
interface User {
  id: string;                    // Epoch-based ID with random suffix
  fullName: string;              // User's full name
  email: string;                 // Unique email address
  roleName: 'USER' | 'ADMIN';    // User role
  address?: string;              // Optional address
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

### Quote Model
```typescript
interface Quote {
  id: string;                    // Epoch-based ID with random suffix
  userId: string;                // Reference to user
  systemSizeKw: number;          // Solar system size in kW
  monthlyConsumptionKwh: number; // Monthly consumption in kWh
  downPayment: number;           // Down payment amount
  currency: string;              // Currency code (USD)
  systemPrice: number;           // Total system price
  principalAmount: number;       // Principal loan amount
  riskBand: 'A' | 'B' | 'C';    // Risk assessment band
  baseApr: number;               // Base annual percentage rate
  offers: QuoteOffer[];          // Financing offers
  fullName: string;              // Customer name (from user)
  email: string;                 // Customer email (from user)
  address?: string;              // Customer address (from user)
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

### Quote Offer Model
```typescript
interface QuoteOffer {
  termYears: number;             // Loan term in years
  apr: number;                   // Annual percentage rate
  principalUsed: number;         // Principal amount for this offer
  monthlyPayment: number;        // Monthly payment amount
}
```

---

## Risk Band Calculation

The system automatically calculates risk bands based on system size and monthly consumption:

- **Band A**: Low risk - Small systems with high consumption ratio
- **Band B**: Medium risk - Medium systems with moderate consumption ratio  
- **Band C**: High risk - Large systems with low consumption ratio

### Risk Band Criteria
```typescript
// Simplified risk calculation
const consumptionRatio = monthlyConsumptionKwh / systemSizeKw;

if (consumptionRatio >= 80 && systemSizeKw <= 8) {
  riskBand = 'A';  // Low risk
} else if (consumptionRatio >= 50 && systemSizeKw <= 15) {
  riskBand = 'B';  // Medium risk
} else {
  riskBand = 'C';  // High risk
}
```

---

## Pricing Calculation

The system calculates dynamic pricing based on:

1. **System Size**: Base price per kW
2. **Risk Band**: APR adjustments
3. **Down Payment**: Principal amount reduction
4. **Financing Terms**: Multiple term options (10, 15, 20 years)

### Pricing Formula
```typescript
// Base pricing
const basePricePerKw = 3000; // $3,000 per kW
const systemPrice = systemSizeKw * basePricePerKw;
const principalAmount = systemPrice - downPayment;

// APR by risk band
const aprByBand = {
  'A': 4.5,  // Low risk
  'B': 5.8,  // Medium risk
  'C': 7.2   // High risk
};

// Generate offers for different terms
const terms = [10, 15, 20];
const offers = terms.map(term => ({
  termYears: term,
  apr: aprByBand[riskBand],
  principalUsed: principalAmount,
  monthlyPayment: calculateMonthlyPayment(principalAmount, aprByBand[riskBand], term)
}));
```

---

## Test Credentials

### Admin User
- **Email**: `admin@greenquote.com`
- **Password**: `admin123`
- **Role**: `ADMIN`

### Regular Users
- **Emails**: `testuser1@gmail.com` to `testuser10@gmail.com`
- **Password**: `user123`
- **Role**: `USER`

---

## Rate Limiting

Currently no rate limiting is implemented. Future versions will include:
- Login attempt limiting
- API request throttling
- IP-based rate limiting

---

## CORS Configuration

The API supports CORS for cross-origin requests:
- **Allowed Origins**: All origins (development)
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers**: Content-Type, Authorization

---

## Logging

All API requests and responses are logged with:
- Request ID for tracing
- User ID (when authenticated)
- Method and URL
- Response status
- Error details (when applicable)

Logs are written to:
- Console (development)
- File system (production)
- Structured JSON format
