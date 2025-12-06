# Usage Examples

## Creating a New Lesson

1. Log in to your account
2. Navigate to the Dashboard
3. Fill in the "Create New Lesson" form:
   - Subject: e.g., "Mathematics"
   - Level: beginner/intermediate/advanced
   - Language: Arabic or English
4. Click "Generate Lesson"
5. The AI will create a personalized lesson plan

## Taking a Quiz

1. Open any lesson from your dashboard
2. Review the lesson content on the left panel
3. Use the scratchpad on the right for notes
4. Click "Start Quiz" when ready
5. Answer all questions
6. Submit to see your score

## API Examples

### Generate a Lesson

```bash
curl -X POST http://localhost:5000/api/lessons/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "subject": "Physics",
    "level": "intermediate",
    "language": "Arabic"
  }'
```

### Get All Lessons

```bash
curl -X GET http://localhost:5000/api/lessons \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Generate Quiz for a Lesson

```bash
curl -X POST http://localhost:5000/api/quizzes/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "lessonId": 1
  }'
```
