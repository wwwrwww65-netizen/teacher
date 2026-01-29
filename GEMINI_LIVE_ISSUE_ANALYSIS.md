# 🔍 تحليل مشكلة انقطاع Gemini Live

## 📊 ملخص المشكلة

بناءً على الـ Logs المقدمة، المشكلة هي:

```
LOG  📡 [LIVE] WebSocket Connected ✅
LOG  ⏳ [LIVE] Waiting to send greeting message after setup...
LOG  📡 [LIVE] Connection Closed 🔌
LOG  🔄 [LIVE] Unexpected drop. Reconnecting (Attempt 1)...
```

**الاتصال يتم بنجاح ثم ينقطع فوراً قبل إرسال رسالة الترحيب!**

---

## 🔴 الأسباب المحتملة

### 1. ❌ **مشكلة في API Key أو الرصيد المالي**

#### الأعراض:
- الاتصال يتم (`WebSocket Connected ✅`)
- ثم ينقطع فوراً بدون رسالة خطأ واضحة
- يحاول إعادة الاتصال 4 مرات وكلها تفشل بنفس الطريقة

#### الأسباب:
- **API Key غير صالح** أو **منتهي الصلاحية**
- **الرصيد المالي انتهى** في Google Cloud
- **Quota/Limit تم تجاوزه** (Free tier أو Paid tier)
- **Billing غير مفعّل** أو **طريقة الدفع فشلت**

#### كيفية الفحص:
```bash
# 1. افحص API Key
node test_gemini_api.js

# 2. تحقق من Google Cloud Console
# https://console.cloud.google.com/billing
# https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas

# 3. تحقق من Gemini API Console
# https://aistudio.google.com/app/apikey
```

---

### 2. ⚠️ **System Prompt كبير جداً**

#### الأعراض من الكود:
```javascript
LOG  🧠 [LIVE] System Prompt Prepared with Context length: 15536
```

**15,536 حرف = حوالي 15 KB من النص!**

#### المشكلة:
- Gemini Live WebSocket قد يرفض System Prompt كبير جداً
- الاتصال يُقبل لكن يُغلق فوراً عند معالجة الـ Setup Message

#### الحل:
- تقليص System Prompt
- إزالة الأمثلة المكررة
- نقل بعض التعليمات إلى Context بدلاً من System Instruction

---

### 3. 🔧 **مشكلة في Setup Message**

#### من الكود:
```javascript
const setupMessage = {
    setup: {
        model: modelName,
        generation_config: { 
            response_modalities: ["TEXT"],
            temperature: 0.2,
            response_mime_type: "text/plain"
        },
        system_instruction: {
            parts: [{
                text: finalSystemPrompt  // 15KB!
            }]
        },
        tools: [...]  // 4 أدوات
    }
};
```

#### المشاكل المحتملة:
- `response_mime_type: "text/plain"` قد لا يكون مدعوماً في Gemini Live
- الـ Tools كبيرة جداً مع System Prompt الكبير
- Total payload size تجاوز الحد المسموح

---

### 4. 🌐 **مشكلة في الشبكة أو الـ Server**

#### الأعراض:
- الاتصال يتم ثم ينقطع بدون `setupComplete`
- لا توجد رسالة خطأ من الـ Server

#### الأسباب:
- Gemini Live Server رفض الطلب بصمت
- Network timeout
- Firewall أو Proxy يمنع WebSocket

---

## ✅ خطوات الحل المقترحة

### الخطوة 1: فحص API Key والرصيد المالي

```bash
# قم بتعديل test_gemini_api.js وضع API Key الخاص بك
# ثم شغّل:
node test_gemini_api.js
```

**إذا فشل الاختبار:**
- تحقق من https://console.cloud.google.com/billing
- تأكد من تفعيل Billing
- تحقق من صلاحية طريقة الدفع
- تحقق من Quota: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas

---

### الخطوة 2: تقليص System Prompt

**المشكلة الحالية:**
- System Prompt = 15,536 حرف
- مع Tools والـ Config = أكثر من 20 KB

**الحل:**
1. احذف الأمثلة المكررة
2. اختصر التعليمات
3. استخدم نقاط مختصرة بدلاً من فقرات طويلة

**الحد الأقصى المقترح:**
- System Prompt: 5,000 - 8,000 حرف
- Total Setup Message: أقل من 15 KB

---

### الخطوة 3: إزالة `response_mime_type`

في `GeminiLiveService.js`:

```javascript
// قبل
generation_config: { 
    response_modalities: ["TEXT"],
    temperature: 0.2,
    response_mime_type: "text/plain"  // ❌ احذف هذا
}

// بعد
generation_config: { 
    response_modalities: ["TEXT"],
    temperature: 0.2
}
```

