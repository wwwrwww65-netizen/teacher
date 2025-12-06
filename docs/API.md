# API Documentation

## Authentication

### Register

**POST** `/api/auth/register`

Request Body:
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "student" | "teacher" | "admin"
}
```

Response:
```json
{
  "user": {
    "id": 1,
    "username": "string",
    "email": "string",
    "role": "student"
  },
  "token": "jwt_token_here"
}
```

### Login

**POST** `/api/auth/login`

Request Body:
```json
{
  "email": "string",
  "password": "string"
}
```

Response:
```json
{
  "user": {
    "id": 1,
    "username": "string",
    "email": "string",
    "role": "student"
  },
  "token": "jwt_token_here"
}
```

## Lessons

### Generate Lesson

**POST** `/api/lessons/generate`

Headers:
- `Authorization: Bearer {token}`

Request Body:
```json
{
  "subject": "string",
  "level": "beginner" | "intermediate" | "advanced",
  "language": "Arabic" | "English"
}
```

Response:
```json
{
  "id": 1,
  "user_id": 1,
  "subject": "Mathematics",
  "level": "beginner",
  "content": "# Lesson content in markdown...",
  "ai_prompt": "Create a comprehensive lesson...",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### Get All Lessons

**GET** `/api/lessons`

Headers:
- `Authorization: Bearer {token}`

Response:
```json
[
  {
    "id": 1,
    "subject": "Mathematics",
    "level": "beginner",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Get Lesson by ID

**GET** `/api/lessons/:id`

Headers:
- `Authorization: Bearer {token}`

Response:
```json
{
  "id": 1,
  "user_id": 1,
  "subject": "Mathematics",
  "level": "beginner",
  "content": "# Full lesson content...",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

## Quizzes

### Generate Quiz

**POST** `/api/quizzes/generate`

Headers:
- `Authorization: Bearer {token}`

Request Body:
```json
{
  "lessonId": 1
}
```

Response:
```json
{
  "id": 1,
  "lesson_id": 1,
  "questions": {
    "questions": [
      {
        "question": "What is 2+2?",
        "options": ["3", "4", "5", "6"],
        "correctAnswer": "4"
      }
    ]
  },
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### Get Quiz by ID

**GET** `/api/quizzes/:id`

Headers:
- `Authorization: Bearer {token}`

Response:
```json
{
  "id": 1,
  "lesson_id": 1,
  "questions": {
    "questions": [...]
  },
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### Submit Quiz

**POST** `/api/quizzes/submit`

Headers:
- `Authorization: Bearer {token}`

Request Body:
```json
{
  "quizId": 1,
  "answers": {
    "0": "answer1",
    "1": "answer2"
  }
}
```

Response:
```json
{
  "message": "Quiz submitted"
}
```
