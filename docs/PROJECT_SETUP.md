# Project Setup Guide

This document describes the initial project setup and infrastructure configuration for the Research Internship Matching System.

## Project Structure

The project follows a monorepo architecture with the following structure:

```
research-internship-system/
├── apps/
│   ├── backend/              # Express.js backend service
│   │   ├── src/
│   │   │   ├── config/       # Configuration files
│   │   │   ├── controllers/  # Request handlers
│   │   │   ├── services/     # Business logic
│   │   │   ├── repositories/ # Data access layer
│   │   │   ├── middleware/   # Express middleware
│   │   │   ├── validators/   # Zod validation schemas
│   │   │   ├── langchain/    # LangChain integration
│   │   │   ├── utils/        # Utility functions
│   │   │   ├── app.ts        # Express app setup
│   │   │   └── index.ts      # Server entry point
│   │   ├── prisma/
│   │   │   └── schema.prisma # Database schema
│   │   └── package.json
│   │
│   └── frontend/             # React frontend application
│       ├── src/
│       │   ├── components/   # React components
│       │   ├── pages/        # Page components
│       │   ├── hooks/        # Custom hooks
│       │   ├── stores/       # Zustand state management
│       │   ├── services/     # API services
│       │   ├── types/        # TypeScript types
│       │   └── lib/          # Utility functions
│       └── package.json
│
├── packages/
│   └── shared/               # Shared code and types
│       ├── src/
│       │   ├── types/        # Shared TypeScript types
│       │   └── utils/        # Shared utilities
│       └── package.json
│
├── .kiro/
│   └── specs/                # Project specifications
│       └── research-internship-matching-system/
│           ├── requirements.md
│           ├── design.md
│           └── tasks.md
│
├── docker-compose.yml        # Docker services configuration
├── .eslintrc.json            # ESLint configuration
├── .prettierrc.json          # Prettier configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Root package configuration
```

## Technology Stack

### Backend

- **Runtime**: Bun
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Cache**: Redis 7
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **AI Integration**: LangChain + OpenAI-compatible APIs
- **Real-time**: Socket.io
- **Security**: Helmet, CORS, bcrypt
- **Logging**: Winston
- **Rate Limiting**: express-rate-limit

### Frontend

- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite (via Bun)
- **Styling**: TailwindCSS 4
- **Routing**: React Router DOM
- **State Management**: Zustand
- **Server State**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Real-time**: Socket.io-client
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **UI Components**: Radix UI + shadcn/ui

### Development Tools

- **Package Manager**: Bun
- **Linting**: ESLint
- **Formatting**: Prettier
- **Git Hooks**: Husky + lint-staged
- **Containerization**: Docker + Docker Compose

## Initial Setup Completed

### ✅ 1. Monorepo Structure

- Created `apps/backend` for the Express.js backend
- Created `apps/frontend` for the React frontend
- Created `packages/shared` for shared code and types
- Configured workspace dependencies

### ✅ 2. TypeScript Configuration

- Root `tsconfig.json` with strict mode enabled
- Path mapping for workspace packages (`@cognia/shared`)
- Configured for ESNext and bundler module resolution
- Individual tsconfig files for each workspace

### ✅ 3. ESLint Configuration

- Configured for TypeScript and React
- Integrated with Prettier
- Rules for React hooks and TypeScript best practices
- Workspace-wide linting support

### ✅ 4. Prettier Configuration

- Consistent code formatting across the project
- Configured for 100 character line width
- Single quotes and semicolons enabled
- Integrated with ESLint

### ✅ 5. Git Repository

- Initialized Git repository
- Comprehensive `.gitignore` file
- Configured Husky for Git hooks
- lint-staged for pre-commit checks

### ✅ 6. Docker Compose Configuration

- PostgreSQL 16 Alpine container
  - Port: 5432
  - Database: research_internship
  - Health checks enabled
  - Persistent volume: postgres-data
- Redis 7 Alpine container
  - Port: 6379
  - Password protected
  - Health checks enabled
  - Persistent volume: redis-data

### ✅ 7. Backend Infrastructure

- Express.js application setup
- Prisma ORM configuration with complete schema
- Database connection management
- Redis client configuration
- Environment variable management
- Winston logger setup
- Basic middleware (CORS, Helmet, body parsing)
- Health check endpoint

### ✅ 8. Frontend Infrastructure

- React 19 with TypeScript
- TailwindCSS 4 configuration
- React Router DOM for routing
- Zustand for state management
- React Query for server state
- Axios for HTTP requests
- Socket.io-client for real-time features

### ✅ 9. Database Schema

Complete Prisma schema with:

- User management (TEACHER, STUDENT, ADMIN roles)
- Teacher and Student profiles
- Research projects
- Applications
- Internships with milestones and documents
- Evaluations
- Notifications
- Match cache
- Audit logs

### ✅ 10. Dependencies Installed

All required dependencies for backend and frontend have been installed and verified.

## Environment Configuration

The project uses environment variables for configuration. A `.env.example` file is provided as a template.

### Required Environment Variables

```bash
# Backend
BACKEND_PORT=3000
NODE_ENV=development

# Frontend
FRONTEND_PORT=8080
VITE_API_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/research_internship?schema=public

# Redis
REDIS_URL=redis://:redis@localhost:6379

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# LLM API
LLM_PROVIDER=deepseek
LLM_API_KEY=your-api-key
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat
```

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Start Docker Services

```bash
bun run docker:up
```

### 3. Initialize Database

```bash
bun run --filter backend db:push
```

### 4. Start Development Servers

```bash
# Start both frontend and backend
bun run dev

# Or start individually
bun run dev:backend  # http://localhost:3000
bun run dev:frontend # http://localhost:8080
```

## Verification

### Backend Health Check

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "Server is running",
  "data": {
    "uptime": 10.123,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Docker Services Status

```bash
docker compose ps
```

Both PostgreSQL and Redis should show as "healthy".

### Database Connection

```bash
bun run --filter backend db:studio
```

Opens Prisma Studio to view and manage database data.

## Next Steps

The infrastructure is now ready for feature implementation. The next tasks include:

1. **Authentication System** (Task 3)
   - User registration and login
   - JWT token management
   - Role-based access control

2. **User Profile Management** (Task 4)
   - Teacher and student profile CRUD
   - Profile validation

3. **Project Management** (Task 5)
   - Project CRUD operations
   - Project search and filtering

4. **LangChain Matching Engine** (Task 6)
   - LLM integration
   - Semantic matching algorithm
   - Caching strategy

And so on, following the implementation plan in `tasks.md`.

## Troubleshooting

### Docker Services Won't Start

```bash
# Check if ports are already in use
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Stop and remove containers
docker compose down -v

# Start fresh
docker compose up -d
```

### Database Connection Issues

```bash
# Verify DATABASE_URL in .env
# Ensure PostgreSQL container is healthy
docker compose ps

# Test connection
docker exec -it research-internship-postgres psql -U postgres -d research_internship
```

### Prisma Issues

```bash
# Regenerate Prisma client
bun run --filter backend db:generate

# Reset database (WARNING: deletes all data)
bun run --filter backend db:push --force-reset
```

## Additional Resources

- [Bun Documentation](https://bun.sh/docs)
- [Express.js Guide](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Documentation](https://react.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [LangChain Documentation](https://js.langchain.com/)
