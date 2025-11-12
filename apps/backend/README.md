# Backend - Research Internship Matching System

Express.js + TypeScript + Prisma backend service for the Research Internship Matching System.

## Tech Stack

- **Runtime**: Bun
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT
- **AI Integration**: LangChain + LLM APIs
- **Real-time**: Socket.io
- **Validation**: Zod

## Project Structure

```
src/
├── config/           # Configuration files
│   ├── database.ts   # Prisma client setup
│   ├── redis.ts      # Redis client setup
│   └── env.ts        # Environment variables
├── controllers/      # Request handlers
├── services/         # Business logic
├── repositories/     # Data access layer
├── middleware/       # Express middleware
├── validators/       # Zod validation schemas
├── langchain/        # LangChain integration
├── utils/            # Utility functions
│   └── logger.ts     # Winston logger
├── app.ts            # Express app setup
└── index.ts          # Server entry point
```

## Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp ../../.env.example ../../.env
```

### 3. Start Database Services

```bash
# From project root
bun run docker:up
```

### 4. Initialize Database

```bash
# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push

# Or run migrations
bun run db:migrate
```

### 5. Start Development Server

```bash
bun run dev
```

Server will be available at `http://localhost:3000`

## Available Scripts

- `bun run dev` - Start development server with hot reload
- `bun run start` - Start production server
- `bun run db:generate` - Generate Prisma client
- `bun run db:push` - Push schema changes to database
- `bun run db:migrate` - Run database migrations
- `bun run db:studio` - Open Prisma Studio

## API Endpoints

### Health Check

```
GET /api/health
```

Returns server status and uptime.

## Database Schema

The database schema is defined in `prisma/schema.prisma` and includes:

- Users (with roles: TEACHER, STUDENT, ADMIN)
- Teacher and Student Profiles
- Research Projects
- Applications
- Internships
- Evaluations
- Notifications
- Match Cache
- Audit Logs

## Development Notes

- The server uses Express.js for routing and middleware
- Prisma ORM provides type-safe database access
- Redis is used for caching match results and sessions
- LangChain integration enables AI-powered matching
- Socket.io provides real-time notifications
