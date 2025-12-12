# Authentication System Documentation

## Overview

The authentication system implements JWT-based authentication with the following features:

- User registration and login
- Password hashing with bcrypt
- JWT token generation and verification
- Token refresh mechanism
- Role-based access control (RBAC)
- Rate limiting for security
- Comprehensive error handling

## Architecture

### Components

1. **AuthService** (`src/services/authService.ts`)
   - Core business logic for authentication
   - User registration, login, token refresh
   - Password verification and user validation

2. **AuthController** (`src/controllers/authController.ts`)
   - HTTP request handlers
   - Request/response formatting
   - Error propagation

3. **Middleware**
   - `authMiddleware.ts` - JWT verification and user authentication
   - `validationMiddleware.ts` - Request body validation using Zod
   - `errorHandler.ts` - Centralized error handling
   - `rateLimiter.ts` - Rate limiting for API endpoints

4. **Utilities**
   - `jwt.ts` - Token generation and verification
   - `password.ts` - Password hashing and comparison
   - `logger.ts` - Logging functionality

5. **Validators**
   - `authValidators.ts` - Zod schemas for request validation

## API Endpoints

### Public Endpoints

#### POST /api/auth/register

Register a new user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "Password123",
  "name": "User Name",
  "role": "STUDENT" | "TEACHER",
  "phone": "1234567890" (optional)
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "STUDENT",
      "phone": null,
      "avatar": null,
      "isActive": true,
      "createdAt": "2025-11-12T16:29:58.299Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "timestamp": "2025-11-12T16:29:58.310Z"
}
```

#### POST /api/auth/login

Login with email and password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "STUDENT",
      "phone": null,
      "avatar": null,
      "isActive": true,
      "createdAt": "2025-11-12T16:29:58.299Z",
      "updatedAt": "2025-11-12T16:29:58.299Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "timestamp": "2025-11-12T16:30:12.548Z"
}
```

**Rate Limit:** 5 failed attempts per 15 minutes

#### POST /api/auth/refresh

Refresh access token using refresh token.

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "timestamp": "2025-11-12T16:32:45.766Z"
}
```

### Protected Endpoints

#### GET /api/auth/me

Get current user information.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "STUDENT",
    "phone": null,
    "avatar": null,
    "isActive": true,
    "createdAt": "2025-11-12T16:29:58.299Z",
    "updatedAt": "2025-11-12T16:29:58.299Z"
  },
  "timestamp": "2025-11-12T16:30:24.730Z"
}
```

#### POST /api/auth/logout

Logout current user.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "success": true
  },
  "timestamp": "2025-11-12T16:32:56.355Z"
}
```

## Security Features

### Password Security

- Passwords are hashed using bcrypt with 10 salt rounds
- Password requirements:
  - Minimum 8 characters
  - Must contain letters
  - Must contain numbers

### JWT Tokens

- **Access Token:** 15 minutes expiration
- **Refresh Token:** 7 days expiration
- Tokens contain: userId, email, role
- Signed with separate secrets for access and refresh tokens

### Rate Limiting

- **General API:** 100 requests per 15 minutes
- **Login Endpoint:** 5 failed attempts per 15 minutes

### Role-Based Access Control (RBAC)

**Roles:**

- `STUDENT` - Can manage profile, apply to projects, view internships
- `TEACHER` - Can create/manage projects, review applications, manage internships
- `ADMIN` - Can manage users, monitor system

**Permission Matrix:**

```typescript
TEACHER: [
  'project:create',
  'project:update',
  'project:delete',
  'application:view',
  'application:review',
  'internship:manage',
  'evaluation:create',
];

STUDENT: [
  'profile:update',
  'application:create',
  'application:view',
  'internship:view',
  'internship:update',
];

ADMIN: ['user:manage', 'system:monitor', 'data:export'];
```

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {} // Optional
  },
  "timestamp": "2025-11-12T16:30:35.064Z"
}
```

### Common Error Codes

- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `VALIDATION_ERROR` - Invalid input data
- `TOKEN_EXPIRED` - Access token expired
- `INVALID_TOKEN` - Invalid or malformed token
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `LOGIN_RATE_LIMIT_EXCEEDED` - Too many login attempts

## Usage Examples

### Using Authentication Middleware

```typescript
import { authMiddleware, requireRole, requirePermission } from './middleware/authMiddleware';
import { UserRole } from './types';

// Protect route with authentication
router.get('/protected', authMiddleware, handler);

// Require specific role
router.post('/projects', authMiddleware, requireRole(UserRole.TEACHER), handler);

// Require specific permission
router.delete('/projects/:id', authMiddleware, requirePermission('project:delete'), handler);
```

### Client-Side Token Management

```typescript
// Store tokens after login
const { accessToken, refreshToken } = loginResponse.data;
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// Add token to requests
const response = await fetch('/api/protected', {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  },
});

// Handle token expiration
if (response.status === 401) {
  // Try to refresh token
  const refreshResponse = await fetch('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({
      refreshToken: localStorage.getItem('refreshToken'),
    }),
  });

  if (refreshResponse.ok) {
    const { accessToken, refreshToken } = await refreshResponse.json();
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    // Retry original request
  } else {
    // Redirect to login
  }
}
```

## Environment Variables

Required environment variables in `.env`:

```env
# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Server
BACKEND_PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
```

## Testing

Run the authentication test suite:

```bash
cd apps/backend
bun test-auth.ts
```

Test API endpoints manually:

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","name":"Test User","role":"STUDENT"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'

# Get current user
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

## Future Enhancements

- [ ] Email verification for new registrations
- [ ] Password reset functionality
- [ ] Two-factor authentication (2FA)
- [ ] OAuth integration (Google, GitHub)
- [ ] Token blacklisting for logout
- [ ] Session management with Redis
- [ ] Audit logging for authentication events
