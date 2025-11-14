# Application Management API Documentation

## Overview

The Application Management module provides APIs for students to apply to research projects and for teachers to review and manage applications. It includes intelligent matching score calculation and duplicate application prevention.

## Features

- ✅ Submit applications with automatic match score calculation
- ✅ Duplicate application prevention
- ✅ Application status management (PENDING, REVIEWING, ACCEPTED, REJECTED, WITHDRAWN)
- ✅ Teacher application review and filtering
- ✅ Student application tracking
- ✅ Match score integration with LangChain matching engine

## API Endpoints

### Student Endpoints

#### 1. Submit Application

Submit an application to a research project.

**Endpoint:** `POST /api/applications`

**Authentication:** Required (Student role)

**Request Body:**

```json
{
  "projectId": "uuid",
  "coverLetter": "string (50-2000 characters)",
  "calculateMatch": true // Optional, defaults to true
}
```

**Response:**

```json
{
  "success": true,
  "message": "申请提交成功",
  "data": {
    "id": "uuid",
    "studentId": "uuid",
    "projectId": "uuid",
    "coverLetter": "string",
    "status": "PENDING",
    "matchScore": 85.5,
    "appliedAt": "2024-01-15T10:30:00Z",
    "reviewedAt": null,
    "student": { ... },
    "project": { ... }
  }
}
```

**Error Responses:**

- `400` - Validation error (invalid projectId, coverLetter too short/long)
- `400` - "请先完善学生档案后再申请"
- `400` - "项目不存在"
- `400` - "该项目当前不接受申请"
- `400` - "您已经申请过该项目"
- `400` - "该项目名额已满"

---

#### 2. Get My Applications

Get the current student's application list.

**Endpoint:** `GET /api/applications/student/my`

**Authentication:** Required (Student role)

**Query Parameters:**

- `status` (optional): Filter by status (PENDING, REVIEWING, ACCEPTED, REJECTED, WITHDRAWN)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sortBy` (optional): Sort field (appliedAt, matchScore, status) (default: appliedAt)
- `sortOrder` (optional): Sort order (asc, desc) (default: desc)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "studentId": "uuid",
      "projectId": "uuid",
      "coverLetter": "string",
      "status": "PENDING",
      "matchScore": 85.5,
      "appliedAt": "2024-01-15T10:30:00Z",
      "reviewedAt": null,
      "project": {
        "id": "uuid",
        "title": "AI Research Project",
        "description": "...",
        "teacher": {
          "id": "uuid",
          "name": "Dr. Smith",
          "email": "smith@university.edu"
        }
      }
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

#### 3. Withdraw Application

Withdraw a pending or reviewing application.

**Endpoint:** `DELETE /api/applications/:id`

**Authentication:** Required (Student role)

**Response:**

```json
{
  "success": true,
  "message": "申请已撤回",
  "data": {
    "id": "uuid",
    "status": "WITHDRAWN",
    ...
  }
}
```

**Error Responses:**

- `400` - "申请不存在"
- `403` - "无权限撤回此申请"
- `400` - "当前状态的申请无法撤回"

---

### Teacher Endpoints

#### 4. Get Project Applications

Get all applications for a specific project (teacher only).

**Endpoint:** `GET /api/applications/project/:projectId`

**Authentication:** Required (Teacher role)

**Query Parameters:**

- `status` (optional): Filter by status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Sort field (default: appliedAt)
- `sortOrder` (optional): Sort order (default: desc)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "studentId": "uuid",
      "projectId": "uuid",
      "coverLetter": "string",
      "status": "PENDING",
      "matchScore": 85.5,
      "appliedAt": "2024-01-15T10:30:00Z",
      "reviewedAt": null,
      "student": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@university.edu",
        "studentProfile": {
          "major": "Computer Science",
          "grade": 3,
          "gpa": 3.8,
          "skills": ["Python", "Machine Learning"],
          "researchInterests": ["AI", "NLP"],
          "completeness": 85
        }
      }
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

**Error Responses:**

- `400` - "项目不存在"
- `403` - "无权限查看此项目的申请"

---

#### 5. Update Application Status

Update the status of an application (teacher only).

**Endpoint:** `PUT /api/applications/:id/status`

**Authentication:** Required (Teacher role)

**Request Body:**

```json
{
  "status": "ACCEPTED", // PENDING, REVIEWING, ACCEPTED, REJECTED
  "reviewNote": "string (optional, max 500 characters)"
}
```

**Response:**

```json
{
  "success": true,
  "message": "申请状态更新成功",
  "data": {
    "id": "uuid",
    "status": "ACCEPTED",
    "reviewedAt": "2024-01-15T11:00:00Z",
    ...
  }
}
```

**Error Responses:**

- `400` - "申请不存在"
- `403` - "无权限修改此申请状态"
- `400` - "项目名额已满，无法接受更多申请"

---

### Common Endpoints

#### 6. Get Application Details

Get detailed information about a specific application.

**Endpoint:** `GET /api/applications/:id`

**Authentication:** Required

**Authorization:**

- Student: Can only view their own applications
- Teacher: Can only view applications for their projects
- Admin: Can view all applications

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "studentId": "uuid",
    "projectId": "uuid",
    "coverLetter": "string",
    "status": "PENDING",
    "matchScore": 85.5,
    "appliedAt": "2024-01-15T10:30:00Z",
    "reviewedAt": null,
    "student": { ... },
    "project": { ... }
  }
}
```

**Error Responses:**

- `404` - "申请不存在"
- `403` - "无权限查看此申请"

---

### Admin Endpoints

#### 7. Get All Applications

Get all applications in the system (admin only).

