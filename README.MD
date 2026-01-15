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

### 3. Frontend Setup (التشغيل)
```bash
cd mobile
# 1. تنظيف الكاش (خطوة مهمة لتفادي الأخطاء)
npm start -- --reset-cache

# 2. تشغيل التطبيق على الأندرويد
npm run android
```

### 🔧 أوامر مفيدة (Troubleshooting)

**إذا ظهر خطأ "Network Request Failed" أو "غير متصل":**
```bash
# 1. تأكد من ربط المنافذ (ADB Reverse)
# هذا الأمر يربط منفذ الكمبيوتر بمنفذ الهاتف
adb reverse tcp:8081 tcp:8081

# 2. التحقق من حالة الخادم
curl http://localhost:8081/status
```

**إعادة تشغيل التطبيق بالقوة (Restart App):**
```bash
# PowerShell
adb shell am force-stop com.tinyteacher; adb shell am start -n com.tinyteacher/.MainActivity

# CMD / Bash
adb shell am force-stop com.tinyteacher && adb shell am start -n com.tinyteacher/.MainActivity
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

## 🧠 كيف يعمل نظام "المعلّمة نورا" مع السبورة والنوافذ التفاعلية (Mobile Live)

> هذا القسم يشرح منطق **ClassroomScreen** في تطبيق الموبايل:
> كيف يرسم على السبورة، وكيف تُفتح نافذة الكتابة ونافذة الخيارات، وكيف يتعامل الذكاء الاصطناعي (Gemini Live) مع هذه الأدوات.

### 1️⃣ المكوّنات الأساسية

- **السبورة (ChalkboardWhiteboard)**  
  ملف: `mobile/src/components/ChalkboardWhiteboard.js`  
  - تعرض:
    - رسومات الحروف/الكلمات (مسارات SVG).
    - خط اليد القادم من الطفل.
  - واجهتها من منظور الشاشة:
    - `whiteboardRef.current?.write(content, { count, duration })`
      - `content`: إمّا حرف واحد (مثلاً: `ع`) أو بيانات رسم من `AIService.getDrawData(letterOrWord)`.
      - `count`: عدد مرات التكرار (للحروف أو العناصر).
      - `duration`: مدة حركة الرسم (ms).

- **نافذة الكتابة (HandwritingModal)**  
  ملف: `mobile/src/components/HandwritingModal.js`  
  - تفتح عندما يُطلَب من الطفل أن يكتب حرفًا معيّنًا.
  - الخصائص:
    - `visible`: هل النافذة ظاهرة الآن؟
    - `letter`: الحرف المطلوب كتابته (مثلاً: "م").
    - `onSuccess`: يُستدعى عند نجاح الكتابة.
    - `onFailure`: يُستدعى عند الفشل.
  - تتحكم فيها شاشة الصف:
    - حالة React: `isWritingModalVisible`, `writingLetter`.
    - مراجع: `pendingWritingRef`, `isWritingModalRef`.

- **نافذة الخيارات (Quiz Modal)**  
  جزء من `ClassroomScreen`  
  - تعرض سؤالًا مع **2–4 خيارات**.
  - حالة React:
    - `isSelectionModalVisible`
    - `selectionOptions`
    - `correctAnswer`
    - `optionStates` (ألوان الخيارات: صحيح/خطأ).
  - مراجع:
    - `pendingQuizRef`
    - `isSelectionModalVisibleRef`

- **خدمة الذكاء الاصطناعي المباشر (GeminiLiveService)**  
  ملف: `mobile/src/services/GeminiLiveService.js`  
  - اتصال WebSocket مع Gemini Live:
    - يستقبل نصوص المعلمة تدريجيًا (partial text).
    - يستقبل استدعاءات الأدوات:
      - `drawOnBoard`
      - `showQuiz`
      - `askToWrite`
  - يمرّر:
    - النص الكامل إلى `onContentReceived`.
    - أدوات الذكاء إلى `onToolCall`.

### 2️⃣ مسار الرسم على السبورة (drawOnBoard)

#### أ) عندما يستدعي جيميني الأداة مباشرة

- من Gemini Live تأتي رسالة تحتوي `tool_call` باسم:
  - `drawOnBoard` وبداخلها:
    - `args.item`: مثل `"ع"`, `"apple"`, `"5"`, `"كلمة"`.

- في `ClassroomScreen`:

  - في `geminiLiveService.onToolCall`:
    - إذا كان `name === 'drawOnBoard'`:
      - يحوّل `item` إلى بيانات رسم (إن أمكن) عبر:
        - `aiService.getDrawData(item)`
      - يبدأ المعلم في المشي نحو السبورة:
        - `avatarRef.current?.walkToBoard()`
      - بعد تأخير بسيط (1200ms):
        - `whiteboardRef.current?.write(drawData || item, { count: 1, duration: 3000 })`
      - إذا كان `item` حرفًا واحدًا:
        - يتم تحديث `currentTargetLetterRef.current = item`
          - ليعرف النظام أن "حرف الدرس الحالي" هو هذا الحرف.

#### ب) عندما يكتب جيميني طلب الرسم كنص (SMART-FALLBACK)

- أحيانًا لا يستدعي الأداة، بل يكتب في النص:
  - `drawOnBoard({ item: "ع" })`
  - أو يذكر حرفًا بين أقواس، مثل `(ع)`.

- في `onContentReceived` (داخل `ClassroomScreen`):
  - يتم تحليل النص (normalized) بحثًا عن:
    - تعابير تشبه `drawOnBoard(...)`
    - أو حروف بين أقواس `(ع)`، `(م)` بعد عبارات مثل:
      - "انظر إلى السبورة"
      - "هذا هو حرف (ع)"
  - عند العثور:
    - يستخرج الحرف/النص المناسب (`foundLetter`).
    - يحدِّث `currentTargetLetterRef.current` إذا كان حرفًا.
    - يستدعي `whiteboardRef.current?.write(...)` بنفس منطق الأداة.
    - يسجّل في اللوق:
      - `🎨 [SMART-FALLBACK] Drawing detected letter: ع`

### 3️⃣ مسار نافذة الكتابة (askToWrite)

#### أ) من الأداة المباشرة (Tool Call)

- عندما يرسل جيميني:
  - `askToWrite({ letter: "م" })`

- في `onToolCall` داخل `ClassroomScreen`:
  - إذا كان `name === 'askToWrite'`:
    - **حماية ضد الكويز النشط**:
      - إذا كان `pendingQuizRef.current === true`
      - أو `isSelectionModalVisibleRef.current === true`  
      → يتم تجاهل الطلب وتسجيل:
        - `✍️ [LIVE] askToWrite ignored because quiz is active.`
    - إذا لم يكن هناك كويز:
      - يستخرج الحرف:
        - `requestedLetter = safeArgs.letter`
        - `requestedChar = resolveArabicLetter(requestedLetter)`
      - يحدد الحرف الفعّال:
        - `effectiveLetter = currentTargetLetterRef.current || requestedChar || 'أ'`
      - يسجّل:
        - `✍️ [LIVE] Asking to write: { requestedLetter, effectiveLetter }`
      - يضبط:
        - `setWritingLetter(effectiveLetter)`
        - `pendingWritingRef.current = true`
      - **فتح النافذة فعليًا** يحدث بعد انتهاء الصوت (انظر فقرة "تزامن الفتح").

#### ب) من النص (SMART-FALLBACK)

- عندما لا يستخدم جيميني الأداة ويكتفي بالنص، مثل:
  - "اكتب الحرف (ت) بيدك"
  - "نتدرّب على كتابة (م)"

- في `onContentReceived`:

  1. **في دور المدح (بعد نجاح كويز أو كتابة)**  
     - إذا كان `justFinishedTaskRef.current === true`:
       - نحمي الطفل من سيل المهام، لكن مع استثناء مهم:
       - إذا وُجدت صيغة قوية مثل:
         - `"اكتب الحرف (ت)"` أو `"اكتبي الحرف (ت)"`  
         → حتى في دور المدح، نسمح بفتح نافذة الكتابة:
         - بشرط عدم وجود كويز نشط/معلّق:
           - `!pendingQuizRef.current && !isSelectionModalVisibleRef.current`
         - عندها:
           - يتم استخراج الحرف بين الأقواس.
           - تحويله عبر `resolveArabicLetter`.
           - تفعيل:
             - `setWritingLetter(effectiveLetter)`
             - `pendingWritingRef.current = true`

  2. **في الدور العادي (ليس مدحًا)**
     - نبحث عن نيّة الكتابة:
       - وجود كلمات مثل:
         - `"اكتب"`, `"اكتبي"`, `"حاول أن تكتب"`, `"جرب أن تكتب"`, `"نتدرب على كتابة"`
       - ووجود ذكر لحرف:
         - `"حرف (ع)"` أو أي شيء بين الأقواس.
     - إذا توافرت النية وذكر الحرف:
       - نستخرج الحرف من الأقواس.
       - نستخدم `resolveArabicLetter` + `currentTargetLetterRef`.
       - نفعّل `writingLetter` + `pendingWritingRef`.
       - **مرة أخرى:** بشرط:
         - `!pendingQuizRef.current && !isSelectionModalVisibleRef.current`

#### ج) متى تظهر نافذة الكتابة على الشاشة؟

- `pendingWritingRef.current` هو فقط "وعد" بفتح النافذة بعد انتهاء الكلام.
- دالة `speakResponse` مسؤولة عن:
  - نطق كلام المعلّمة (TTS).
  - تشغيل "الترجمة السينمائية" (subtitles).
  - بعد انتهاء الصوت:
    - `arabicVoiceService` يستدعي مستمع `onFinish`:
      - في `useEffect` في أعلى `ClassroomScreen`:
        - `handleFinish()`:
          - إذا كان:
            - `pendingWritingRef.current === true`:
              - يضبط:
                - `setIsWritingModalVisible(true)`
                - `pendingWritingRef.current = false`
              - يوقف الميكروفون فورًا في وضع Live:
                - `geminiLiveService.pauseMic()`
              - يتم تسجيل:
                - `✍️ Writing Modal Open: Pausing Voice Listening...`

### 4️⃣ مسار نافذة الخيارات (showQuiz)

#### أ) من الأداة المباشرة

- عندما يرسل جيميني:
  - `showQuiz({ question: "...", options: ["...", "..."], answer: "..." })`

- في `onToolCall`:
  - إذا كان `name === 'showQuiz'`:
    - يضبط:
      - `setSelectionOptions(safeArgs.options || [])`
      - `setCorrectAnswer(safeArgs.answer)`
      - `pendingQuizRef.current = true`
    - لا يفتح النافذة فورًا، بل ينتظر انتهاء الكلام.

#### ب) من النص (SMART-FALLBACK)

- أحيانًا يكتب جيميني النص فقط:
  - "أي كلمة تبدأ بحرف (ع)؟ هل هي (عنب) أم (موز)؟"

- في `onContentReceived`:
  - يتم البحث عن:
    - نمط سؤال يحتوي خيارات بين أقواس.
  - من ثم:
    - استخراج الخيارات.
    - تصفيتها بحيث:
      - تتجنّب الأسماء التي تساوي حرف الدرس نفسه إن لزم.
  - مثال:
    - `"عِنَبْ"`, `"مَوْزْ"`
    - يختار أول خيار كـ `fallbackAnswer` إذا لم يُحدّد صراحة.
  - تفعيل:
    - `setSelectionOptions(filteredOptions)`
    - `setCorrectAnswer(fallbackAnswer)`
    - `pendingQuizRef.current = true`

#### ج) متى تظهر نافذة الكويز؟

- مثل نافذة الكتابة تمامًا، الفتح مؤجّل لنهاية الكلام:
  - بعد انتهاء TTS في `handleFinish()`:
    - إذا:
      - `pendingQuizRef.current === true`
      - و **لم تكن نافذة كتابة قيد الفتح**:
        - `setIsSelectionModalVisible(true)`
        - `pendingQuizRef.current = false`
        - إيقاف الميكروفون:
          - `geminiLiveService.pauseMic()`
        - تسجيل:
          - `🎯 Quiz Modal Open: Pausing Voice Listening...`

### 5️⃣ قواعد منع التعارض بين الأنشطة

لضبط سلوك الذكاء الاصطناعي ومنع الخلط بين الأنشطة:

- **عدم جمع كويز + كتابة في نفس اللحظة:**
  - إذا كان:
    - `pendingQuizRef.current === true`
    - أو `isSelectionModalVisibleRef.current === true`
  - يتم تجاهل أي:
    - `askToWrite` (أداة مباشرة).
    - Fallback كتابة من النص.

- **حماية "دور المدح":**
  - بعد نجاح الكويز أو الكتابة:
    - `justFinishedTaskRef.current = true`
  - في الدور التالي:
    - نتجنّب تشغيل نشاط جديد آليًا إلا إذا:
      - كان هناك أمر صريح قوي:
        - مثل `"اكتب الحرف (ت)"`.

- **تنظيف النص قبل النطق (منع نطق الأكواد):**
  - دالة `looksLikeCodeForChild(text)` تتحقق من:
    - وجود أحرف إنجليزية.
    - أقواس برمجية `{ } [ ] < >`.
    - كلمات مثل:
      - `showQuiz`, `drawOnBoard`, `askToWrite`, `function`, `return`, `optionsCount`, `fallbackAnswer`, `question:`, `options:`, `answer:`.
  - إذا بدا النص كأنه كود:
    - يتم استبدال النص بالكامل بجملة عربية آمنة:
      - مثل:  
        `"لَدَيَّ سُؤَالٌ أَوْ نَشَاطٌ لَكَ..."`
  - ثم يُرسَل الناتج إلى `arabicVoiceService.speak(...)`.

### 6️⃣ الكلمات/الأنماط التي تستدعي كل نافذة (ملخّص)

- **رسم على السبورة (المعلّمة ترسم):**
  - Tool Call:
    - `drawOnBoard({ item: "ع" })`
  - أو نص يحتوي:
    - "انظر إلى السبورة"
    - "هذا هو حرف (ع)"
    - حرف بين أقواس بعد سياق السبورة.

- **نافذة الكتابة (الطفل يكتب):**
  - Tool Call:
    - `askToWrite({ letter: "م" })`
  - أو نص يحتوي:
    - "اكتب الحرف (ت)" / "اكتبي الحرف (ت)" (حتى في دور المدح، مع حماية الكويز).
    - "نتدرّب على كتابة (م)"
    - "حاول أن تكتب (س)"

- **نافذة الخيارات (الكويز):**
  - Tool Call:
    - `showQuiz({ question, options, answer })`
  - أو نص يحتوي:
    - "أي كلمة تبدأ بـ حرف (ع)؟ هل هي (عنب) أم (موز)؟"
    - أسئلة مع خيارات بين أقواس، يتم جمعها كـ options.

### 7️⃣ المصدر الرئيسي للمنطق

- كل هذا المنطق متمركز في:
  - شاشة الصف:
    - `mobile/src/screens/ClassroomScreen.js`
  - الخدمات:
    - `mobile/src/services/GeminiLiveService.js`
    - `mobile/src/services/AIService.js`
    - `mobile/src/services/ArabicVoiceService.js`
  - المكوّنات:
    - `mobile/src/components/ChalkboardWhiteboard.js`
    - `mobile/src/components/HandwritingModal.js`

بهذا التوثيق يمكنك فهم الصورة الكاملة:
- كيف يتعامل الذكاء الاصطناعي مع السبورة والنوافذ.
- ما هي الكلمات التي تشغّل كل أداة.
- وكيف تضبط التعارضات والـ debounce لضمان تجربة تعليمية هادئة ومنطقية للطفل.

---

## 🔢 دعم الرياضيات والأرقام والرموز

### 📊 الأرقام العربية والإنجليزية

**النظام يدعم كلا النوعين:**
- **أرقام عربية:** ١، ٢، ٣، ٤، ٥، ٦، ٧، ٨، ٩، ٠
- **أرقام إنجليزية:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 0

**التحويل التلقائي:**
- عند الرسم على السبورة: يتم تحويل الأرقام الإنجليزية تلقائياً إلى عربية
- عند النطق: يتم نطق الأرقام بالعربية بشكل طبيعي
- دالة `convertToArabicNumerals()` في `AIService.js` تقوم بالتحويل

### ➕ الرموز الرياضية المدعومة

| الرمز | الاسم | النطق العربي |
|------|------|--------------|
| + | زائد | زَائِدْ |
| - | ناقص | نَاقِصْ |
| × | ضرب | ضَرْبْ |
| ÷ | قسمة | قِسْمَةْ |
| = | يساوي | يُسَاوِي |
| < | أصغر من | أَصْغَرْ مِنْ |
| > | أكبر من | أَكْبَرْ مِنْ |
| ≤ | أصغر أو يساوي | أَصْغَرْ أَوْ يُسَاوِي |
| ≥ | أكبر أو يساوي | أَكْبَرْ أَوْ يُسَاوِي |
| ≠ | لا يساوي | لَا يُسَاوِي |
| % | نسبة مئوية | بِالْمِئَةْ |
| √ | جذر تربيعي | جَذْرْ |
| ∞ | ما لا نهاية | مَا لَا نِهَايَةْ |

**مثال على معادلة:**
```javascript
// على السبورة
drawOnBoard({ item: "٢ + ٢ = ٤" })

