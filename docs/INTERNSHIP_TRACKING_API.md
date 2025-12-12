# Internship Tracking API Documentation

## Overview

The Internship Tracking module provides comprehensive APIs for managing internships, milestones, and documents throughout the research internship lifecycle.

## Base URL

```
/api/internships
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Internship Management

### Create Internship

Creates a new internship record when an application is accepted.

**Endpoint:** `POST /api/internships`

**Request Body:**

```json
{
  "applicationId": "uuid"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "applicationId": "uuid",
    "studentId": "uuid",
    "projectId": "uuid",
    "status": "IN_PROGRESS",
    "progress": 0,
    "startDate": "2024-01-15T10:00:00Z",
    "endDate": null,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "application": { ... },
    "milestones": [],
    "documents": []
  },
  "message": "Internship created successfully"
}
```

**Errors:**

- `400` - Application not found or not accepted
- `409` - Internship already exists for this application

---

### Get Internship by ID

Retrieves detailed information about a specific internship.

**Endpoint:** `GET /api/internships/:id`

**Authorization:**

- Students can view their own internships
- Teachers can view internships for their projects
- Admins can view all internships

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "applicationId": "uuid",
    "studentId": "uuid",
    "projectId": "uuid",
    "status": "IN_PROGRESS",
    "progress": 45,
    "startDate": "2024-01-15T10:00:00Z",
    "endDate": null,
    "application": {
      "student": {
        "id": "uuid",
        "name": "张三",
        "email": "student@example.com"
      },
      "project": {
        "id": "uuid",
        "title": "机器学习研究项目",
        "description": "...",
        "teacher": {
          "id": "uuid",
          "name": "李教授",
          "email": "teacher@example.com"
        }
      }
    },
    "milestones": [...],
    "documents": [...],
    "evaluation": null
  }
}
```

---

### Get Student's Internships

Retrieves all internships for a specific student.

**Endpoint:** `GET /api/students/:studentId/internships`

**Authorization:**

- Students can only view their own internships
- Admins can view any student's internships

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "IN_PROGRESS",
      "progress": 45,
      "application": {
        "project": {
          "title": "机器学习研究项目",
          "teacher": { ... }
        }
      },
      "milestones": [...],
      "documents": [...]
    }
  ],
  "count": 1
}
```

---

### Get Teacher's Internships

Retrieves all internships for projects owned by a specific teacher.

**Endpoint:** `GET /api/teachers/:teacherId/internships`

**Authorization:**

- Teachers can only view their own internships
- Admins can view any teacher's internships

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "IN_PROGRESS",
      "progress": 45,
      "application": {
        "student": {
          "name": "张三",
          "email": "student@example.com"
        },
        "project": {
          "title": "机器学习研究项目"
        }
      },
      "milestones": [...],
      "documents": [...]
    }
  ],
  "count": 3
}
```

---

### Update Internship Progress

Updates the progress percentage and optionally the status of an internship.

**Endpoint:** `PUT /api/internships/:id/progress`

**Authorization:**

- Students, teachers (of the project), and admins can update progress

**Request Body:**

```json
{
  "progress": 75,
  "status": "IN_PROGRESS"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { ... },
  "message": "Internship progress updated successfully"
}
```

**Validation:**

- `progress` must be between 0 and 100
- `status` must be one of: `IN_PROGRESS`, `PAUSED`, `COMPLETED`, `TERMINATED`

---

### Update Internship Status

Updates only the status of an internship.

**Endpoint:** `PUT /api/internships/:id/status`

**Authorization:**

- Only teachers (of the project) and admins can update status

**Request Body:**

```json
{
  "status": "COMPLETED"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { ... },
  "message": "Internship status updated successfully"
}
```

**Note:** Setting status to `COMPLETED` or `TERMINATED` automatically sets the `endDate`.

---

## Milestone Management

### Create Milestone

Creates a new milestone for an internship.

**Endpoint:** `POST /api/internships/:id/milestones`

**Authorization:**

- Only teachers (of the project) and admins can create milestones

**Request Body:**

```json
{
  "title": "完成文献综述",
  "description": "阅读并总结至少20篇相关论文",
  "dueDate": "2024-02-15T23:59:59Z"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "internshipId": "uuid",
    "title": "完成文献综述",
    "description": "阅读并总结至少20篇相关论文",
    "dueDate": "2024-02-15T23:59:59Z",
    "completed": false,
    "completedAt": null
  },
  "message": "Milestone created successfully"
}
```

---

### Get Milestones

Retrieves all milestones for an internship.

**Endpoint:** `GET /api/internships/:id/milestones`

**Authorization:**

