# 🎓 Tiny Teacher - المشروع الكامل والمتكامل

## 📋 جدول المحتويات
1. [نظرة عامة](#نظرة-عامة)
2. [البنية التقنية الكاملة](#البنية-التقنية-الكاملة)
3. [الشخصية الكرتونية](#الشخصية-الكرتونية)
4. [قاعدة البيانات](#قاعدة-البيانات)
5. [API Documentation](#api-documentation)
6. [الواجهات والشاشات](#الواجهات-والشاشات)
7. [الميزات المتقدمة](#الميزات-المتقدمة)
8. [التثبيت والتشغيل](#التثبيت-والتشغيل)
9. [النشر والإنتاج](#النشر-والإنتاج)
10. [التكاليف](#التكاليف)
11. [خارطة الطريق](#خارطة-الطريق)

---

## 🎯 نظرة عامة

### لماذا Tiny Teacher؟
تطبيق تعليمي تفاعلي **100% محلي** للأطفال (4-8 سنوات) يجمع بين:
- شخصية معلم روبوت مبنية محلياً (بدون Spine/Rive/Lottie)
- ذكاء اصطناعي للإجابة على الأسئلة
- سبورة تفاعلية متزامنة
- نظام تعليمي كامل (دروس + اختبارات + تقدم)

### الأهداف:
1. ✅ تعليم تفاعلي بدون معلم بشري
2. ✅ متاح 24/7 بدون اتصال (offline mode)
3. ✅ آمن ومتوافق مع COPPA
4. ✅ قابل للتوسع (scalable)

---

## 🏗️ البنية التقنية الكاملة

### Frontend (Mobile App)
```
Technology Stack:
├── React Native 0.73
├── Expo 50.0
├── React Navigation 6 (التنقل)
├── Reanimated 3 (الحركات 60fps)
├── React Native SVG (الرسم)
├── AsyncStorage (تخزين محلي)
├── i18n (متعدد اللغات)
└── react-native-tts + voice (صوت)
```

### Backend (API Server)
```
Technology Stack:
├── Node.js 18+
├── Express 4.18
├── PostgreSQL 15 (قاعدة بيانات)
├── JWT (المصادقة)
├── bcryptjs (تشفير كلمات المرور)
├── OpenAI API (الذكاء الاصطناعي)
└── Docker (الحاويات)
```

### Database Schema
```sql
-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'student', -- student/parent/admin
  avatar VARCHAR(10) DEFAULT '👦',
  level INTEGER DEFAULT 1,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Lessons Table
CREATE TABLE lessons (
  id SERIAL PRIMARY KEY,
  title_ar VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(10),
  level VARCHAR(20), -- beginner/intermediate/advanced
  duration INTEGER, -- minutes
  category VARCHAR(50), -- alphabet/numbers/colors/shapes/animals
  created_at TIMESTAMP DEFAULT NOW()
);

-- Topics Table (محتوى الدرس)
CREATE TABLE topics (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER REFERENCES lessons(id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  draw_svg_path TEXT, -- SVG path للرسم على السبورة
  audio_url VARCHAR(500),
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quizzes Table
CREATE TABLE quizzes (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER REFERENCES lessons(id),
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Questions Table
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER REFERENCES quizzes(id),
  question TEXT NOT NULL,
  options JSONB, -- ["A", "B", "C", "D"]
  correct_answer INTEGER, -- index of correct option
  points INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Progress Table
CREATE TABLE user_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  lesson_id INTEGER REFERENCES lessons(id),
  topic_id INTEGER REFERENCES topics(id),
  completed BOOLEAN DEFAULT FALSE,
  completion_date TIMESTAMP,
  time_spent INTEGER, -- seconds
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quiz Results Table
CREATE TABLE quiz_results (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  quiz_id INTEGER REFERENCES quizzes(id),
  score INTEGER,
  total_questions INTEGER,
  percentage DECIMAL(5,2),
  completed_at TIMESTAMP DEFAULT NOW()
);

-- Achievements Table
CREATE TABLE achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  achievement_type VARCHAR(50), -- first_lesson/5_lessons/alphabet_master
  unlocked_at TIMESTAMP DEFAULT NOW()
);

-- Indexes للأداء
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_quiz_results_user ON quiz_results(user_id);
CREATE INDEX idx_topics_lesson ON topics(lesson_id);
```

---

## 🤖 الشخصية الكرتونية (100% محلي)

### Rigging (الهيكلة)
```javascript
// src/components/avatar/AvatarRigging.js
export const AvatarRig = {
  // Pivot Points (نقاط المحورية)
  pivots: {
    head: { x: 100, y: 80 },
    leftArm: { x: 60, y: 130 },
    rightArm: { x: 140, y: 130 },
    torso: { x: 100, y: 150 },
  },
  
  // Bone Hierarchy (التسلسل الهرمي)
  bones: {
    root: {
      children: ['torso'],
    },
    torso: {
      parent: 'root',
      children: ['head', 'leftArm', 'rightArm', 'legs'],
    },
    head: {
      parent: 'torso',
      constraints: { rotation: { min: -15, max: 15 } },
    },
    leftArm: {
      parent: 'torso',
      constraints: { rotation: { min: -90, max: 45 } },
    },
    rightArm: {
      parent: 'torso',
      constraints: { rotation: { min: -45, max: 90 } },
    },
  },
};
```

### Visemes (أشكال الفم)
```javascript
// src/components/avatar/Visemes.js
export const VISEMES = {
  closed: {
    path: 'M92 90 Q100 92 108 90', // فم مغلق
    duration: 100,
  },
  half: {
    path: 'M92 90 Q100 95 108 90', // نصف مفتوح
    duration: 150,
  },
  open: {
    path: 'M92 85 Q100 95 108 85 Q100 100 92 85', // مفتوح
    duration: 200,
  },
  wide: {
    path: 'M85 88 Q100 100 115 88 Q100 105 85 88', // مفتوح جداً
    duration: 250,
  },
};

// Phoneme to Viseme Mapping
export const PHONEME_MAP = {
  'a': 'open',
  'e': 'half',
  'i': 'closed',
  'o': 'open',
  'u': 'closed',
  // ... المزيد
};
```

### Board Sync (التزامن مع السبورة)
```javascript
// مثال JSON للتزامن
const lessonSequence = {
  avatarActions: [
    { action: 'idle', at: 0 },
    { action: 'talk', at: 500, params: { text: 'A is for Apple' } },
    { action: 'pointToBoard', at: 2000, target: { x: 120, y: 60 } },
    { action: 'writeOnBoard', at: 2500, params: { 
      path: 'M50 150 L100 50 L150 150 M75 110 L125 110',
      duration: 2000 
    }},
    { action: 'resetPosition', at: 5000 },
  ],
  boardSteps: [
    { type: 'clear', at: 0 },
    { type: 'draw', at: 2500, path: 'M50 150 L100 50 L150 150 M75 110 L125 110' },
  ],
};
```

### Performance Testing
```javascript
// src/components/avatar/__tests__/performance.test.js
describe('Avatar Performance', () => {
  test('Lip-sync delay should be ≤200ms', async () => {
    const startTime = Date.now();
    await avatar.speak('Hello');
    const syncDelay = Date.now() - startTime;
    expect(syncDelay).toBeLessThanOrEqual(200);
  });
  
  test('Animation should run at 60fps', () => {
    const fps = measureFPS(avatar.playAnimation('idle'));
    expect(fps).toBeGreaterThanOrEqual(55); // 55-60 مقبول
  });
});
```

---

## 📡 API Documentation

### Authentication

#### POST /api/auth/register
```javascript
// Request
{
  "name": "أحمد",
  "email": "ahmed@example.com",
  "password": "SecurePass123",
  "role": "student"
}

// Response (201)
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "أحمد",
      "email": "ahmed@example.com",
      "role": "student",
      "avatar": "👦",
      "level": 1,
      "points": 0
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /api/auth/login
```javascript
// Request
{
  "email": "ahmed@example.com",
  "password": "SecurePass123"
}

// Response (200)
{
  "success": true,
  "data": {
    "user": { /* ... */ },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Lessons

#### GET /api/lessons
```javascript
// Response (200)
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title_ar": "الحروف الأبجدية",
      "title_en": "Alphabet",
      "description": "تعلم الحروف من A إلى Z",
      "icon": "🔤",
      "level": "beginner",
      "duration": 10,
      "category": "alphabet",
      "topics_count": 3
    },
    // ...
  ]
}
```

#### GET /api/lessons/:id/topics
```javascript
// Response (200)
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "حرف A",
      "content": "A is for Apple",
      "draw_svg_path": "M50 150 L100 50 L150 150 M75 110 L125 110",
      "audio_url": null,
      "order_index": 1
    },
    // ...
  ]
}
```

### AI

#### POST /api/ai/ask
```javascript
// Request
{
  "question": "What is 1 + 1?",
  "context": {
    "user_level": 1,
    "language": "en"
  }
}

// Response (200)
{
  "success": true,
  "data": {
    "answer": "One plus one equals two!",
    "draw_svg_path": "M50 100 L100 100 M120 100 L170 100 M200 80 L250 80 M200 120 L250 120 M280 100 L330 50 L330 150",
    "difficulty": "easy"
  }
}
```

### Progress

#### POST /api/progress/complete-topic
```javascript
// Request
{
  "topic_id": 1,
  "time_spent": 120 // seconds
}

// Response (200)
{
  "success": true,
  "data": {
    "points_earned": 10,
    "new_level": 1,
    "new_total_points": 10,
    "achievement_unlocked": null
  }
}
```

---

## 📱 الواجهات والشاشات (Wireframes)

### 1. Splash Screen
```
┌─────────────────────┐
│                     │
│                     │
│        🤖          │
│   Tiny Teacher      │
│                     │
│   Loading...        │
│                     │
└─────────────────────┘
```

### 2. Login Screen
```
┌─────────────────────┐
│    ← Back           │
│                     │
│        🤖          │
│   Tiny Teacher      │
│                     │
│  ┌───────────────┐  │
│  │ Email         │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │ Password      │  │
│  └───────────────┘  │
│                     │
│  [   تسجيل دخول   ]  │
│                     │
│  ليس لديك حساب؟     │
│                     │
│  [  دخول كضيف    ]  │
└─────────────────────┘
```

### 3. Home Screen
```
┌─────────────────────┐
│ مرحباً أحمد! 👋  👤 │
│ جاهز للتعلم؟        │
│                     │
│ ┌─────────────────┐ │
│ │ 🏆 المستوى 1    │ │
│ │ ⭐ 45 نقطة      │ │
│ │ ▓▓▓▓░░░░░░ 45%  │ │
│ └─────────────────┘ │
│                     │
│ ┌────┐ ┌────┐ ┌────┐│
│ │📚 │ │🤖 │ │🎯 ││
│ │دروس│ │معلم│ │اخت││
│ └────┘ └────┘ └────┘│
│                     │
│ الدروس المميزة:      │
│ ┌─────────────────┐ │
│ │ 🔤 الحروف      │→│
│ │ ⏱️ 10 دقائق    │ │
│ └─────────────────┘ │
└─────────────────────┘
```

---

## 🌟 الميزات المتقدمة

### 1. Multi-Language (i18n)
```javascript
// src/i18n/index.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './locales/ar.json';
import en from './locales/en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
    },
    lng: 'ar',
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

```json
// src/i18n/locales/ar.json
{
  "welcome": "مرحباً",
  "lessons": "الدروس",
  "profile": "الملف الشخصي",
  "logout": "تسجيل خروج"
}
```

### 2. Offline Mode
```javascript
// src/services/OfflineService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const OfflineService = {
  // حفظ الدروس محلياً
  cacheLessons: async (lessons) => {
    await AsyncStorage.setItem('cached_lessons', JSON.stringify(lessons));
  },
  
  // استرجاع الدروس المحفوظة
  getCachedLessons: async () => {
    const cached = await AsyncStorage.getItem('cached_lessons');
    return cached ? JSON.parse(cached) : [];
  },
  
  // التحقق من الاتصال
  isOnline: async () => {
    try {
      const response = await fetch('https://api.tinyteacher.com/health');
      return response.ok;
    } catch {
      return false;
    }
  },
};
```

### 3. Voice Input/Output
```javascript
// src/services/VoiceService.js
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';

export const VoiceService = {
  // الاستماع لصوت الطفل
  listen: () => {
    return new Promise((resolve) => {
      Voice.onSpeechResults = (e) => {
        resolve(e.value[0]);
      };
      Voice.start('ar-SA'); // أو 'en-US'
    });
  },
  
  // التحدث بصوت كرتوني
  speak: (text, language = 'ar-SA') => {
    Tts.setDefaultLanguage(language);
    Tts.setDefaultRate(0.5); // سرعة بطيئة للأطفال
    Tts.setDefaultPitch(1.2); // صوت أعلى (كرتوني)
    Tts.speak(text);
  },
};
```

---

## 🚀 التثبيت والتشغيل

### المتطلبات
- Node.js 18+
- PostgreSQL 15+
- npm أو yarn
- Expo CLI
- Android Studio / Xcode (اختياري)

### 1. Clone المشروع
```bash
git clone https://github.com/yourusername/tiny-teacher.git
cd tiny-teacher
```

### 2. Backend Setup
```bash
cd backend

# تثبيت الحزم
npm install

# إنشاء ملف .env
cp .env.example .env

# تعديل .env
# DATABASE_URL=postgresql://user:password@localhost:5432/tiny_teacher
# JWT_SECRET=your-secret-key
# OPENAI_API_KEY=sk-your-key

# إنشاء قاعدة البيانات
createdb tiny_teacher

# تشغيل Migrations
npm run migrate

# إضافة بيانات تجريبية
npm run seed

# تشغيل السيرفر
npm run dev
# السيرفر يعمل على http://localhost:3000
```

### 3. Frontend Setup
```bash
cd ../mobile

# تثبيت الحزم
npm install

# تعديل API URL
# في src/config/api.js
# export const API_URL = 'http://localhost:3000/api';

# تشغيل التطبيق
npx expo start

# اختر المنصة:
# - اضغط 'a' للأندرويد
# - اضغط 'i' لـ iOS
# - اضغط 'w' للويب
```

---

## 🐳 النشر (Docker)

### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: tiny_teacher
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/tiny_teacher
      JWT_SECRET: your-secret-key
      OPENAI_API_KEY: sk-your-key
    depends_on:
      - postgres

volumes:
  postgres_data:
```

### التشغيل
```bash
docker-compose up -d
```

---

## 💰 التكاليف (شهرياً)

### Development (تطوير)
- **OpenAI API**: $0 (Free tier: $5 credit)
- **Hosting**: $0 (localhost)
- **Database**: $0 (PostgreSQL محلي)
- **Total**: $0/شهر

### Production (إنتاج - 1000 مستخدم)
- **OpenAI API**: ~$50 (10,000 requests × $0.005)
- **Hosting (Backend)**: $20 (Heroku/DigitalOcean)
- **Database**: $15 (PostgreSQL managed)
- **CDN (Assets)**: $5 (Cloudflare)
- **Total**: ~$90/شهر

### Scaling (10,000 مستخدم)
- **OpenAI API**: ~$500
- **Hosting**: $100 (Load balancer + 2 servers)
- **Database**: $50 (Larger instance)
- **CDN**: $20
- **Total**: ~$670/شهر

---

## 🗺️ خارطة الطريق

### Phase 1 (✅ مكتمل)
- ✅ MVP للتطبيق
- ✅ شخصية متحركة
- ✅ 5 دروس أساسية
- ✅ نظام نقاط

### Phase 2 (🚧 قيد التنفيذ)
- ⏳ Backend كامل
- ⏳ Database schema
- ⏳ API documentation
- ⏳ Multi-language

### Phase 3 (📅 مخطط)
- 📅 20+ درس إضافي
- 📅 فيديوهات تعليمية
- 📅 ألعاب تفاعلية
- 📅 تقارير للأهل

### Phase 4 (💡 مستقبلي)
- 💡 LMS Integration
- 💡 Live Classes
- 💡 AR/VR Support
- 💡 AI Tutor (مدرس خاص)

---

## 📄 الترخيص

MIT License - مفتوح المصدر

---

## 🤝 المساهمة

نرحب بالمساهمات! اتبع الخطوات:
1. Fork المشروع
2. أنشئ branch (`git checkout -b feature/amazing`)
3. Commit (`git commit -m 'Add feature'`)
4. Push (`git push origin feature/amazing`)
5. افتح Pull Request

---

## 📞 التواصل

- **GitHub**: https://github.com/yourusername/tiny-teacher
- **Email**: support@tinyteacher.com
- **Discord**: https://discord.gg/tinyteacher

---

**صنع بـ ❤️ للأطفال في كل مكان**
