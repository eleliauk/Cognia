# Project Management API Documentation

## Overview

The Project Management module provides comprehensive CRUD operations for research projects, including search, filtering, and status management capabilities.

## Endpoints

### Public Routes (Authenticated Users)

#### GET /api/projects

Search and filter projects with pagination.

**Query Parameters:**

- `keyword` (optional): Search in title, description, and requirements
- `researchField` (optional): Filter by research field
- `status` (optional): Filter by status (DRAFT, ACTIVE, CLOSED, COMPLETED)
- `requiredSkills` (optional): Array of skills to filter by
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

#### GET /api/projects/active

Get all active projects.

#### GET /api/projects/:id

Get project details by ID.

#### GET /api/projects/:id/applications

Get all applications for a specific project (teacher only).

### Teacher Routes

#### GET /api/projects/teacher/my-projects

Get current teacher's projects.

#### GET /api/projects/teacher/:teacherId

Get projects by teacher ID (admin or self only).

#### POST /api/projects

Create a new project.

**Request Body:**

```json
{
  "title": "机器学习在医疗诊断中的应用研究",
  "description": "本项目旨在研究机器学习算法...",
  "requirements": "需要具备Python编程基础...",
  "requiredSkills": ["Python", "Machine Learning", "Deep Learning"],
  "researchField": "人工智能与医疗",
  "duration": 6,
  "positions": 2,
  "startDate": "2024-03-01T00:00:00.000Z"
}
```

#### PUT /api/projects/:id

Update a project (teacher only, own projects).

**Request Body:** (all fields optional)

```json
{
  "title": "Updated title",
  "positions": 3,
  "status": "ACTIVE"
}
```

#### DELETE /api/projects/:id

Delete a project (teacher only, own projects, no accepted applications).

#### PATCH /api/projects/:id/status

Update project status.

**Request Body:**

```json
{
  "status": "ACTIVE"
}
```

## Project Status Flow

```
DRAFT → ACTIVE → CLOSED
              ↓
          COMPLETED
```

- **DRAFT**: Initial state, not visible to students
- **ACTIVE**: Open for applications
- **CLOSED**: No longer accepting applications
- **COMPLETED**: Project finished

## Validation Rules

### Create/Update Project

- Title: 5-100 characters
- Description: 20-2000 characters
- Requirements: minimum 10 characters
- Required Skills: 1-20 skills
- Duration: 1-24 months
- Positions: 1-10 students

## Error Responses

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "项目标题至少5个字符",
    "details": {...}
  }
}
```

## Common Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `RESOURCE_NOT_FOUND`: Project not found
- `INSUFFICIENT_PERMISSIONS`: User lacks permission
- `UNAUTHORIZED`: Not authenticated

## Examples

### Create a Project

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Research Project",
    "description": "Research on artificial intelligence...",
    "requirements": "Python, ML basics required",
    "requiredSkills": ["Python", "Machine Learning"],
    "researchField": "Artificial Intelligence",
    "duration": 6,
    "positions": 2,
    "startDate": "2024-03-01T00:00:00.000Z"
  }'
```

### Search Projects

```bash
curl "http://localhost:3000/api/projects?keyword=机器学习&status=ACTIVE&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Project Status

```bash
curl -X PATCH http://localhost:3000/api/projects/PROJECT_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "ACTIVE"}'
```

## Implementation Details

### Service Layer

- `ProjectService`: Business logic for project management
- Includes permission checks (teacher can only modify own projects)
- Prevents deletion of projects with accepted applications
- Supports complex search with multiple filters

### Database Queries

- Optimized with Prisma includes to avoid N+1 queries
- Indexed fields: teacherId, status, researchField
- Pagination support for large datasets

### Security

- All routes require authentication
- Teachers can only modify their own projects
- Admins can view all projects
- Input validation with Zod schemas
