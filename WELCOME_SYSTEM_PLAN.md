# 🎯 خطة تطوير نظام الترحيب والذاكرة

## 📋 المتطلبات:

### 1️⃣ **عند الدخول الأول:**
- تسجيل اسم الطالب
- اختيار الصف
- رسالة ترحيب: "أَهْلًا وَسَهْلًا بِكَ يَا (user)! لَقَدْ عَرَفْتُ أَنَّكَ بَطَلٌ فِي (الصَّفِّ ...)، هَذَا رَائِع!"

### 2️⃣ **عند العودة:**
- تذكر الطالب
- تذكر آخر درس
- رسالة ترحيب: "أَهْلا بِعَوْدَتِكَ يَا (user)! لَقَدْ اشْتَقْتُ اليكْ. هَلْ تَذْكُرُ أَيْنَ كُنَّا؟..."

### 3️⃣ **التنويع:**
- Gemini Live يغير الرسائل قليلاً في كل مرة
- نصوص غير ثابتة

### 4️⃣ **التخزين:**
- حفظ البيانات محلياً (AsyncStorage)
- مزامنة مع Gemini Live للذاكرة طويلة المدى

---

## 🏗️ البنية الحالية:

### ✅ **موجود بالفعل:**
1. `AIService.js`:
   - `userProfile`: {name, grade, gradeId, interests, gradeVerified}
   - `loadMemory()`: يحمل من AsyncStorage
   - `saveMemory()`: يحفظ في AsyncStorage
   - `context[]`: سجل المحادثات

2. `StudentSetupScreen.js`:
   - شاشة تسجيل الطالب موجودة
   - تحفظ في AsyncStorage

3. `ClassroomScreen.js`:
   - يحمل بيانات المستخدم
   - يتصل بـ Gemini Live

### ❌ **مفقود:**
1. تتبع آخر درس/موضوع
2. رسالة ترحيب ديناميكية من Gemini
3. تحديث System Prompt ليشمل معلومات الطالب والدرس الأخير

---

## 🔧 الحل المقترح:

### **1. توسيع نظام الذاكرة:**
```javascript
// في AIService.js
this.userProfile = {
    name: '',
    grade: '',
    gradeId: 'Grade1',
    interests: [],
    gradeVerified: false,
    // جديد:
    lastLesson: '',          // آخر درس
    lastTopic: '',           // آخر موضوع
    totalSessions: 0,        // عدد الجلسات
    lastSessionDate: null,   // تاريخ آخر جلسة
    isFirstTime: true        // هل هذه أول مرة؟
}
```

### **2. تحديث System Prompt:**
```javascript
// في GeminiLiveService.js - connect()
const isFirstTime = userProfile.isFirstTime;
const lastLesson = userProfile.lastLesson;
const sessionCount = userProfile.totalSessions;

const greetingContext = isFirstTime ? 
    `هذه أول مرة تلتقي فيها بالطفل. رحبي به بحرارة واسأليه عما يحب أن يتعلم.` :
    `هذه الجلسة رقم ${sessionCount} مع الطفل. آخر درس كان: "${lastLesson}". ذكّريه بذلك بطريقة ودودة.`;
```

### **3. رسائل ترحيب متنوعة:**
Gemini Live سيولد رسائل مختلفة بناءً على:
- `isFirstTime`
- `lastLesson`
- `sessionCount`
- `name` و `grade`

### **4. تحديث الذاكرة:**
```javascript
// عند بدء جلسة جديدة
aiService.updateSession({
    lastLesson: 'حرف العين',
    totalSessions: aiService.userProfile.totalSessions + 1,
    lastSessionDate: new Date().toISOString(),
    isFirstTime: false
});
```

---

## 📍 الملفات المطلوب تعديلها:

1. ✅ `AIService.js` - توسيع userProfile + دوال جديدة
2. ✅ `GeminiLiveService.js` - تحديث System Prompt
3. ✅ `ClassroomScreen.js` - تتبع الدروس + تحديث الذاكرة
4. ⚠️ `StudentSetupScreen.js` - (قد يحتاج تحديث بسيط)

---

## 🎯 التنفيذ:

سأقوم بـ:
1. تحديث `AIService.js` لدعم الذاكرة الموسعة
2. تحديث `GeminiLiveService.js` لإضافة سياق الترحيب
3. تحديث `ClassroomScreen.js` لتتبع الدروس
4. إنشاء أمثلة للرسائل الترحيبية

---

## ✨ النتيجة المتوقعة:

### **الزيارة الأولى:**
```
المعلمة نورا: "أَهْلًا وَسَهْلًا بِكَ يَا أحمد! 
لَقَدْ عَرَفْتُ أَنَّكَ بَطَلٌ فِي الصَّفِّ الثاني، هَذَا رَائِع!
أَنَا الْمُعَلِّمَةُ نُورَا، وَهَذا فصلنا الدراسي المذهل.
قُلْ لِي يَا بَطَل.. بِمَاذَا تُحِبُّ أَنْ نَبْدَأَ رِحْلَتَنَا الْيَوْمَ؟"
```

### **الزيارة الثانية:**
```
المعلمة نورا: "أَهْلا بِعَوْدَتِكَ يَا أحمد! لَقَدْ اشْتَقْتُ اليكْ!
هَلْ تَذْكُرُ أَيْنَ كُنَّا؟ لَقَدْ وَصَلْنَا فِي الْمَرَّةِ الْمَاضِيَةِ إِلَى حرف العين.
مَا رَأْيُكَ؟ هَلْ نُكْمِلُ درسنا عن حرف العين لِتُصْبِحَ مُحْتَرِفًا فِيهِ،
أَمْ تُرِيدُ أَنْ نَبْدَأَ شَيْئًا جَدِيدًا الْيَوْمَ؟"
```

### **الزيارة الثالثة (تنويع):**
```
المعلمة نورا: "مَرْحَباً بِكَ مِنْ جَدِيد يَا بَطَلِي أحمد!
كَمْ أَنَا سَعِيدَةٌ بِرُؤْيَتِكَ!
تَذْكُرُ؟ كُنَّا نَتَعَلَّمُ حرف الميم في آخر مرة.
هَلْ أَنْتَ مُسْتَعِدٌّ لِمُغَامَرَةٍ جَدِيدَةٍ الْيَوْمَ؟"
```

---

## 💾 التخزين:

### **AsyncStorage (محلي):**
```javascript
{
    "userProfile": {
        "name": "أحمد",
        "grade": "الصف الثاني",
        "gradeId": "Grade2",
        "lastLesson": "حرف العين",
        "lastTopic": "كتابة الحرف",
        "totalSessions": 5,
        "lastSessionDate": "2026-01-11T09:30:00.000Z",
        "isFirstTime": false
    }
}
```

### **Gemini Live (ذاكرة المحادثة):**
- يتم إرسال السياق في System Prompt
- Gemini يتذكر المحادثة خلال الجلسة
- عند بدء جلسة جديدة، نرسل ملخص الجلسة السابقة

---

## 🚀 جاهز للتنفيذ!