**Endpoint:** `GET /api/applications`

**Authentication:** Required (Admin role)

**Query Parameters:**

- `status` (optional): Filter by status
- `projectId` (optional): Filter by project
- `studentId` (optional): Filter by student
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Sort field (default: appliedAt)
- `sortOrder` (optional): Sort order (default: desc)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "studentId": "uuid",
      "projectId": "uuid",
      "status": "PENDING",
      "matchScore": 85.5,
      "appliedAt": "2024-01-15T10:30:00Z",
      "student": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@university.edu",
        "studentProfile": {
          "major": "Computer Science",
          "grade": 3,
          "gpa": 3.8
        }
      },
      "project": {
        "id": "uuid",
        "title": "AI Research Project",
        "researchField": "Artificial Intelligence",
        "teacher": {
          "id": "uuid",
          "name": "Dr. Smith",
          "email": "smith@university.edu"
        }
      }
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

## Application Status Flow

```
PENDING → REVIEWING → ACCEPTED
                   → REJECTED
        → WITHDRAWN (by student)
```

### Status Descriptions

- **PENDING**: Application submitted, waiting for teacher review
- **REVIEWING**: Teacher is reviewing the application
- **ACCEPTED**: Application accepted by teacher
- **REJECTED**: Application rejected by teacher
- **WITHDRAWN**: Application withdrawn by student

### Status Transition Rules

1. Students can only withdraw applications in PENDING or REVIEWING status
2. Teachers can change status from PENDING to REVIEWING, ACCEPTED, or REJECTED
3. Once ACCEPTED or REJECTED, the status cannot be changed
4. WITHDRAWN applications cannot be reactivated

---

## Match Score Calculation

When a student submits an application, the system automatically calculates a match score using the LangChain-based matching engine:

1. **Automatic Calculation**: By default, match score is calculated when submitting
2. **Optional Skip**: Set `calculateMatch: false` to skip calculation
3. **Cached Results**: Match scores are cached for 1 hour to improve performance
4. **Fallback**: If LLM fails, application is still submitted with null match score

### Match Score Components

- **Overall Score** (0-100): Weighted average of all components
- **Skill Match** (0-100): Alignment between student skills and project requirements
- **Interest Match** (0-100): Alignment between research interests and project field
- **Experience Match** (0-100): Relevance of past project experience

---

## Duplicate Application Prevention

The system prevents duplicate applications using a unique constraint:

```sql
UNIQUE(studentId, projectId)
```

If a student tries to apply to the same project twice, they will receive an error:

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_APPLICATION",
    "message": "您已经申请过该项目"
  }
}
```

---

## Position Limit Enforcement

Projects have a `positions` field that limits the number of accepted applications:

1. When accepting an application, the system checks if positions are available
2. If the project is full, the teacher receives an error
3. Accepted count is calculated in real-time

---

## Integration with Other Modules

### Matching Engine

- Calculates match scores using LLM
- Provides reasoning and suggestions
- Caches results for performance

### Notification System (TODO)

- Notify teacher when application is submitted
- Notify student when application status changes
- Real-time WebSocket notifications

### Internship Tracking (TODO)

- Automatically create internship record when application is accepted
- Link application to internship for tracking

---

## Example Usage

### Student Applies to Project

```bash
# 1. Student submits application
curl -X POST http://localhost:3000/api/applications \
  -H "Authorization: Bearer <student_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "project-uuid",
    "coverLetter": "I am very interested in this AI research project because..."
  }'

# 2. Student checks their applications
curl -X GET "http://localhost:3000/api/applications/student/my?status=PENDING" \
  -H "Authorization: Bearer <student_token>"
```

### Teacher Reviews Applications

```bash
# 1. Teacher gets applications for their project
curl -X GET "http://localhost:3000/api/applications/project/project-uuid?sortBy=matchScore&sortOrder=desc" \
  -H "Authorization: Bearer <teacher_token>"

# 2. Teacher accepts an application
curl -X PUT http://localhost:3000/api/applications/application-uuid/status \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ACCEPTED",
    "reviewNote": "Great match for the project!"
  }'
```

---

## Error Handling

All errors follow the standard error response format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional validation details
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Invalid input data
- `RESOURCE_NOT_FOUND`: Application/Project not found
- `INSUFFICIENT_PERMISSIONS`: User lacks permission
- `DUPLICATE_APPLICATION`: Application already exists
- `PROJECT_NOT_ACTIVE`: Project not accepting applications
- `POSITIONS_FULL`: Project has no available positions

---

## Testing

### Manual Testing

Use the provided curl examples or tools like Postman to test the endpoints.

### Integration Testing

```typescript
describe('Application Management', () => {
  it('should submit application with match score', async () => {
    const response = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        projectId: testProjectId,
        coverLetter: 'I am interested in this project...',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.matchScore).toBeGreaterThan(0);
  });

  it('should prevent duplicate applications', async () => {
    // Submit first application
    await submitApplication(studentId, projectId);

    // Try to submit again
    const response = await submitApplication(studentId, projectId);
    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain('已经申请过');
  });
});
```

---

## Performance Considerations

1. **Match Score Caching**: Results cached for 1 hour in Redis
2. **Database Indexes**: Indexes on studentId, projectId, status, appliedAt
3. **Pagination**: All list endpoints support pagination
4. **Eager Loading**: Related data loaded efficiently with Prisma includes

---

## Future Enhancements

- [ ] Batch application status updates
- [ ] Application templates for students
- [ ] Advanced filtering (by GPA, skills, etc.)
- [ ] Application analytics dashboard
- [ ] Email notifications
- [ ] Application deadline management
- [ ] Interview scheduling integration
