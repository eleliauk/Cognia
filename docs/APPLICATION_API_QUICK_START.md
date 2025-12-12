# Application Management API - Quick Start Guide

## Quick Reference

### Student Workflow

```bash
# 1. Submit an application
curl -X POST http://localhost:3000/api/applications \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "project-uuid-here",
    "coverLetter": "I am very interested in this research project because I have experience in machine learning and natural language processing. My previous projects include..."
  }'

# 2. View my applications
curl -X GET "http://localhost:3000/api/applications/student/my" \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"

# 3. View applications with filters
curl -X GET "http://localhost:3000/api/applications/student/my?status=PENDING&sortBy=matchScore&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"

# 4. Withdraw an application
curl -X DELETE http://localhost:3000/api/applications/APPLICATION_ID \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"
```

### Teacher Workflow

```bash
# 1. View applications for my project (sorted by match score)
curl -X GET "http://localhost:3000/api/applications/project/PROJECT_ID?sortBy=matchScore&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_TEACHER_TOKEN"

# 2. Filter pending applications
curl -X GET "http://localhost:3000/api/applications/project/PROJECT_ID?status=PENDING" \
  -H "Authorization: Bearer YOUR_TEACHER_TOKEN"

# 3. Accept an application
curl -X PUT http://localhost:3000/api/applications/APPLICATION_ID/status \
  -H "Authorization: Bearer YOUR_TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ACCEPTED",
    "reviewNote": "Excellent match for the project requirements!"
  }'

# 4. Reject an application
curl -X PUT http://localhost:3000/api/applications/APPLICATION_ID/status \
  -H "Authorization: Bearer YOUR_TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "REJECTED",
    "reviewNote": "Thank you for your interest, but we are looking for candidates with more experience in deep learning."
  }'
```

### Admin Workflow

