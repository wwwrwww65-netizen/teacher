import { firebaseService } from './FirebaseService';

/**
 * 🔍 خدمة البحث في المناهج الدراسية
 * 
 * تبحث في المناهج الرسمية حسب البلد:
 * - اليمن: Yemen Box
 * - بقية البلدان: مواقع وزارات التربية الرسمية
 */
class CurriculumSearchService {
    constructor() {
        this.apiKey = null;
    }

    /**
     * تهيئة الخدمة وجلب API Key
     */
    async initialize() {
        try {
            const config = await firebaseService.getAppConfig();
            this.apiKey = config?.api_keys?.google_gemini;
            
            if (!this.apiKey) {
                console.warn('⚠️ [CURRICULUM] No API key found');
                return false;
            }
            
            console.log('✅ [CURRICULUM] Service initialized');
            return true;
        } catch (error) {
            console.error('❌ [CURRICULUM] Initialization failed:', error);
            return false;
        }
    }

    /**
     * البحث عن محتوى درس في المنهج الرسمي
     * 
     * @param {Object} params - معلومات الدرس
     * @param {string} params.lessonTitle - عنوان الدرس
     * @param {string} params.lessonDescription - وصف الدرس (اختياري)
     * @param {string} params.country - البلد
     * @param {string} params.grade - الصف الدراسي
     * @param {string} params.subject - المادة
     * @returns {Promise<Object>} محتوى الدرس من المنهج
     */
    async searchCurriculum({ lessonTitle, lessonDescription, country, grade, subject }) {
        try {
            console.log('🔍 [CURRICULUM] Starting search...', {
                lessonTitle,
                country,
                grade,
                subject
            });

            // التأكد من تهيئة الخدمة
            if (!this.apiKey) {
                const initialized = await this.initialize();
                if (!initialized) {
                    throw new Error('Failed to initialize curriculum search service');
                }
            }

            // تحديد استراتيجية البحث حسب البلد
            const searchStrategy = this._getSearchStrategy(country, grade, subject);
            
            // بناء استعلام البحث
            const searchQuery = this._buildSearchQuery({
                lessonTitle,
                lessonDescription,
                country,
                grade,
                subject,
                strategy: searchStrategy
            });

            console.log('📝 [CURRICULUM] Search query prepared');

            // تنفيذ البحث باستخدام Gemini REST API
            const result = await this._executeSearch(searchQuery);

            console.log('✅ [CURRICULUM] Search completed successfully');

            return {
                success: true,
                content: result.content,
                sources: result.sources,
                searchStrategy: searchStrategy,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ [CURRICULUM] Search failed:', error);
            return {
                success: false,
                error: error.message,
                content: null
            };
        }
    }

    /**
     * تحليل الصور واستخراج محتوى الدرس منها
     * 
     * @param {Array<string>} imageUris - روابط الصور
     * @param {string} lessonTitle - عنوان الدرس (للتوجيه)
     */
    async analyzeImages(imageUris, lessonTitle) {
        try {
            console.log(`📸 [CURRICULUM] Analyzing ${imageUris.length} images for lesson: ${lessonTitle}...`);
            
            if (!this.apiKey) await this.initialize();
            
            const fs = require('react-native-fs');
            const inlineDataParts = [];

            for (const uri of imageUris) {
                const mimeType = uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
                const base64Data = await fs.readFile(uri, 'base64');
                inlineDataParts.push({
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Data
                    }
                });
            }

            const prompt = `
            أنت خبير تربوي ومحلل بصري دقيق. هذه صور لدرس بعنوان "${lessonTitle}".
            مهمتك هي استخراج المحتوى التعليمي من هذه الصور *بدقة متناهية*.
            
            ⚠️ قواعد صارمة جداً:
            1. استخرج *فقط* المعلومات والمحتوى الموجود في الصور.
            2. لا تخترع أمثلة من عندك. إذا كانت الصورة تحتوي على "١٥ > ٨"، اكتبها كما هي. لا تكتب "١٥ > ٩" إذا لم تكن موجودة.
            3. سجل كل الأرقام والمعادلات والكلمات المكتوبة بدقة.
            
            📋 قدم المحتوى بتنسيق JSON (بدون ماركداون):
            {
               "objectives": ["هدف 1", "هدف 2"],
               "coreContent": "شرح تفصيلي للمفهوم كما هو مشروح في الصور...",
               "examples": ["مثال 1 (كما ورد في الصورة)", "مثال 2 (كما ورد في الصورة)", "كل مثال يجب أن يكون دقيقاً ومطابقاً لما في الصور"],
               "teacherNotes": "نصائح لشرح هذا المحتوى البصري تحديداً"
            }
            `;

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`;
            
            const requestBody = {
                contents: [{
                    parts: [
                        { text: prompt },
                        ...inlineDataParts
                    ]
                }],
                generationConfig: {
                    temperature: 0.4,
                    responseMimeType: "application/json"
                }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) { 
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log('📦 [CURRICULUM-VISION] Analysis result received.');

            let contentObj;
            try {
                contentObj = JSON.parse(rawText);
            } catch (e) {
                // Fallback basic parsing if JSON fails
                contentObj = { coreContent: rawText };
            }

            // Format result similar to text search
            const formattedContent = `
**تحليل الصور المرفقة:**
**أهداف الدرس:**
${contentObj.objectives ? contentObj.objectives.map(o => `- ${o}`).join('\n') : ''}

**المحتوى المستخرج:**
${contentObj.coreContent || ''}

**أمثلة من الصور:**
${contentObj.examples ? contentObj.examples.map(e => `- ${e}`).join('\n') : ''}

**ملاحظات:**
${contentObj.teacherNotes || ''}
            `.trim();

            return {
                success: true,
                content: formattedContent,
                searchStrategy: { name: 'تحليل الصور الذكي (Vision)' }
            };

        } catch (error) {
            console.error('❌ [CURRICULUM-VISION] Analysis failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * تحديد استراتيجية البحث حسب البلد
     */
    _getSearchStrategy(country, grade, subject) {
        // إزالة الإيموجي من اسم البلد
        const countryName = country.replace(/[^\u0600-\u06FF\s]/g, '').trim();

        // استراتيجيات خاصة لبلدان محددة
        const strategies = {
            'اليمن': {
                name: 'المناهج الدراسية اليمنية',
                searchTerms: [
                    // البحث العام المحدد
                    'المنهج الدراسي اليمني',
                    // البحث داخل الموقع الرسمي
                    `site:yemenbooks.com "الصف ${grade}" "${subject}"`
                ],
                officialSites: ['yemenbooks.com']
            },
            'السعودية': {
                name: 'وزارة التعليم السعودية',
                searchTerms: ['وزارة التعليم السعودية', 'المنهج السعودي', 'عين'],
                officialSites: ['moe.gov.sa', 'ien.edu.sa']
            },
            'مصر': {
                name: 'وزارة التربية والتعليم المصرية',
                searchTerms: ['وزارة التربية والتعليم المصرية', 'المنهج المصري'],
                officialSites: ['moe.gov.eg']
            },
            'الإمارات': {
                name: 'وزارة التربية والتعليم الإماراتية',
                searchTerms: ['وزارة التربية والتعليم الإماراتية', 'المنهج الإماراتي'],
                officialSites: ['moe.gov.ae']
            },
            'الأردن': {
                name: 'وزارة التربية والتعليم الأردنية',
                searchTerms: ['وزارة التربية والتعليم الأردنية', 'المنهج الأردني'],
                officialSites: ['moe.gov.jo']
            }
        };

        // إرجاع الاستراتيجية الخاصة أو الافتراضية
        return strategies[countryName] || {
            name: `المنهج الرسمي - ${countryName}`,
            searchTerms: [`المنهج الدراسي ${countryName}`, `وزارة التربية ${countryName}`],
            officialSites: []
        };
    }

    /**
     * بناء استعلام البحث
     */
    _buildSearchQuery({ lessonTitle, lessonDescription, country, grade, subject, strategy }) {
        const subjectMap = {
            'arabic': 'اللغة العربية',
            'quran': 'القرآن الكريم',
            'english': 'اللغة الإنجليزية',
            'math': 'الرياضيات',
            'science': 'العلوم',
            'islamic': 'التربية الإسلامية',
            'history': 'التاريخ',
            'geography': 'الجغرافيا'
        };

        const subjectName = subjectMap[subject] || subject;

        return `أنت خبير تربوي متخصص في المناهج الدراسية.

المطلوب: قدم محتوى تعليمي شامل للدرس التالي:

📚 معلومات الدرس:
- العنوان: ${lessonTitle}
${lessonDescription ? `- الوصف: ${lessonDescription}` : ''}
- المادة: ${subjectName}
- الصف: ${grade}
- البلد: ${country}

🎯 المصدر المطلوب:
${strategy.searchTerms.map(term => `- ${term}`).join('\n')}

📋 قدم المحتوى بالتنسيق التالي:

**أهداف الدرس:**
[قائمة واضحة بأهداف الدرس - 3-5 أهداف]

**المحتوى الأساسي:**
[شرح تفصيلي ومبسط للدرس مناسب للأطفال]

**الأمثلة والتمارين:**
[3-5 أمثلة عملية وتمارين تفاعلية]

**ملاحظات للمعلم:**
[نصائح تعليمية وطرق شرح مبتكرة]

⚠️ تعليمات صارمة للتنفيذ:
1. استخدم Google Search للبحث عن المعلومات، مع التركيز على موقع: ${strategy.officialSites[0] || 'المصادر الرسمية'}.
2. **يجب** أن يكون الرد بتنسيق JSON فقط، ولا تشمل أي نص خارجه.
3. املأ الحقول التالية في الـ JSON:
   - objectives: قائمة بأهداف الدرس.
   - coreContent: شرح الدرس المفصل.
   - examples: قائمة بالأمثلة والتمارين.
   - teacherNotes: ملاحظات للمعلم.
   - sources: قائمة بالمصادر التي استخدمتها.

لا تكتب أي مقدمات، فقط كائن JSON النهائي.`;
    }

    /**
     * تنفيذ البحث باستخدام Gemini REST API
     */
    async _executeSearch(searchQuery) {
        try {
            // استخدام نفس النموذج المستخدم في التطبيق
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`;

            const requestBody = {
                contents: [{
                    parts: [{
                        text: searchQuery
                    }]
                }],
                // تفعيل البحث في Google بالصيغة الصحيحة لـ Flash 2.0
                tools: [{
                    google_search: {} 
                }],
                generationConfig: {
                    temperature: 0.5,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192
                    // تم إزالة responseMimeType لأنه يتعارض مع google_search
                }
            };

            console.log('🌐 [CURRICULUM] Sending search request...');

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ [CURRICULUM] API Error Response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // استخراج المحتوى
            let rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            let contentObj;
            
            try {
                // محاولة استخراج JSON من النص (البحث عن أول { وآخر })
                const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    contentObj = JSON.parse(jsonMatch[0]);
                } else {
                    // إذا لم يجد JSON، نعتبر النص كله هو المحتوى
                    throw new Error('No JSON found');
                }
            } catch (e) {
                console.warn('⚠️ Failed to parse structured JSON, using raw text fallback');
                // بناء كائن يدوي من النص الخام
                contentObj = { 
                    coreContent: rawContent,
                    objectives: [],
                    examples: [],
                    teacherNotes: '',
                    sources: []
                };
            }

            // تحويل JSON إلى نص منسق للعرض
            const formattedContent = `
**أهداف الدرس:**
${contentObj.objectives ? contentObj.objectives.map(o => `- ${o}`).join('\n') : ''}

**المحتوى الأساسي:**
${contentObj.coreContent || ''}

**الأمثلة والتمارين:**
${contentObj.examples ? contentObj.examples.map(e => `- ${e}`).join('\n') : ''}

**ملاحظات للمعلم:**
${contentObj.teacherNotes || ''}

**المصادر:**
${contentObj.sources ? contentObj.sources.map(s => `- ${s}`).join('\n') : ''}
            `.trim();

            // استخراج المصادر من Grounding Metadata أيضاً
            const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
            const webSources = groundingMetadata?.webSearchQueries || [];
            const chunks = groundingMetadata?.groundingChunks || [];

            console.log('📦 [CURRICULUM] Response received, formatted length:', formattedContent.length);

            // طباعة تفاصيل البحث والمصادر
            if (webSources.length > 0) {
                console.log('🔍 [CURRICULUM] Google Search Queries Used:', JSON.stringify(webSources));
            }

            if (chunks.length > 0) {
                // استخراج العناوين والروابط الفريدة
                const uniqueSources = chunks
                    .filter(c => c.web?.uri && c.web?.title)
                    .map(c => ({
                        title: c.web.title,
                        url: c.web.uri
                    }))
                    .filter((v, i, a) => a.findIndex(t => t.url === v.url) === i); // إزالة التكرار
                
                console.log('🔗 [CURRICULUM] Found Web Sources:', JSON.stringify(uniqueSources, null, 2));
            } else {
                console.log('⚠️ [CURRICULUM] No direct web citations found in metadata.');
            }
            
            // دمج المصادر في المحتوى النهائي إذا لم تكن موجودة
            if (contentObj.sources && contentObj.sources.length === 0 && chunks.length > 0) {
                const webLinks = chunks
                    .filter(c => c.web?.title && c.web?.uri)
                    .map(c => `- [${c.web.title}](${c.web.uri})`);
                
                if (webLinks.length > 0) {
                     contentObj.sources = webLinks;
                     // تحديث النص المنسق
                     // (يمكننا إعادة بناء formattedContent هنا، لكن للتبسيط سنعتمد على ما في contentObj للخطوات القادمة)
                }
            }

            return {
                content: formattedContent,
                sources: webSources,
                groundingMetadata: groundingMetadata, // إضافة البيانات الخام للاستخدام المستقبلي
                rawResponse: data
            };

        } catch (error) {
            console.error('❌ [CURRICULUM] Search execution failed:', error);
            throw error;
        }
    }

    /**
     * التحقق من توفر الخدمة
     */
    async isAvailable() {
        if (!this.apiKey) {
            await this.initialize();
        }
        return !!this.apiKey;
    }
}

// تصدير نسخة واحدة من الخدمة
export const curriculumSearchService = new CurriculumSearchService();
