# 🤖 Tiny Teacher - تطبيق تعليمي تفاعلي للأطفال

<div align="center">

![Tiny Teacher](./assets/icon.png)

**تطبيق تعليمي ذكي للأطفال (4-8 سنوات) مع معلم روبوت متحرك**

[![React Native](https://img.shields.io/badge/React%20Native-0.73-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-50.0-black.svg)](https://expo.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[التحميل](#-التحميل) • [الميزات](#-الميزات) • [التثبيت](#-التثبيت) • [الاستخدام](#-الاستخدام) • [المساهمة](#-المساهمة)

</div>

---

## 📖 نظرة عامة

**Tiny Teacher** هو تطبيق تعليمي تفاعلي مصمم خصيصاً للأطفال في مرحلة الروضة والصفوف الأولى (KG1-Grade3). يجمع التطبيق بين:

- 🤖 **شخصية معلم روبوت متحركة** مع Lip-sync
- 🎨 **سبورة تفاعلية** للرسم والكتابة
- 🧠 **ذكاء اصطناعي** (OpenAI) للإجابة على الأسئلة
- 🎯 **نظام نقاط ومكافآت** لتحفيز التعلم
- 📚 **دروس متنوعة** (الحروف، الأرقام، الألوان، الأشكال، الحيوانات)

---

## ✨ الميزات

### 🎓 التعليم التفاعلي
- ✅ دروس مصممة للأطفال (4-8 سنوات)
- ✅ شخصية معلم متحركة تتكلم وتتفاعل
- ✅ سبورة ذكية للرسم والشرح
- ✅ اختبارات تفاعلية

### 🤖 الذكاء الاصطناعي
- ✅ التعرف على الصوت (Speech Recognition)
- ✅ تحويل النص إلى كلام (Text-to-Speech)
- ✅ إجابات ذكية من OpenAI
- ✅ رسومات تلقائية على السبورة

### 🎨 التصميم
- ✅ واجهة مستخدم جذابة للأطفال
- ✅ ألوان مرحة ومتناسقة
- ✅ رسوم متحركة سلسة (60fps)
- ✅ Material Design 3

### 📊 التقدم والمكافآت
- ✅ نظام نقاط ومستويات
- ✅ إنجازات وشارات
- ✅ إحصائيات مفصلة
- ✅ ملف شخصي للطفل

---

## 🚀 التثبيت

### المتطلبات
- Node.js 18+
- npm أو yarn
- Expo CLI
- Android Studio (للأندرويد) أو Xcode (لـ iOS)

### خطوات التثبيت

```bash
# 1. استنساخ المشروع
git clone https://github.com/yourusername/tiny-teacher.git
cd tiny-teacher/mobile

# 2. تثبيت الحزم
npm install

# 3. إضافة مفتاح OpenAI
# افتح src/config/ApiKeys.js وضع مفتاحك:
# OPENAI_API_KEY: "sk-YOUR_KEY_HERE"

# 4. تشغيل التطبيق
npx expo start

# 5. اختر المنصة:
# - اضغط 'a' للأندرويد
# - اضغط 'i' لـ iOS
# - اضغط 'w' للويب
```

---

## 📱 البناء للإنتاج

### بناء APK (Android)

```bash
# باستخدام EAS Build (موصى به)
npm install -g eas-cli
eas login
eas build --platform android --profile preview

# أو بناء محلي
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

### بناء IPA (iOS)

```bash
eas build --platform ios --profile preview
```

---

## 🎯 الاستخدام

### 1. تسجيل الدخول
- افتح التطبيق
- سجل دخول أو ادخل كضيف

### 2. اختر درساً
- من الشاشة الرئيسية، اضغط "الدروس"
- اختر درساً (مثلاً: الحروف الأبجدية)

### 3. تعلم مع المعلم
- اضغط "▶️ شغل"
- المعلم سيشرح الدرس
- سيرسم على السبورة
- استمع وتعلم!

### 4. استخدم المعلم الذكي
- اضغط "🤖 المعلم" من الشاشة الرئيسية
- تحدث مع المعلم
- اسأل أي سؤال
- المعلم سيجيب ويرسم على السبورة

---

## 🏗️ البنية التقنية

### التقنيات المستخدمة

```
Frontend:
├── React Native 0.73
├── Expo 50.0
├── React Navigation 6
├── Reanimated 3 (للحركات)
└── React Native SVG (للرسم)

Backend/Services:
├── OpenAI API (الذكاء الاصطناعي)
├── React Native TTS (النطق)
├── React Native Voice (التعرف على الصوت)
└── AsyncStorage (التخزين المحلي)

Design:
├── Material Design 3
├── Custom Theme System
└── Responsive Layout
```

### هيكل المشروع

```
mobile/
├── src/
│   ├── components/
│   │   ├── avatar/          # الشخصية المتحركة
│   │   ├── Button.js        # مكون الزر
│   │   ├── Card.js          # مكون البطاقة
│   │   └── Whiteboard.js    # السبورة
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── HomeScreen.js
│   │   ├── LessonsScreen.js
│   │   ├── LessonDetailScreen.js
│   │   ├── ClassroomScreen.js
│   │   └── ProfileScreen.js
│   ├── services/
│   │   └── AIService.js     # خدمة OpenAI
│   ├── config/
│   │   ├── theme.js         # نظام الألوان
│   │   └── ApiKeys.js       # المفاتيح
│   └── data/
│       └── lessons.js       # بيانات الدروس
├── assets/                  # الصور والأيقونات
├── App.js                   # نقطة الدخول
└── app.json                 # تكوين Expo
```

---

## 🎨 لقطات الشاشة

### الشاشة الرئيسية
![Home Screen](./screenshots/home.png)

### الدروس
![Lessons](./screenshots/lessons.png)

### المعلم التفاعلي
![Teacher](./screenshots/classroom.png)

---

## 🔧 التكوين

### إعداد OpenAI API

1. احصل على مفتاح من: https://platform.openai.com/api-keys
2. افتح `src/config/ApiKeys.js`
3. ضع المفتاح:

```javascript
export const API_KEYS = {
  OPENAI_API_KEY: "sk-YOUR_KEY_HERE",
};
```

### تخصيص الألوان

افتح `src/config/theme.js` وعدل الألوان:

```javascript
export const theme = {
  colors: {
    primary: '#5B8DEF',      // اللون الأساسي
    secondary: '#FFB84D',    // اللون الثانوي
    // ...
  },
};
```

---

## 📚 الدروس المتوفرة

1. **الحروف الأبجدية** (A-Z)
2. **الأرقام** (1-10)
3. **الألوان** (الأحمر، الأزرق، الأصفر...)
4. **الأشكال** (مربع، دائرة، مثلث...)
5. **الحيوانات** (كلب، قطة، طائر...)

---

## 🤝 المساهمة

نرحب بالمساهمات! إذا كنت تريد المساعدة:

1. Fork المشروع
2. أنشئ branch جديد (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push إلى Branch (`git push origin feature/AmazingFeature`)
5. افتح Pull Request

---

## 📄 الترخيص

هذا المشروع مرخص تحت MIT License - انظر ملف [LICENSE](LICENSE) للتفاصيل.

---

## 👥 الفريق

- **المطور**: [اسمك]
- **التصميم**: AI-Generated Assets
- **المحتوى التعليمي**: فريق Tiny Teacher

---

## 📞 التواصل

- **Email**: support@tinyteacher.com
- **Website**: www.tinyteacher.com
- **GitHub**: https://github.com/yourusername/tiny-teacher

---

## 🙏 شكر خاص

- [Expo](https://expo.dev/) - منصة التطوير
- [OpenAI](https://openai.com/) - الذكاء الاصطناعي
- [React Native](https://reactnative.dev/) - إطار العمل

---

<div align="center">

**صنع بـ ❤️ للأطفال في كل مكان**

⭐ إذا أعجبك المشروع، لا تنسَ إعطاءه نجمة!

</div>
