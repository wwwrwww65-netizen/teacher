# 🔨 دليل البناء المحلي (Local Build Guide)

هذا الدليل يشرح كيفية بناء ملف `AAB` أو `APK` محلياً على جهازك بدون استخدام خوادم Expo.

## 📋 المتطلبات
1. **Java Development Kit (JDK 17)**: تأكد من تثبيته.
2. **Android Studio**: مع تثبيت Android SDK 34.
3. **Node.js**: مثبت مسبقاً.

---

## 🚀 خطوات البناء

### 1. تثبيت المكتبات الجديدة
```bash
npm install
```

### 2. توليد ملفات الأندرويد (Prebuild)
هذه الخطوة ستقوم بإنشاء مجلد `android` بناءً على إعداداتنا في `app.json`.
```bash
npx expo prebuild --platform android
```
*سيطلب منك اسم الحزمة (Package Name) إذا لم يكن موجوداً، اضغط Enter للموافقة على `com.tinyteacher.app`.*

### 3. بناء ملف AAB (للمتجر)
```bash
cd android
./gradlew bundleRelease
```
*(في Windows PowerShell استخدم: `.\gradlew bundleRelease`)*

📍 **مكان الملف الناتج:**
`android/app/build/outputs/bundle/release/app-release.aab`

---

### 4. بناء ملف APK (للتجربة المباشرة)
```bash
cd android
./gradlew assembleRelease
```
*(في Windows PowerShell استخدم: `.\gradlew assembleRelease`)*

📍 **مكان الملف الناتج:**
`android/app/build/outputs/apk/release/app-release.apk`

---

## ⚙️ الإعدادات التقنية (تم ضبطها)
- **Min SDK**: 28 (Android 9 Pie)
- **Target SDK**: 34 (Android 14)
- **Compile SDK**: 34
- **Permissions**: Camera, Microphone, Internet

---

## 🔑 توقيع التطبيق (Signing)
لرفع التطبيق للمتجر، ستحتاج لإنشاء مفتاح توقيع (Keystore).
1. أنشئ المفتاح:
   ```bash
   keytool -genkey -v -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```
2. ضع الملف في `android/app`.
3. قم بإعداد `android/gradle.properties` ببيانات المفتاح.

*ملاحظة: للبناء التجريبي (Debug)، لا تحتاج لهذه الخطوة.*
