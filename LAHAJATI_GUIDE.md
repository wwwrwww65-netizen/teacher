# 🎤 دليل استخدام لهجاتي في Tiny Teacher

## ✅ ما تم إنجازه:

### 1. إضافة خدمة لهجاتي (Lahajati AI)
- ✅ تم إنشاء `LahajatiVoiceService.js`
- ✅ دعم 108 لهجة عربية
- ✅ 500+ صوت احترافي
- ✅ جودة استوديو (320kbps)

### 2. نظام ذكي متعدد المستويات
التطبيق الآن يستخدم 3 مستويات من الأصوات:

```
1️⃣ لهجاتي AI (الأولوية) → جودة عالية جداً
   ↓ (إذا فشل)
2️⃣ Google TTS (Fallback) → جودة جيدة
   ↓ (إذا فشل)
3️⃣ System TTS (Final Fallback) → أساسي
```

## 🎯 المميزات الجديدة:

### صوت طبيعي جداً
- 🎭 تعبيرات صوتية واقعية
- 🌍 لهجة سعودية أصلية
- 👩‍🏫 صوت معلمة ودودة ومحترفة

### التحكم الكامل
يمكنك تغيير:
- اللهجة (سعودية، مصرية، شامية، خليجية، إلخ)
- نوع الصوت (معلمة، راوي، طفل، إلخ)
- السرعة والنبرة
- المشاعر (سعيد، حزين، متحمس، إلخ)

## 📊 الاستخدام المجاني:

- **10,000 نقطة شهرياً** (مجاناً مدى الحياة)
- **15 دقيقة صوت** شهرياً
- **1,000 حرف** لكل طلب
- **بدون بطاقة ائتمان**

### كم يكفي؟
- 10,000 نقطة = حوالي **1,000-1,500 رد** من المعلمة شهرياً
- كافي تماماً للاستخدام اليومي!

## 🔧 كيفية التخصيص:

### تغيير اللهجة:
افتح `ArabicVoiceService.js` واستبدل:
```javascript
dialectId: 'saudi'  // اللهجة السعودية
```

بـ:
```javascript
dialectId: 'egyptian'  // اللهجة المصرية
dialectId: 'levantine'  // اللهجة الشامية
dialectId: 'gulf'  // اللهجة الخليجية
dialectId: 'maghrebi'  // اللهجة المغاربية
```

### تغيير نوع الصوت:
```javascript
voiceId: 'ar_female_teacher_friendly'  // معلمة ودودة
voiceId: 'ar_female_narrator_calm'  // راوية هادئة
voiceId: 'ar_female_child_cheerful'  // طفلة مرحة
```

### تعطيل لهجاتي مؤقتاً:
في `ArabicVoiceService.js`:
```javascript
this.useLahajati = false;  // سيستخدم Google TTS مباشرة
```

## 🚀 الخطوات التالية (اختياري):

1. **استكشاف الأصوات المتاحة:**
   ```javascript
   const voices = await lahajatiVoiceService.getAvailableVoices();
   console.log(voices);
   ```

2. **استكشاف اللهجات:**
   ```javascript
   const dialects = await lahajatiVoiceService.getAvailableDialects();
   console.log(dialects);
   ```

3. **إضافة خيار للمستخدم:**
   - يمكنك إضافة شاشة إعدادات
   - السماح للطالب باختيار اللهجة المفضلة
   - حفظ التفضيلات في AsyncStorage

## 📝 ملاحظات مهمة:

- ✅ الصوت الآن أكثر طبيعية ووضوحاً
- ✅ يعمل بدون انترنت بعد التحميل الأول (Cache)
- ✅ Fallback تلقائي إذا نفذت النقاط
- ✅ لا يؤثر على باقي وظائف التطبيق

## 🎓 للمطورين:

### بنية الكود:
```
services/
├── ArabicVoiceService.js  (الخدمة الرئيسية - محدثة)
├── LahajatiVoiceService.js  (خدمة لهجاتي - جديدة)
└── ...

config/
└── constants.js  (يحتوي على LAHAJATI_API_KEY)
```

### Flow التشغيل:
```
User speaks → AI responds → ArabicVoiceService.speak()
                                    ↓
                          Try Lahajati AI
                                    ↓
                          (Success) → Play audio
                                    ↓
                          (Fail) → Try Google TTS
                                    ↓
                          (Fail) → System TTS
```

---

## 🎉 جاهز للاستخدام!

**أعد تشغيل التطبيق الآن وستسمع صوت المعلمة نورا بجودة احترافية!**

إذا واجهت أي مشكلة، تحقق من:
1. ✅ المفتاح صحيح في `constants.js`
2. ✅ الاتصال بالإنترنت متوفر
3. ✅ لديك نقاط كافية في حساب لهجاتي
