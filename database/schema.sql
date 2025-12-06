-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) CHECK (role IN ('student', 'teacher', 'admin')) NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lessons Table
CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  level VARCHAR(50) CHECK (level IN ('beginner', 'intermediate', 'advanced')) NOT NULL,
  content TEXT NOT NULL,
  ai_prompt TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quizzes Table
CREATE TABLE IF NOT EXISTS quizzes (
  id SERIAL PRIMARY KEY,
  lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
  questions JSONB NOT NULL,
  answers JSONB,
  score FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Progress Table
CREATE TABLE IF NOT EXISTS progress (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
  completion_rate FLOAT DEFAULT 0.0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
