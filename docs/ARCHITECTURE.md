# Architecture Overview

## System Design

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │────────▶│   Backend   │────────▶│  Database   │
│  (React)    │  HTTP   │  (Express)  │   SQL   │ (PostgreSQL)│
└─────────────┘         └─────────────┘         └─────────────┘
                               │
                               │ API Call
                               ▼
                        ┌─────────────┐
                        │   OpenAI    │
                        │     API     │
                        └─────────────┘
```

## Frontend Architecture

### Components Structure

```
src/
├── components/
│   └── PrivateRoute.js       # Route protection
├── pages/
│   ├── LoginPage.js          # Authentication
│   ├── RegisterPage.js       # User registration
│   ├── Dashboard.js          # Main dashboard
│   ├── LessonPage.js         # Lesson viewer + Canvas
│   ├── QuizPage.js           # Quiz interface
│   └── SettingsPage.js       # User settings
├── services/
│   └── api.js                # API client
├── App.js                    # Main router
└── index.js                  # Entry point
```

### State Management

- **Local State**: React hooks (useState, useEffect)
- **Authentication**: localStorage for JWT tokens
- **API Calls**: Axios with interceptors

## Backend Architecture

### Layers

1. **Routes Layer** (`src/routes/`)
   - Define API endpoints
   - Apply middleware

2. **Controllers Layer** (`src/controllers/`)
   - Business logic
   - Request/response handling
   - AI integration

3. **Models Layer** (`src/models/`)
   - Database interactions
   - Data validation

4. **Middleware Layer** (`src/middleware/`)
   - Authentication
   - Error handling

### Database Schema

```
users ──┬──< lessons ──< quizzes
        │
        └──< progress
```

## Security

- **Authentication**: JWT tokens
- **Password Hashing**: bcrypt
- **CORS**: Configured for specific origins
- **Input Validation**: Server-side validation
- **SQL Injection**: Parameterized queries

## AI Integration

### Lesson Generation Flow

1. User requests lesson with subject/level
2. Backend creates prompt for OpenAI
3. OpenAI generates lesson content
4. Backend stores lesson in database
5. Frontend displays formatted content

### Quiz Generation Flow

1. User requests quiz for a lesson
2. Backend fetches lesson content
3. Creates quiz generation prompt
4. OpenAI generates questions
5. Backend parses and stores quiz
6. Frontend displays interactive quiz

## Performance Considerations

- **Caching**: Can add Redis for API responses
- **Database Indexing**: On user_id and lesson_id
- **Code Splitting**: React lazy loading
- **CDN**: For static assets

## Scalability

- **Horizontal Scaling**: Stateless backend
- **Database**: PostgreSQL with read replicas
- **Load Balancing**: Nginx or cloud load balancer
- **Containerization**: Docker for easy deployment
