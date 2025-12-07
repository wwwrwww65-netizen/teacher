# 🤖 Tiny Teacher - تطبيق تعليمي تفاعلي للأطفال

<div align="center">

![Tiny Teacher](./assets/icon.png)

**تطبيق تعليمي ذكي للأطفال (4-8 سنوات) مع معلم روبوت متحرك**

[![React Native](https://img.shields.io/badge/React%20Native-0.73-blue.svg)](https://reactnative.dev/)
[![Native Build](https://img.shields.io/badge/Build-Native_Android-green.svg)]()
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

تم تحديث التطبيق لبناؤه كنظام Android Native كامل بدون الاعتماد على خدمات Expo في بيئة التشغيل، مما يضمن أداء أفضل واستقراراً أعلى.

---

## ✨ التحديثات والاصلالحات (Latest Fixes 🛠️)

تم إجراء مجموعة شاملة من الإصلاحات لضمان عمل التطبيق بسلاسة وبناء ملف APK بنجاح:

1.  **إصلاح بناء Android APK:**
    *   تم حل مشكلة `AAPT: error: file failed to compile` من خلال تحويل جميع صور الـ Assets "المزيفة" (JPEG بامتداد PNG) إلى صور PNG حقيقية باستخدام سكريبت PowerShell مخصص.
    *   تم تعطيل `ReactNativeFlipper` في `MainApplication.java` لحل مشاكل التوافق في البناء.
    *   تم إضافة دالة `onCreate` المفقودة في `MainActivity.java` لمنع توقف التطبيق (Crash) عند استخدام `react-navigation`.

2.  **إزالة الاعتماد على Expo:**
    *   تم استبدال `expo-status-bar` بمكون `StatusBar` الأصلي من React Native.
    *   تم إزالة `expo-localization` واستبداله بحل مخصص في `src/i18n/index.js`.
    *   تم تعطيل `expo-image-picker` مؤقتاً لتجنب أخطاء الربط (Linking Errors) في البناء المحلي.

3.  **تحسين واجهة المستخدم (UI/UX):**
    *   **شريط الإشعارات (Status Bar):** تم ضبط الألوان ديناميكياً لتتناسب مع كل شاشة (داكن/فاتح) وتم توحيد خلفية الشريط مع تصميم التطبيق.
    *   **التنقل (Navigation):** تم إعداد `React Navigation` بالكامل لربط جميع الشاشات (Login, Home, Lessons, Quiz, Classroom).

4.  **إصلاحات أخرى:**
    *   استخدام `require` بدلاً من `import` لملفات JSON في نظام الترجمة لتجنب مشاكل Metro Bundler.

---

## 🚀 التثبيت والتشغيل

### المتطلبات المسبقة
*   Node.js (LTS version)
*   JDK 17 or 11
*   Android Studio & SDK
*   React Native CLI

### 1. إعداد البيئة وتثبيت الحزم
```bash
# اذهب لمجلد المشروع
cd mobile

# تثبيت الحزم
npm install
```

### 2. بناء التطبيق (APK)
لبناء نسخة Release APK جاهزة للتثبيت على الهاتف:

```bash
# تشغيل أداة البناء من مجلد android
cd android
./gradlew assembleRelease
```
ستجد ملف الـ APK الناتج في:
`mobile\android\app\build\outputs\apk\release\app-release.apk`

### 3. حل مشاكل البناء (Troubleshooting)
إذا واجهت أي مشاكل أثناء البناء، جرب تنظيف المشروع أولاً:

```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

---

## 🏗️ هيكل المشروع

```
mobile/
├── android/                 # ملفات مشروع أندرويد الأصلي (Gradle, Manifest, Java)
├── src/
│   ├── components/          # المكونات القابلة لإعادة الاستخدام (Buttons, Cards, Avatar)
│   ├── screens/             # شاشات التطبيق الكاملة
│   │   ├── LoginScreen.js
│   │   ├── HomeScreen.js
│   │   ├── ClassroomScreen.js  # شاشة المعلم الذكي
│   │   └── ...
│   ├── services/            # الخدمات (API, AI, Voice)
│   │   └── ArabicVoiceService.js # خدمة الصوت العربي المتقدمة
│   ├── config/              # الإعدادات (Theme, API Keys)
│   ├── i18n/                # ملفات الترجمة (AR/EN)
│   └── assets/              # الصور والأيقونات
├── App.js                   # نقطة الدخول الرئيسية وإعدادات التنقل
├── index.js                 # تسجيل التطبيق
└── package.json             # تعريف المشروع والسكربتات
```

---

## 🎯 الاستخدام

1.  **تسجيل الدخول:** استخدم أي بريد إلكتروني وكلمة مرور (لغرض التجربة والديمو) أو ادخل كـ "ضيف".
2.  **لوحة التحكم:** ابدأ رحلة التعلم عبر الدروس، أو اذهب مباشرة إلى "المعلم".
3.  **الفصل الذكي:** تحدث مع المعلم بالصوت، وسيرد عليك ويشرح لك ويرسم على السبورة.
4.  **الاختبارات:** اختبر معلوماتك واحصل على نتائج فورية.

---

## 🔧 أدوات مفيدة (Scripts)

تم إنشاء أدوات مساعدة أثناء عملية الإصلاح، تجدها في المجلد الرئيسي:
*   `fix_assets.ps1`: لإصلاح صور الـ PNG التالفة أو المزيفة في مجلد `assets`.
*   `rename_icons.ps1`: لإصلاح أيقونات التطبيق في مجلدات `android/app/src/main/res`.

---

<div align="center">
**صنع بـ ❤️ للأطفال في كل مكان**
</div>
