# Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- OpenAI API Key
- Docker (optional)

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=5000
NODE_ENV=production

# Database
DATABASE_URL=postgres://user:password@host:5432/tiny_teacher

# Security
JWT_SECRET=your_super_secret_jwt_key

# OpenAI
OPENAI_API_KEY=sk-your-api-key-here
```

## Deployment Options

### Option 1: Docker Compose (Recommended for Local/Testing)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 2: Manual Deployment

#### Backend

```bash
cd backend
npm install
npm run seed  # Optional: seed database
npm start
```

#### Frontend

```bash
cd frontend
npm install
npm run build
# Serve the build folder with nginx or any static server
```

### Option 3: Cloud Deployment

#### Vercel (Frontend)

```bash
cd frontend
npm install -g vercel
vercel --prod
```

#### Render/Heroku (Backend)

1. Create a new web service
2. Connect your GitHub repository
3. Set environment variables
4. Deploy

#### AWS (Full Stack)

1. **RDS**: Create PostgreSQL instance
2. **EC2/ECS**: Deploy backend
3. **S3 + CloudFront**: Deploy frontend
4. **Route53**: Configure domain

## Database Setup

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE tiny_teacher;

# Run schema
psql -U postgres -d tiny_teacher -f database/schema.sql

# Run seed (optional)
cd backend
npm run seed
```

## CI/CD with GitHub Actions

The project includes automated workflows:

- **CI** (`.github/workflows/ci.yml`): Runs tests on every push
- **Deploy** (`.github/workflows/deploy.yml`): Deploys to production on main branch

### Required GitHub Secrets

Add these in your repository settings:

- `OPENAI_API_KEY`
- `DATABASE_URL`
- `JWT_SECRET`

## Monitoring

- Use PM2 for process management
- Set up logging with Winston
- Monitor with services like DataDog or New Relic

## Security Checklist

- ✅ Use HTTPS in production
- ✅ Set secure JWT_SECRET
- ✅ Enable CORS only for trusted domains
- ✅ Rate limit API endpoints
- ✅ Sanitize user inputs
- ✅ Keep dependencies updated