---

### الخطوة 4: إضافة Error Handling أفضل

```javascript
ws.onmessage = (event) => {
    try {
        const response = JSON.parse(event.data);
        
        // ✅ أضف هذا
        if (response.error) {
            console.log('❌ [LIVE] Server Error:', JSON.stringify(response.error));
            console.log('📝 Error Details:', response.error.message);
            console.log('🔢 Error Code:', response.error.code);
        }
        
        if (response.setupComplete || response.setup_complete) {
            // ...
        }
    } catch (e) {
        console.log('⚠️ Parse Error:', e.message);
    }
};
```

---

### الخطوة 5: اختبار بدون System Prompt

**للتأكد من أن المشكلة في System Prompt:**

```javascript
// اختبار مؤقت - احذف System Prompt تماماً
const setupMessage = {
    setup: {
        model: modelName,
        generation_config: { 
            response_modalities: ["TEXT"],
            temperature: 0.2
        }
        // ❌ لا system_instruction
        // ❌ لا tools
    }
};
```

**إذا نجح الاتصال:**
- المشكلة في System Prompt أو Tools
- قلّص الحجم تدريجياً حتى يعمل

**إذا فشل:**
- المشكلة في API Key أو Billing

---

## 🔍 كيفية معرفة السبب الدقيق

### 1. تحقق من Firebase Logs

```javascript
// في GeminiLiveService.js
ws.onclose = (event) => {
    console.log('🔌 [LIVE] Connection Closed');
    console.log('📊 Close Code:', event.code);
    console.log('📝 Close Reason:', event.reason);
    console.log('🔍 Was Clean:', event.wasClean);
};
```

**Close Codes:**
- `1000`: Normal closure (نجاح)
- `1002`: Protocol error (خطأ في الرسالة)
- `1003`: Unsupported data (بيانات غير مدعومة)
- `1006`: Abnormal closure (انقطاع غير طبيعي)
- `1008`: Policy violation (مخالفة - مثل API Key)
- `1011`: Server error (خطأ في السيرفر)

---

### 2. تحقق من Network Tab

إذا كنت تختبر في المتصفح:
1. افتح Developer Tools
2. اذهب لـ Network Tab
3. فلتر على `WS` (WebSocket)
4. شاهد الرسائل المرسلة والمستقبلة

---

### 3. اختبار مباشر عبر cURL

```bash
# اختبار REST API
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "قل مرحبا"}]
    }]
  }'
```

---

## 📋 Checklist للفحص

- [ ] API Key صالح (اختبر بـ `test_gemini_api.js`)
- [ ] Billing مفعّل في Google Cloud Console
- [ ] طريقة الدفع صالحة
- [ ] Quota لم يتم تجاوزه
- [ ] System Prompt أقل من 10 KB
- [ ] لا توجد أخطاء في Setup Message
- [ ] الشبكة تسمح بـ WebSocket
- [ ] Firebase Remote Config يحتوي على API Key صحيح

---

## 🚨 الخطوة التالية الموصى بها

**الأولوية 1: فحص API Key والرصيد**

```bash
# 1. عدّل test_gemini_api.js وضع API Key
# 2. شغّل الاختبار
node test_gemini_api.js

# 3. إذا فشل، تحقق من:
# - https://console.cloud.google.com/billing
# - https://aistudio.google.com/app/apikey
```

**الأولوية 2: تقليص System Prompt**

- احذف الأمثلة المكررة
- اختصر التعليمات
- استهدف 5,000 - 8,000 حرف فقط

**الأولوية 3: إضافة Error Logging**

- أضف `console.log` لـ Close Code و Reason
- أضف معالجة لـ `response.error`

---

## 💡 ملاحظة مهمة

من الـ Logs:
```
LOG  ✅ [Firebase] App config QUERY SUCCESS!
LOG  📋 [Firebase] Loaded API Keys for: ["revenuecat_android", "google_gemini"]
```

**هذا يعني:**
- Firebase Config يعمل ✅
- API Key موجود في Firebase ✅

**لكن:**
- لا يعني أن API Key **صالح** أو **له رصيد**
- يجب اختبار API Key مباشرة مع Gemini API

---

## 🎯 الخلاصة

**السبب الأرجح:**
1. **API Key صالح لكن الرصيد انتهى** (70% احتمال)
2. **System Prompt كبير جداً** (20% احتمال)
3. **مشكلة في Setup Message** (10% احتمال)

**الحل:**
1. شغّل `test_gemini_api.js` للتأكد من API Key
2. تحقق من Billing في Google Cloud Console
3. قلّص System Prompt إلى أقل من 8 KB
4. أضف Error Logging أفضل

---

**أي استفسار؟ أنا هنا للمساعدة! 🚀**