// النطق
"اِثْنَانِ زَائِدْ اثْنَانِ يُسَاوِي أَرْبَعَةْ"
```

### 🔤 أشكال الحروف العربية

**النظام يدعم 4 أشكال لكل حرف:**

1. **الشكل المنفصل** (Isolated): `ب`
2. **شكل البداية** (Initial): `ب_بداية` → بـ
3. **شكل الوسط** (Medial): `ب_وسط` → ـبـ
4. **شكل النهاية** (Final): `ب_نهاية` → ـب

**الحروف المدعومة حالياً:**
- ✅ الباء (ب، بـ، ـبـ، ـب)
- ✅ التاء (ت، تـ، ـتـ، ـت)
- ✅ العين (ع، عـ، ـعـ، ـع)
- ✅ الميم (م، مـ، ـمـ، ـم)
- ✅ السين (س، سـ، ـسـ، ـس)
- ✅ النون (ن، نـ، ـنـ، ـن)

**مثال على الاستخدام:**
```javascript
// رسم حرف الباء في بداية كلمة
drawOnBoard({ item: "ب_بداية" })

// المعلمة تقول:
"هَذَا شَكْلُ حَرْفِ الْبَاءِ فِي بِدَايَةِ الْكَلِمَةِ، مِثْلَ: بَيْت"
```

### 🎨 الأشكال والرسومات المدعومة

**بالعربية والإنجليزية:**
- 🍎 تفاحة / apple
- 🌳 شجرة / tree
- 🏠 بيت، منزل / house
- 🚗 سيارة / car
- ⚽ كرة / ball
- 🌸 زهرة، وردة / flower
- ☀️ شمس / sun
- ⭐ نجمة / star
- 😊 وجه، مبتسم / smile

### 🛠️ الدوال المساعدة

**في `AIService.js`:**

```javascript
// تحويل الأرقام من إنجليزي لعربي
convertToArabicNumerals("123") // → "١٢٣"

