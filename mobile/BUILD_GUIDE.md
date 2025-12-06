# 📱 Tiny Teacher - دليل البناء والتشغيل

## ✅ الملخص: كل شيء جاهز لإنشاء APK

تم إكمال جميع المتطلبات لبناء التطبيق:

### ما تم إنجازه:
1. ✅ **الشخصية المتحركة (Avatar)**: مبنية بالكامل باستخدام SVG + Reanimated
2. ✅ **السبورة (Whiteboard)**: مع رسم متزامن
3. ✅ **الذكاء الاصطناعي (AI)**: متصل بـ OpenAI API
4. ✅ **التعرف على الصوت (Voice Recognition)**: باستخدام @react-native-voice/voice
5. ✅ **النطق (Text-to-Speech)**: باستخدام react-native-tts
6. ✅ **الأذونات (Permissions)**: INTERNET + RECORD_AUDIO
7. ✅ **التكوين (Configuration)**: ملف ApiKeys.js جاهز

---

## 🔑 الخطوة 1: إضافة مفتاح OpenAI

افتح الملف: `src/config/ApiKeys.js`

```javascript
export const API_KEYS = {
  OPENAI_API_KEY: "sk-YOUR_OPENAI_KEY_HERE", // ⬅️ ضع مفتاحك هنا
};
```

**كيف تحصل على المفتاح:**
1. اذهب إلى: https://platform.openai.com/api-keys
2. سجل دخول أو أنشئ حساب
3. اضغط "Create new secret key"
4. انسخ المفتاح وضعه في الملف أعلاه

---

## 📦 الخطوة 2: بناء APK

### الطريقة 1: باستخدام EAS Build (موصى بها)

```powershell
# تثبيت EAS CLI (مرة واحدة فقط)
npm install -g eas-cli

# تسجيل الدخول (إذا لم تكن مسجلاً)
eas login

# بناء APK للأندرويد
eas build --platform android --profile preview
```

سيتم رفع المشروع وبناؤه على سيرفرات Expo، وستحصل على رابط تحميل APK بعد الانتهاء (5-10 دقائق).

### الطريقة 2: بناء محلي (يتطلب Android Studio)

```powershell
# تثبيت الحزم المطلوبة
npx expo install

# إنشاء مجلدات Android الأصلية
npx expo prebuild --platform android

# بناء APK
cd android
./gradlew assembleRelease

# ستجد APK في:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 🧪 الخطوة 3: الاختبار قبل البناء

```powershell
# تشغيل على المحاكي/الجهاز
npx expo start

# ثم اختر:
# - اضغط 'a' للأندرويد
# - أو امسح QR code بتطبيق Expo Go
```

---

## 📝 ملاحظات مهمة

### الميزات الحالية:
- ✅ المعلم يتحرك ويتكلم تلقائياً
- ✅ يستمع لصوت الطفل (على جهاز حقيقي فقط، ليس المحاكي)
- ✅ يفكر باستخدام OpenAI
- ✅ يرسم على السبورة أثناء الشرح
- ✅ Lip-sync (حركة الفم مع الكلام)

### القيود:
- 🎤 **التعرف على الصوت** لن يعمل على المحاكي (يحتاج جهاز حقيقي)
- 🔑 **بدون مفتاح OpenAI**: سيخبرك المعلم أن يضع المفتاح
- 🌐 **يحتاج إنترنت**: للاتصال بـ OpenAI API

---

## 🐛 حل المشاكل

### مشكلة: "OpenAI API Key is missing"
**الحل:** ضع المفتاح في `src/config/ApiKeys.js`

### مشكلة: "Voice recognition not working"
**الحل:** جرب على جهاز حقيقي (ليس محاكي)، وتأكد من إعطاء إذن الميكروفون

### مشكلة: "Build failed"
**الحل:** 
```powershell
# امسح الكاش وأعد التثبيت
rm -rf node_modules
npm install
npx expo prebuild --clean
```

---

## 📂 هيكل المشروع

```
mobile/
├── src/
│   ├── components/
│   │   ├── avatar/
│   │   │   ├── Avatar.js           # المكون الرئيسي للشخصية
│   │   │   ├── AvatarParts.js      # أجزاء SVG
│   │   │   └── AvatarAnimations.js # منطق الحركة
│   │   └── Whiteboard.js           # السبورة
│   ├── screens/
│   │   └── ClassroomScreen.js      # الشاشة الرئيسية
│   ├── services/
│   │   └── AIService.js            # خدمة OpenAI + Voice
│   └── config/
│       └── ApiKeys.js              # 🔑 ضع المفاتيح هنا
├── app.json                        # تكوين Expo
└── package.json                    # الحزم
```

---

## 🚀 الخطوات التالية (اختياري)

1. **تحسين الرسم على السبورة**: إضافة أشكال أكثر تعقيداً
2. **إضافة دروس محفوظة**: قاعدة بيانات محلية
3. **تحسين الصوت**: استخدام ElevenLabs بدلاً من TTS الافتراضي
4. **وضع Offline**: حفظ بعض الدروس للعمل بدون إنترنت

---

**🎉 مبروك! تطبيقك جاهز للبناء.**
