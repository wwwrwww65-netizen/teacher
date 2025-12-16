import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOOGLE_API_KEY, ANDROID_PACKAGE_NAME, ANDROID_CERT_FINGERPRINT } from '../config/constants';

class AIService {
    constructor() {
        this.context = [];
        this.userProfile = {
            name: 'صديقي',
            grade: 'الروضة',
            interests: []
        };
        this.loadMemory();
    }

    async loadMemory() {
        try {
            const savedContext = await AsyncStorage.getItem('ai_memory');
            if (savedContext) {
                this.context = JSON.parse(savedContext);
                if (this.context.length > 20) this.context = this.context.slice(-20);
            }
        } catch (e) { console.log('Failed to load memory'); }
    }

    async saveMemory() {
        try { await AsyncStorage.setItem('ai_memory', JSON.stringify(this.context)); }
        catch (e) { console.log('Failed to save memory'); }
    }

    setUserProfile(name, grade, interests = []) {
        this.userProfile = { name, grade, interests };
    }

    /**
     * المحادثة باستخدام Google Gemini 1.5 Flash (سريع + يدعم الصور)
     */
    async chat(userMessage, base64Image = null) {
        try {
            console.log('🤖 Sending to Gemini...');

            const systemPrompt = `أنتِ معلمة ذكية اسمها "تيني" تعلم الأطفال.
الطفل: ${this.userProfile.name} (${this.userProfile.grade}).

القدرات:
1. شرح الدروس بطريقة بسيطة وممتعة
2. الرسم على السبورة (SVG Reference) - إذا طلب الطفل أو للشرح
3. الحركة (walkToBoard) للشرح
4. التفاعل العاطفي
5. طلب كتابة الحروف (practice_writing)

استراتيجية التعليم (Teaching Strategy):
عندما يطلب الطفل تعليم الحروف، اتبعي الخطوات التالية بذكاء:
1. العرض: اشرحي الحرف وارسميه على السبورة (explain_board و draw).
2. التلقين: اطلبي من الطفل ترديد الحرف خلفك.
3. الممارسة: اطلبي من الطفل كتابة الحرف (استخدمي action: practice_writing).
4. التقويم: بعد الكتابة بنجاح، اختبريه أو انتقلي للحرف التالي.
5. التحفيز: شجعي الطفل دائماً بعبارات حماسية.

تعليمات صارمة (Strict Instructions):
1. رد فقط بصيغة JSON صحيح.
2. لا تستخدم markdown (مثل \`\`\`json).
3. لا تكتب أي نص خارج الـ JSON.
4. إذا كان الـ action هو "explain_board"، يجب أن تضع قيمة في حقل "draw".
5. إذا أردتِ أن يكتب الطفل، استخدمي \`action: "practice_writing"\` وضعي الحرف في \`data\`.

الرد JSON Structure:
{
  "text": "الرد بالعربية",
  "draw": "SVG path data",
  "action": "explain_board | listening | practice_writing | idle",
  "data": "أ (فقط في حالة practice_writing)",
  "emotion": "happy | surprised | thinking | neutral | laugh"
}

مساحة الرسم (Canvas Size): 300x200.
يجب أن تكون جميع إحداثيات الرسم (coordinates) داخل النطاق X:0-300 و Y:0-200.

أمثلة رسم (SVG Path Data):
- دائرة (في المنتصف): "M 150, 100 m -50, 0 a 50,50 0 1,0 100,0 a 50,50 0 1,0 -100,0"
- مربع: "M 100 50 H 200 V 150 H 100 Z"
- مثلث: "M 150 50 L 250 250 L 50 250 Z"
- صح: "M 50 150 L 100 200 L 250 50"
`;

            // بناء المحتوى (Multi-model support)
            const contents = [];

            // 1. التاريخ (Text only for now due to complexity of mixed history)
            // نكتفي بآخر 3 محادثات لتقليل التكلفة وتسريع الرد
            const history = this.context.slice(-6).map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            contents.push(...history);

            // 2. الرسالة الحالية (Text + Image if exists)
            const currentParts = [{ text: `${systemPrompt}\n\nالطفل يقول: ${userMessage}` }];

            if (base64Image) {
                console.log('📸 Attached Image to prompt');
                currentParts.push({
                    inline_data: {
                        mime_type: "image/jpeg",
                        data: base64Image
                    }
                });
            }

            contents.push({
                role: 'user',
                parts: currentParts
            });

            // استدعاء Google Gemini 1.5 Flash API
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GOOGLE_API_KEY}`,
                {
                    contents: contents,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500,
                        responseMimeType: "application/json" // Force JSON mode in 1.5 Flash
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(Platform.OS !== 'web' ? {
                            'X-Android-Package': ANDROID_PACKAGE_NAME,
                            'X-Android-Cert': ANDROID_CERT_FINGERPRINT
                        } : {})
                    }
                }
            );

            // استخراج الرد
            // استخراج الرد بأمان
            console.log('🤖 Raw Response:', JSON.stringify(response.data)); // Log full response for debugging

            if (!response.data.candidates || !response.data.candidates[0] || !response.data.candidates[0].content) {
                console.warn('⚠️ Gemini returned empty candidates (Safety block?).');
                return {
                    text: "أنا هنا، لكن لم أستطع تكوين رد مناسب.",
                    action: "listening",
                    emotion: "neutral"
                };
            }

            let aiRawText = response.data.candidates[0].content.parts[0].text;

            // CLEANUP: Remove markdown code blocks if present (```json ... ```)
            aiRawText = aiRawText.replace(/```json/g, "").replace(/```/g, "");

            console.log('🤖 Gemini Text:', aiRawText);

            let aiResponse;
            try {
                // Robust JSON Extraction: Find first '{' and last '}'
                const start = aiRawText.indexOf('{');
                const end = aiRawText.lastIndexOf('}');

                if (start !== -1 && end !== -1) {
                    let jsonStr = aiRawText.substring(start, end + 1);
                    // Sanitize common JSON breakers
                    jsonStr = jsonStr.replace(/[\u0000-\u001F]+/g, " ");
                    aiResponse = JSON.parse(jsonStr);
                } else {
                    throw new Error("No JSON found");
                }
            } catch (parseError) {
                console.warn('JSON Parse Validation Failed', parseError);

                // Fallback: Try regex extraction for text and simple action
                // Support both "text": "value" and "text": 'value', and multiline content
                const textMatch = aiRawText.match(/"text"\s*:\s*["']([\s\S]*?)["']\s*(,|}|\n)/);
                const actionMatch = aiRawText.match(/"action"\s*:\s*["']([^"']*)["']/);

                if (textMatch) {
                    aiResponse = {
                        text: textMatch[1],
                        action: actionMatch ? actionMatch[1] : "listening",
                        emotion: "neutral"
                    };
                } else {
                    // Last resort: Parsing failed and Regex failed.

                    // CRITICAL FIX: If this was a lesson request, FORCE the correct scripted response
                    // instead of showing an error. This hides AI glitching.
                    // BUT: Don't trigger if user says "wrote" or "done" (Progress)
                    const isProgress = userMessage.includes('كتبت') || userMessage.includes('تم') || userMessage.includes('صح');
                    const isStartRequest = userMessage.includes('علم') || userMessage.includes('حروف') || userMessage.includes('أ');

                    if (isStartRequest && !isProgress) {
                        console.log('⚠️ Parse failed, forcing scripted Alef Lesson.');
                        aiResponse = {
                            text: "حسناً يا بطل! اليوم سنتعلم حرف الألف. انظر للسبورة. (أ)... هذا هو شكله.",
                            action: "explain_board",
                            draw: "M 150 90 L 150 190 M 165 50 C 135 50 135 70 165 70 L 180 80",
                            emotion: "happy"
                        };
                    } else if (isProgress) {
                        // Fallback for success if parse failed
                        aiResponse = {
                            text: "ممتاز! أحسنت عملاً. هل تريد الانتقال للحرف التالي؟",
                            action: "listening",
                            emotion: "happy"
                        };
                    } else {
                        // For other topics, try to return clean text or generic apology
                        const isCode = aiRawText.trim().startsWith('{') || aiRawText.includes('"text":');
                        aiResponse = {
                            text: isCode ? "آسفة، لم أفهم الرد جيداً." : (aiRawText.trim() || "آسفة، لم أسمعك جيداً."),
                            action: "listening",
                            emotion: "neutral"
                        };
                    }
                }
            }

            // حفظ في الذاكرة (Text only)
            this.context.push({ role: 'user', content: userMessage });
            this.context.push({ role: 'assistant', content: aiResponse.text });
            this.saveMemory();

            return aiResponse;

        } catch (error) {
            console.error('Gemini API Error:', error.response?.data || error.message);

            // FALLBACK FOR WEB SIMULATOR (CORS issues) or Offline

            // 1. Check if user is REPEATING the letter (Step 2 -> Step 3)
            if (userMessage.includes('ألف') || userMessage.includes('ا') || userMessage.includes('aaa')) {
                return {
                    text: "ممتاز! صوتك رائع يا بطل. الآن، هل يمكنك كتابة حرف الألف في دفترك؟ سأفتح لك السبورة.",
                    action: "practice_writing",
                    data: "أ",
                    emotion: "happy"
                };
            }

            // 2. Default Start: Explain Alef (Step 1 -> Step 2)
            // Fix: Don't restart if user says "wrote" or "done"
            const isProgress = userMessage.includes('كتبت') || userMessage.includes('تم') || userMessage.includes('صح');

            if ((userMessage.includes('علم') || userMessage.includes('حروف') || userMessage.includes('أ')) && !isProgress) {
                return {
                    text: "حسناً يا بطل! اليوم سنتعلم حرف الألف. انظر للسبورة. (أ)... هذا هو شكله. والآن دورك! ردد خلفي بصوت عالٍ: (ألف)!",
                    action: "explain_board",
                    // Stick (150,90 to 150,190) + Standard Hamza (Right-facing C style)
                    draw: "M 150 90 L 150 190 M 165 50 C 135 50 135 70 165 70 L 180 80",
                    emotion: "happy"
                };
            }

            // 3. Complaint Handler (Fix Drawing)
            if (userMessage.includes('خطأ') || userMessage.includes('معكوس') || userMessage.includes('واضح')) {
                return {
                    text: "عذراً يا بطل! سأعيد رسمها لك بشكل أوضح. انظر الآن.. عصا طويلة وهمزة فوقها. هل هي واضحة الآن؟",
                    action: "explain_board",
                    // REDRAW: Very simple and bold Alef
                    draw: "M 150 90 L 150 190 M 165 50 C 135 50 135 70 165 70 L 180 80",
                    emotion: "surprised"
                };
            }

            // 4. Success Handler (Feedback Loop)
            if (userMessage.includes('كتبت') && userMessage.includes('صحيح')) {
                return {
                    text: "ما شاء الله! أنت بطل حقيقي! خطك جميل جداً. هل تريد أن نتعلم حرفاً آخر؟",
                    action: "listening", // Wait for "Yes/No" or next letter
                    emotion: "happy"
                };
            }

            // 5. Next Letter Handler (Transition)
            if (userMessage.includes('نعم') || userMessage.includes('التالي') || userMessage.includes('حرف آخر')) {
                return {
                    text: "رائع! الحرف التالي هو حرف الباء. (ب). طبق فاكهة وتحته نقطة. انظر للسبورة.",
                    action: "explain_board",
                    draw: "M 200 100 Q 150 200 100 100 M 150 220 L 150 230", // Baa shape
                    emotion: "happy"
                };
            }

            return {
                text: "يا بطل، حدثت مشكلة صغيرة في الاتصال، لكن لا تقلق! يمكننا المحاولة مجدداً.",
                action: "listening",
                emotion: "thinking"
            };
        }
    }

    async generateGreeting() {
        return this.chat(`الطفل ${this.userProfile.name} وصل للفصل. رحبي به بحماس.`);
    }
}

export const aiService = new AIService();