// تحويل الأرقام من عربي لإنجليزي
convertToEnglishNumerals("١٢٣") // → "123"

// تحويل الرموز الرياضية للنطق
convertMathSymbolsToArabic("2+2=4") 
// → "٢ زَائِدْ ٢ يُسَاوِي ٤"

// تحضير النص الكامل للنطق
aiService.prepareTextForSpeech("المعادلة: 2+2=4")
// → "الْمُعَادَلَةْ: ٢ زَائِدْ ٢ يُسَاوِي ٤"
```

### 📍 الملفات المحدّثة

1. **`mobile/src/services/AIService.js`**
   - مكتبة `ARABIC_LETTER_FORMS` (أشكال الحروف)
   - مكتبة الرموز الرياضية
   - دوال التحويل والمعالجة
   - دالة `prepareTextForSpeech`

2. **`mobile/src/services/GeminiLiveService.js`**
   - System Prompt محدّث (يحتاج تحديث يدوي)
   - دعم الرياضيات في الأدوات

3. **`mobile/src/components/ChalkboardWhiteboard.js`**
   - دعم عرض النصوص والرموز الرياضية
   - دعم الأرقام العربية والإنجليزية

### 🎯 أمثلة عملية

**درس رياضيات:**
```
المعلمة: "اِنْظُرْ إِلَى السَّبُّورَةِ"
[drawOnBoard({ item: "٢ + ٣ = ٥" })]
المعلمة: "اِثْنَانِ زَائِدْ ثَلَاثَةْ يُسَاوِي خَمْسَةْ"
```

**درس أشكال الحروف:**
```
المعلمة: "سَنَتَعَلَّمُ أَشْكَالَ حَرْفِ الْبَاءِ"
[drawOnBoard({ item: "ب" })]
المعلمة: "هَذَا الشَّكْلُ الْمُنْفَصِلْ"
[drawOnBoard({ item: "ب_بداية" })]
المعلمة: "وَهَذَا فِي بِدَايَةِ الْكَلِمَةِ"
```

---

## 🚀 التطوير المستقبلي

### المخطط له:
- [ ] إضافة أشكال جميع الحروف العربية (28 حرف × 4 أشكال)
- [ ] دعم الكسور الرياضية (½، ¾، إلخ)
- [ ] دعم الأسس والجذور (x²، x³، ³√)
- [ ] رسومات هندسية (مثلث، مربع، دائرة)
- [ ] دعم الرسم البياني البسيط

---
