import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_KEY } from '../config/ApiKeys';

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

    // ... (loadMemory, saveMemory, setUserProfile methods remain the same) ...
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
     * المحادثة مع دعم الصور (Vision)
     * @param {string} userMessage - رسالة المستخدم
     * @param {string} base64Image - (اختياري) صورة الواجب
     */
    async chat(userMessage, base64Image = null) {
        try {
            const systemPrompt = `
        أنتِ معلمة ذكية "تيني".
        
        القدرات الجديدة:
        1. **تحليل الصور**: إذا أرسل الطفل صورة واجب، حلليها بدقة. صححي الأخطاء واشرحي الحل.
        2. **تعليم الكتابة**: إذا أردتِ تعليم الطفل حرفاً، اطلبي منه كتابته.
           - استخدمي action: "practice_writing"
           - ضعي الحرف في data: "أ"
        
        Format Response JSON:
        {
          "text": "الرد",
          "draw": "SVG path (optional)",
          "action": "listening|quiz|explain_board|talk_center|practice_writing|idle",
          "emotion": "happy|surprised|thinking|neutral",
          "data": "أي بيانات إضافية (مثل الحرف المراد كتابته)"
        }
      `;

            // تجهيز محتوى الرسالة
            let userContent = [{ type: "text", text: userMessage }];

            if (base64Image) {
                userContent.push({
                    type: "image_url",
                    image_url: {
                        url: `data:image/jpeg;base64,${base64Image}`
                    }
                });
            }

            this.context.push({ role: 'user', content: userContent });

            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: "gpt-4o",
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...this.context.slice(-10)
                    ],
                    response_format: { type: "json_object" },
                    max_tokens: 500
                },
                {
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const aiResponse = JSON.parse(response.data.choices[0].message.content);

            // حفظ الرد كنص فقط في الذاكرة لتوفير المساحة
            this.context.push({ role: 'assistant', content: aiResponse.text });
            this.saveMemory();

            return aiResponse;

        } catch (error) {
            console.error('AI Service Error:', error);
            return {
                text: "حدث خطأ في الاتصال، هل يمكنك المحاولة مرة أخرى؟",
                action: "listening",
                emotion: "surprised"
            };
        }
    }

    async generateGreeting() {
        return this.chat(`الطفل ${this.userProfile.name} موجود. رحب به.`);
    }
}

export const aiService = new AIService();