- Students, teachers, and admins with access to the internship can view milestones

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "完成文献综述",
      "description": "阅读并总结至少20篇相关论文",
      "dueDate": "2024-02-15T23:59:59Z",
      "completed": true,
      "completedAt": "2024-02-10T14:30:00Z"
    },
    {
      "id": "uuid",
      "title": "实现原型系统",
      "description": "完成系统核心功能的原型开发",
      "dueDate": "2024-03-15T23:59:59Z",
      "completed": false,
      "completedAt": null
    }
  ],
  "count": 2
}
```

---

### Update Milestone

Updates milestone details.

**Endpoint:** `PUT /api/internships/:internshipId/milestones/:milestoneId`

**Authorization:**

- Students, teachers, and admins with access can update milestones

**Request Body:**

```json
{
  "title": "完成文献综述（更新）",
  "description": "阅读并总结至少30篇相关论文",
  "dueDate": "2024-02-20T23:59:59Z",
  "completed": true
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { ... },
  "message": "Milestone updated successfully"
}
```

**Note:** All fields are optional. Setting `completed: true` automatically sets `completedAt`.

---

### Delete Milestone

Deletes a milestone.

**Endpoint:** `DELETE /api/internships/:internshipId/milestones/:milestoneId`

**Authorization:**

- Only teachers (of the project) and admins can delete milestones

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Milestone deleted successfully"
}
```

---

### Mark Milestone as Completed

Marks a milestone as completed.

**Endpoint:** `PUT /api/internships/:internshipId/milestones/:milestoneId/complete`

**Authorization:**

- Students, teachers, and admins with access can mark milestones as completed

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "completed": true,
    "completedAt": "2024-02-10T14:30:00Z",
    ...
  },
  "message": "Milestone marked as completed"
}
```

---

## Document Management

### Upload Document

Uploads a document file to an internship.

**Endpoint:** `POST /api/internships/:id/documents`

**Content-Type:** `multipart/form-data`

**Authorization:**

- Students, teachers, and admins with access can upload documents

**Request:**

```
POST /api/internships/uuid/documents
Content-Type: multipart/form-data

file: <binary file data>
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "internshipId": "uuid",
    "filename": "1705320000000-abc123def456.pdf",
    "fileUrl": "/uploads/1705320000000-abc123def456.pdf",
    "uploadedBy": "uuid",
    "uploadedAt": "2024-01-15T10:00:00Z",
    "fileSize": 1048576,
    "mimeType": "application/pdf"
  },
  "message": "Document uploaded successfully"
}
```

**File Restrictions:**

- Maximum file size: 10MB
- Allowed types:
  - Documents: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
  - Images: JPEG, PNG, GIF
  - Archives: ZIP

**Errors:**

- `400` - No file uploaded or invalid file type
- `413` - File size exceeds limit

---

### Get Documents

Retrieves all documents for an internship.

**Endpoint:** `GET /api/internships/:id/documents`

**Authorization:**

- Students, teachers, and admins with access can view documents

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "filename": "1705320000000-abc123def456.pdf",
      "fileUrl": "/uploads/1705320000000-abc123def456.pdf",
      "uploadedBy": "uuid",
      "uploadedAt": "2024-01-15T10:00:00Z",
      "fileSize": 1048576,
      "mimeType": "application/pdf"
    }
  ],
  "count": 1
}
```

---

### Delete Document

Deletes a document file and its record.

**Endpoint:** `DELETE /api/internships/:internshipId/documents/:documentId`

**Authorization:**

- The uploader, teacher (of the project), or admin can delete documents

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

**Note:** This permanently deletes both the file from storage and the database record.

---

## Internship Status Flow

```
APPLICATION_ACCEPTED
        ↓
   IN_PROGRESS ←→ PAUSED
        ↓
   COMPLETED / TERMINATED
```

**Status Descriptions:**

- `IN_PROGRESS`: Internship is actively ongoing
- `PAUSED`: Internship is temporarily paused
- `COMPLETED`: Internship finished successfully
- `TERMINATED`: Internship ended prematurely

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "progress": "Progress must be between 0 and 100"
    }
  }
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource"
  }
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Internship not found"
  }
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

## Usage Examples

### Complete Workflow Example

```javascript
// 1. Create internship (after application is accepted)
const internship = await fetch('/api/internships', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    applicationId: 'app-uuid',
  }),
});

// 2. Teacher creates milestones
await fetch(`/api/internships/${internship.id}/milestones`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: '完成文献综述',
    description: '阅读并总结至少20篇相关论文',
    dueDate: '2024-02-15T23:59:59Z',
  }),
});

// 3. Student uploads document
const formData = new FormData();
formData.append('file', fileInput.files[0]);

await fetch(`/api/internships/${internship.id}/documents`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

// 4. Update progress
await fetch(`/api/internships/${internship.id}/progress`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    progress: 50,
  }),
});

// 5. Mark milestone as completed
await fetch(`/api/internships/${internship.id}/milestones/${milestone.id}/complete`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// 6. Complete internship
await fetch(`/api/internships/${internship.id}/status`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    status: 'COMPLETED',
  }),
});
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- File uploads use multipart/form-data encoding
- Uploaded files are stored locally in the `uploads/` directory
- File URLs are relative paths that can be accessed via the static file server
- Progress values are integers from 0 to 100
- Milestones are automatically sorted by due date
- Documents are automatically sorted by upload date (newest first)
