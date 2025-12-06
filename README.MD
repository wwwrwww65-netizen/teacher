# 🎓 Tiny Teacher - المشروع الكامل والمتكامل

<div align="center">

![Tiny Teacher Logo](./mobile/assets/icon.png)

**تطبيق تعليمي تفاعلي ذكي للأطفال (4-8 سنوات)**

[![CI/CD](https://github.com/yourusername/tiny-teacher/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/yourusername/tiny-teacher/actions)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![React Native](https://img.shields.io/badge/React%20Native-0.73-blue.svg)](https://reactnative.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)

[التوثيق الكامل](./COMPLETE_TECHNICAL_SPEC.md) • [دليل البناء](./mobile/BUILD_GUIDE.md) • [تجربة المستخدم](./mobile/USER_EXPERIENCE.md) • [API Docs](#api-documentation)

</div>

---

## 📋 المحتويات

- [نظرة عامة](#-نظرة-عامة)
- [الميزات](#-الميزات)
- [البنية التقنية](#-البنية-التقنية)
- [التثبيت السريع](#-التثبيت-السريع)
- [التوثيق](#-التوثيق)
- [المساهمة](#-المساهمة)
- [الترخيص](#-الترخيص)

---

## 🎯 نظرة عامة

**Tiny Teacher** هو نظام تعليمي متكامل يجمع بين:

### 🤖 شخصية معلم ذكية
- مبنية محلياً 100% (بدون Spine/Rive/Lottie)
- Lip-sync مع الصوت
- رسم متزامن على السبورة
- حركات طبيعية (Idle, Talk, Point, Write)

### 🧠 ذكاء اصطناعي
- OpenAI GPT-4o للإجابات
- توليد دروس تلقائياً
- رسومات SVG ذكية
- تخصيص حسب مستوى الطفل

### 📚 نظام تعليمي كامل
- 5+ دروس (الحروف، الأرقام، الألوان، الأشكال، الحيوانات)
- اختبارات تفاعلية
- نظام نقاط ومستويات
- إنجازات وشارات

### 🌐 متعدد اللغات
- العربية (RTL)
- الإنجليزية
- قابل للتوسع

---

## ✨ الميزات

<table>
<tr>
<td width="50%">

### للأطفال 👦
- ✅ واجهة جذابة ومرحة
- ✅ تعلم تفاعلي
- ✅ مكافآت فورية
- ✅ ألعاب تعليمية
- ✅ صوت كرتوني محبب

</td>
<td width="50%">

### للأهل 👨‍👩‍👧
- ✅ تتبع التقدم
- ✅ تقارير مفصلة
- ✅ بيئة آمنة (COPPA)
- ✅ محتوى معتمد
- ✅ وضع Offline

</td>
</tr>
</table>

---

## 🏗️ البنية التقنية

```
┌─────────────────────────────────────────────────────────┐
│                    Tiny Teacher                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐         ┌──────────────┐            │
│  │   Mobile App │◄────────┤  Backend API │            │
│  │ React Native │  REST   │   Node.js    │            │
│  │   + Expo     │         │   Express    │            │
│  └──────────────┘         └──────┬───────┘            │
│         │                         │                     │
│         │                  ┌──────▼───────┐            │
│         │                  │  PostgreSQL  │            │
│         │                  │   Database   │            │
│         │                  └──────────────┘            │
│         │                                               │
│         │                  ┌──────────────┐            │
│         └─────────────────►│  OpenAI API  │            │
│                            │   GPT-4o     │            │
│                            └──────────────┘            │
└─────────────────────────────────────────────────────────┘
```

### Frontend (Mobile)
- **React Native** 0.73 - إطار العمل
- **Expo** 50.0 - منصة التطوير
- **Reanimated** 3 - حركات 60fps
- **React Native SVG** - الرسم
- **i18n** - متعدد اللغات
- **AsyncStorage** - تخزين محلي

### Backend (API)
- **Node.js** 18+ - بيئة التشغيل
- **Express** 4.18 - إطار الويب
- **PostgreSQL** 15 - قاعدة البيانات
- **JWT** - المصادقة
- **bcryptjs** - التشفير
- **OpenAI SDK** - الذكاء الاصطناعي

---

## 🚀 التثبيت السريع

### المتطلبات
```bash
Node.js 18+
PostgreSQL 15+
npm أو yarn
Expo CLI
```

### 1. Clone المشروع
```bash
git clone https://github.com/yourusername/tiny-teacher.git
cd tiny-teacher
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# عدل .env وضع مفاتيحك
createdb tiny_teacher
npm run migrate
npm run seed
npm run dev
```

### 3. Frontend Setup
```bash
cd ../mobile
npm install
npx expo start
```

### 4. أو استخدم Docker 🐳
```bash
docker-compose up -d
```

---

## 📚 التوثيق

### الوثائق الرئيسية
- 📖 [التوثيق التقني الكامل](./COMPLETE_TECHNICAL_SPEC.md) - كل التفاصيل التقنية
- 🏗️ [دليل البناء](./mobile/BUILD_GUIDE.md) - خطوات البناء والنشر
- 🎨 [تجربة المستخدم](./mobile/USER_EXPERIENCE.md) - رحلة المستخدم الكاملة
- 🔒 [سياسة الخصوصية](./mobile/PRIVACY_POLICY.md) - COPPA compliant

### API Documentation

#### Authentication
```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

#### Lessons
```http
GET  /api/lessons
GET  /api/lessons/:id
GET  /api/lessons/:id/topics
```

#### AI
```http
POST /api/ai/ask
POST /api/ai/generate-lesson
```

#### Progress
```http
GET  /api/progress/user/:userId
POST /api/progress/complete-topic
POST /api/progress/submit-quiz
```

للتفاصيل الكاملة: [API Documentation](./COMPLETE_TECHNICAL_SPEC.md#api-documentation)

---

## 🗂️ هيكل المشروع

```
tiny-teacher/
├── mobile/                    # تطبيق React Native
│   ├── src/
│   │   ├── components/       # المكونات القابلة لإعادة الاستخدام
│   │   │   ├── avatar/       # الشخصية المتحركة
│   │   │   ├── Button.js
│   │   │   ├── Card.js
│   │   │   └── Whiteboard.js
│   │   ├── screens/          # الشاشات
│   │   │   ├── LoginScreen.js
│   │   │   ├── HomeScreen.js
│   │   │   ├── LessonsScreen.js
│   │   │   ├── ClassroomScreen.js
│   │   │   └── ProfileScreen.js
│   │   ├── services/         # الخدمات
│   │   │   ├── AIService.js
│   │   │   ├── VoiceService.js
│   │   │   └── OfflineService.js
│   │   ├── config/           # التكوين
│   │   │   ├── theme.js
│   │   │   └── ApiKeys.js
│   │   ├── data/             # البيانات
│   │   │   └── lessons.js
│   │   └── i18n/             # الترجمات
│   │       ├── ar.json
│   │       └── en.json
│   ├── assets/               # الصور والأيقونات
│   ├── App.js
│   └── package.json
│
├── backend/                   # Backend API
│   ├── src/
│   │   ├── controllers/      # Controllers
│   │   ├── models/           # Models
│   │   ├── routes/           # Routes
│   │   ├── middleware/       # Middleware
│   │   ├── config/           # Configuration
│   │   └── app.js
│   ├── tests/                # Tests
│   ├── Dockerfile
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml         # CI/CD Pipeline
│
├── docker-compose.yml        # Docker Compose
├── COMPLETE_TECHNICAL_SPEC.md
└── README.md                 # هذا الملف
```

---

## 💰 التكاليف

### Development (مجاني)
```
OpenAI API: $0 (Free tier)
Hosting: $0 (localhost)
Database: $0 (PostgreSQL محلي)
─────────────────────────
Total: $0/شهر
```

### Production (1,000 مستخدم)
```
OpenAI API: ~$50
Backend Hosting: $20
Database: $15
CDN: $5
─────────────────────────
Total: ~$90/شهر
```

### Scaling (10,000 مستخدم)
```
OpenAI API: ~$500
Backend: $100
Database: $50
CDN: $20
─────────────────────────
Total: ~$670/شهر
```

---

## 🧪 الاختبار

```bash
# Backend Tests
cd backend
npm test

# Frontend Tests
cd mobile
npm test

# E2E Tests
npm run test:e2e

# Coverage
npm run test:coverage
```

---

## 🚢 النشر

### باستخدام Docker
```bash
docker-compose up -d
```

### يدوياً
```bash
# Backend
cd backend
npm run build
npm start

# Frontend (APK)
cd mobile
eas build --platform android --profile production
```

للتفاصيل: [دليل النشر](./mobile/BUILD_GUIDE.md)

---

## 🗺️ خارطة الطريق

### ✅ Phase 1 (مكتمل)
- [x] MVP للتطبيق
- [x] شخصية متحركة
- [x] 5 دروس أساسية
- [x] نظام نقاط
- [x] Backend API
- [x] Database Schema

### 🚧 Phase 2 (قيد التنفيذ)
- [ ] 20+ درس إضافي
- [ ] اختبارات متقدمة
- [ ] تقارير للأهل
- [ ] Dark Mode

### 📅 Phase 3 (مخطط)
- [ ] فيديوهات تعليمية
- [ ] ألعاب تفاعلية
- [ ] Live Classes
- [ ] AR/VR Support

---

## 🤝 المساهمة

نرحب بالمساهمات! اتبع الخطوات:

1. **Fork** المشروع
2. أنشئ **branch** جديد (`git checkout -b feature/amazing`)
3. **Commit** التغييرات (`git commit -m 'Add amazing feature'`)
4. **Push** إلى Branch (`git push origin feature/amazing`)
5. افتح **Pull Request**

اقرأ [دليل المساهمة](CONTRIBUTING.md) للتفاصيل.

---

## 📄 الترخيص

هذا المشروع مرخص تحت **MIT License** - انظر ملف [LICENSE](LICENSE) للتفاصيل.

---

## 👥 الفريق

- **المطور الرئيسي**: [اسمك](https://github.com/yourusername)
- **التصميم**: AI-Generated Assets
- **المحتوى التعليمي**: فريق Tiny Teacher

---

## 🙏 شكر خاص

- [Expo](https://expo.dev/) - منصة التطوير
- [OpenAI](https://openai.com/) - الذكاء الاصطناعي
- [React Native](https://reactnative.dev/) - إطار العمل
- [PostgreSQL](https://www.postgresql.org/) - قاعدة البيانات

---

## 📞 التواصل

<div align="center">

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/yourusername/tiny-teacher)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:support@tinyteacher.com)
[![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/tinyteacher)

</div>

---

<div align="center">

**صنع بـ ❤️ للأطفال في كل مكان**

⭐ إذا أعجبك المشروع، لا تنسَ إعطاءه نجمة!

[⬆ العودة للأعلى](#-tiny-teacher---المشروع-الكامل-والمتكامل)

</div>