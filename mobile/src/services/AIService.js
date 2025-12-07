import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// استخدام نفس مفتاح Google Cloud المستخدم للصوت
const GOOGLE_API_KEY = 'AIzaSyCd4HQDcNeF6WztPhTOhUbcoiqZi79Q5ug';

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
     * المحادثة باستخدام Google Gemini AI
     */
    async chat(userMessage, base64Image = null) {
        try {
            const systemPrompt = `أنتِ معلمة ذكية اسمها "تيني" تعلم الأطفال.

القدرات:
1. شرح الدروس بطريقة بسيطة وممتعة
2. الرسم على السبورة (SVG paths)
3. تشجيع الطفل

عند الرد، استخدم JSON بهذا الشكل:
{
  "text": "الرد بالعربية",
  "draw": "SVG path للرسم على السبورة (اختياري)",
  "action": "listening أو explain_board أو idle",
  "emotion": "happy أو surprised أو thinking أو neutral"
}

مثال للرسم: حرف الألف = "M150 50 L150 200 M150 50 L130 30 M150 50 L170 30"`;

            // بناء المحادثة
            let conversationHistory = this.context.slice(-5).map(msg => {
                if (typeof msg.content === 'string') {
                    return msg.role === 'user' ? `الطفل: ${msg.content}` : `المعلمة: ${msg.content}`;
                }
                return msg.role === 'user' ? `الطفل: ${msg.content[0]?.text || ''}` : `المعلمة: ${msg.content}`;
            }).join('\n');

            const fullPrompt = `${systemPrompt}\n\nالمحادثة السابقة:\n${conversationHistory}\n\nالطفل الآن: ${userMessage}\n\nردك (JSON فقط):`;

            // استدعاء Google Gemini API
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GOOGLE_API_KEY}`,
                {
                    contents: [{
                        parts: [{
                            text: fullPrompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500,
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            // استخراج الرد
            const aiText = response.data.candidates[0].content.parts[0].text;

            // محاولة تحليل JSON
            let aiResponse;
            try {
                // إزالة markdown code blocks إذا وجدت
                const cleanedText = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                aiResponse = JSON.parse(cleanedText);
            } catch (parseError) {
                // إذا فشل التحليل، استخدم النص مباشرة
                aiResponse = {
                    text: aiText,
                    action: "listening",
                    emotion: "happy"
                };
            }

            // حفظ في الذاكرة
            this.context.push({ role: 'user', content: userMessage });
            this.context.push({ role: 'assistant', content: aiResponse.text });
            this.saveMemory();

            return aiResponse;

        } catch (error) {
            console.error('Google Gemini Error:', error);
            return {
                text: "عذراً، لم أفهم جيداً. هل يمكنك الإعادة؟",
                action: "listening",
                emotion: "thinking"
            };
        }
    }

    async generateGreeting() {
        return this.chat(`الطفل ${this.userProfile.name} موجود. رحب به بحماس.`);
    }
}

export const aiService = new AIService();