```bash
# 1. View all applications
curl -X GET "http://localhost:3000/api/applications?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 2. Filter by status
curl -X GET "http://localhost:3000/api/applications?status=ACCEPTED" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 3. Filter by project
curl -X GET "http://localhost:3000/api/applications?projectId=PROJECT_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 4. Filter by student
curl -X GET "http://localhost:3000/api/applications?studentId=STUDENT_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Common Use Cases

### Use Case 1: Student Applies to Top Matches

```javascript
// Frontend code example
async function applyToProject(projectId, coverLetter) {
  try {
    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        coverLetter,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log('Application submitted!');
      console.log('Match Score:', result.data.matchScore);
      // Show success message to user
    }
  } catch (error) {
    console.error('Failed to submit application:', error);
  }
}
```

### Use Case 2: Teacher Reviews Applications by Match Score

```javascript
// Frontend code example
async function getTopApplications(projectId) {
  try {
    const response = await fetch(
      `/api/applications/project/${projectId}?sortBy=matchScore&sortOrder=desc&status=PENDING`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    if (result.success) {
      // Display applications sorted by match score
      result.data.forEach((app) => {
        console.log(`Student: ${app.student.name}`);
        console.log(`Match Score: ${app.matchScore}`);
        console.log(`Skills: ${app.student.studentProfile.skills.join(', ')}`);
        console.log('---');
      });
    }
  } catch (error) {
    console.error('Failed to fetch applications:', error);
  }
}
```

### Use Case 3: Batch Accept Top Candidates

```javascript
// Frontend code example
async function acceptTopCandidates(projectId, count = 3) {
  // Get top applications
  const response = await fetch(
    `/api/applications/project/${projectId}?sortBy=matchScore&sortOrder=desc&status=PENDING&limit=${count}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const result = await response.json();

  // Accept each application
  for (const app of result.data) {
    await fetch(`/api/applications/${app.id}/status`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'ACCEPTED',
        reviewNote: `Accepted based on high match score (${app.matchScore})`,
      }),
    });
  }
}
```

## Response Examples

### Successful Application Submission

```json
{
  "success": true,
  "message": "申请提交成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "studentId": "student-uuid",
    "projectId": "project-uuid",
    "coverLetter": "I am very interested...",
    "status": "PENDING",
    "matchScore": 87.5,
    "appliedAt": "2024-01-15T10:30:00.000Z",
    "reviewedAt": null,
    "student": {
      "id": "student-uuid",
      "name": "John Doe",
      "email": "john@university.edu",
      "studentProfile": {
        "major": "Computer Science",
        "grade": 3,
        "gpa": 3.8,
        "skills": ["Python", "Machine Learning", "NLP"],
        "researchInterests": ["AI", "Deep Learning"],
        "completeness": 85
      }
    },
    "project": {
      "id": "project-uuid",
      "title": "Natural Language Processing Research",
      "description": "Research on transformer models...",
      "teacher": {
        "id": "teacher-uuid",
        "name": "Dr. Smith",
        "email": "smith@university.edu"
      }
    }
  }
}
```

### Application List with Pagination

```json
{
  "success": true,
  "data": [
    {
      "id": "app-1",
      "status": "PENDING",
      "matchScore": 92.3,
      "appliedAt": "2024-01-15T10:30:00.000Z",
      "project": {
        "title": "AI Research Project",
        "teacher": { "name": "Dr. Smith" }
      }
    },
    {
      "id": "app-2",
      "status": "ACCEPTED",
      "matchScore": 88.7,
      "appliedAt": "2024-01-14T09:15:00.000Z",
      "project": {
        "title": "Machine Learning Study",
        "teacher": { "name": "Prof. Johnson" }
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

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_APPLICATION",
    "message": "您已经申请过该项目"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Status Codes

| Code | Meaning      | Common Causes                                         |
| ---- | ------------ | ----------------------------------------------------- |
| 200  | Success      | GET requests successful                               |
| 201  | Created      | Application submitted successfully                    |
| 400  | Bad Request  | Validation error, duplicate application, project full |
| 401  | Unauthorized | Missing or invalid token                              |
| 403  | Forbidden    | Insufficient permissions                              |
| 404  | Not Found    | Application or project not found                      |
| 500  | Server Error | Internal server error                                 |

## Tips and Best Practices

### For Students

1. **Complete Your Profile First**: Ensure your student profile is complete before applying (aim for 80%+ completeness)
2. **Write Detailed Cover Letters**: Minimum 50 characters, but aim for 200-500 for better context
3. **Check Match Scores**: Focus on projects with match scores > 70 for better chances
4. **Apply Early**: Projects have limited positions, apply as soon as you find a good match
5. **Track Your Applications**: Regularly check application status

### For Teachers

1. **Sort by Match Score**: Review applications sorted by match score to find best candidates quickly
2. **Review Promptly**: Update application status promptly to keep students informed
3. **Use Review Notes**: Add notes when accepting/rejecting to provide feedback
4. **Check Student Profiles**: Review the complete student profile, not just the cover letter
5. **Monitor Positions**: Keep track of accepted applications vs. available positions

### For Developers

1. **Handle Match Score Failures**: The system gracefully handles LLM failures, but monitor error rates
2. **Cache Awareness**: Match scores are cached for 1 hour, consider cache invalidation strategies
3. **Pagination**: Always use pagination for list endpoints to avoid performance issues
4. **Error Handling**: Implement proper error handling for all API calls
5. **Real-time Updates**: Consider WebSocket integration for real-time status updates

## Environment Variables

Required environment variables for the application module:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/internship_db"

# Redis (for match score caching)
REDIS_URL="redis://localhost:6379"

# LLM Configuration (for match score calculation)
LLM_PROVIDER="deepseek"  # or "openai", "wenxin"
LLM_API_KEY="your-api-key"
LLM_BASE_URL="https://api.deepseek.com/v1"
LLM_MODEL="deepseek-chat"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="15m"
```

## Troubleshooting

### Problem: "请先完善学生档案后再申请"

**Solution**: Create or update your student profile first using the student profile API.

### Problem: "您已经申请过该项目"

**Solution**: You can only apply to each project once. Check your existing applications.

### Problem: "该项目名额已满"

**Solution**: The project has reached its position limit. Try other projects.

### Problem: Match score is null

**Solution**: This happens when LLM calculation fails. The application is still valid, but without a match score.

### Problem: "无权限查看此申请"

**Solution**: You can only view:

- Your own applications (as student)
- Applications for your projects (as teacher)
- All applications (as admin)

## Support

For issues or questions:

1. Check the full API documentation: `docs/APPLICATION_MANAGEMENT_API.md`
2. Review the implementation summary: `docs/TASK_7_IMPLEMENTATION_SUMMARY.md`
3. Check server logs for detailed error messages
4. Verify your authentication token is valid and has the correct role

## Related Documentation

- [Authentication API](./AUTHENTICATION.md)
- [Project Management API](./PROJECT_MANAGEMENT_API.md)
- [Matching Engine](./MATCHING_ENGINE.md)
- [Full API Documentation](./APPLICATION_MANAGEMENT_API.md)
