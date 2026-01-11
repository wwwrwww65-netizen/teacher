/**
 * خدمة التشكيل والنطق العربي
 * Arabic Diacritics and Pronunciation Service
 * 
 * يحتوي على جميع قواعد التشكيل والإعراب والوقف والوصل والتجويد
 */

// ============================
// الحركات الأساسية (Basic Vowel Marks)
// ============================
const DIACRITICS = {
    FATHA: '\u064E',      // الفتحة (َ)
    DAMMA: '\u064F',      // الضمة (ُ)
    KASRA: '\u0650',      // الكسرة (ِ)
    SUKUN: '\u0652',      // السكون (ْ)
    SHADDA: '\u0651',     // الشدة (ّ)
    FATHATAN: '\u064B',   // تنوين الفتح (ً)
    DAMMATAN: '\u064C',   // تنوين الضم (ٌ)
    KASRATAN: '\u064D',   // تنوين الكسر (ٍ)
    ALEF_MADDA: '\u0653', // مد الألف (آ)
    ALEF_WASLA: '\u0671', // ألف الوصل (ٱ)
};

// جميع الحركات للتنظيف
const ALL_DIACRITICS_REGEX = /[\u064B-\u0652\u0670\u0653]/g;

// ============================
// الحروف الشمسية والقمرية
// ============================
const SOLAR_LETTERS = ['ت', 'ث', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ل', 'ن'];
const LUNAR_LETTERS = ['أ', 'إ', 'آ', 'ا', 'ب', 'ج', 'ح', 'خ', 'ع', 'غ', 'ف', 'ق', 'ك', 'م', 'ه', 'و', 'ي'];

// ============================
// حروف القلقلة
// ============================
const QALQALA_LETTERS = ['ق', 'ط', 'ب', 'ج', 'د'];

// ============================
// حروف الإدغام (يرملون)
// ============================
const IDGHAM_LETTERS = ['ي', 'ر', 'م', 'ل', 'و', 'ن'];

// ============================
// حروف الجر
// ============================
const PREPOSITIONS = ['مِنْ', 'إِلَى', 'عَنْ', 'عَلَى', 'فِي', 'بِ', 'كَ', 'لِ'];

// ============================
// أدوات الجزم
// ============================
const JAZM_TOOLS = ['لَمْ', 'لَمَّا', 'لَا', 'لِ', 'لَامُ'];

class ArabicDiacriticsService {
    constructor() {
        // قواعد الإعراب الأساسية
        this.irabRules = {
            // الرفع - الفاعل، المبتدأ، الخبر، اسم كان
            raf3: {
                markers: [DIACRITICS.DAMMA, DIACRITICS.DAMMATAN],
                description: 'الرفع: الفاعل، المبتدأ، الخبر، اسم كان'
            },
            // النصب - المفعول به، اسم إن، الحال، الظرف
            nasb: {
                markers: [DIACRITICS.FATHA, DIACRITICS.FATHATAN],
                description: 'النصب: المفعول به، اسم إن، الحال، الظرف'
            },
            // الجر - بعد حروف الجر، المضاف إليه
            jarr: {
                markers: [DIACRITICS.KASRA, DIACRITICS.KASRATAN],
                description: 'الجر: بعد حروف الجر، المضاف إليه'
            },
            // الجزم - الفعل المضارع المجزوم
            jazm: {
                markers: [DIACRITICS.SUKUN],
                description: 'الجزم: الفعل المضارع المسبوق بأداة جزم'
            }
        };
    }

    /**
     * تنظيف النص من جميع الحركات
     * @param {string} text النص المراد تنظيفه
     * @returns {string} النص بدون حركات
     */
    removeDiacritics(text) {
        if (!text) return '';
        return text.replace(ALL_DIACRITICS_REGEX, '');
    }

    /**
     * التحقق من نوع اللام (شمسية أو قمرية)
     * @param {string} letter الحرف بعد اللام
     * @returns {string} 'solar' أو 'lunar'
     */
    getLamType(letter) {
        const cleanLetter = this.removeDiacritics(letter);
        if (SOLAR_LETTERS.includes(cleanLetter)) {
            return 'solar';
        }
        return 'lunar';
    }

    /**
     * التحقق من أن الحرف من حروف القلقلة
     * @param {string} letter الحرف المراد التحقق منه
     * @returns {boolean}
     */
    isQalqalaLetter(letter) {
        const cleanLetter = this.removeDiacritics(letter);
        return QALQALA_LETTERS.includes(cleanLetter);
    }

    /**
     * التحقق من أن الحرف من حروف الإدغام
     * @param {string} letter الحرف المراد التحقق منه
     * @returns {boolean}
     */
    isIdghamLetter(letter) {
        const cleanLetter = this.removeDiacritics(letter);
        return IDGHAM_LETTERS.includes(cleanLetter);
    }

    /**
     * تطبيق قاعدة الوقف على النص
     * عند الوقف: الحركة الأخيرة تتحول إلى سكون (إلا تنوين الفتح يتحول إلى ألف ممدودة)
     * @param {string} text النص المراد تطبيق الوقف عليه
     * @returns {string} النص بعد تطبيق الوقف
     */
    applyWaqfRule(text) {
        if (!text || text.length === 0) return text;

        const words = text.split(/\s+/);
        if (words.length === 0) return text;

        const lastWord = words[words.length - 1];
        if (lastWord.length === 0) return text;

        let modifiedLastWord = lastWord;

        // التحقق من آخر حرف
        const lastChar = lastWord[lastWord.length - 1];
        const secondLastChar = lastWord.length > 1 ? lastWord[lastWord.length - 2] : '';

        // التعامل مع تنوين الفتح (يتحول إلى ألف ممدودة)
        if (lastChar === DIACRITICS.FATHATAN ||
            (lastWord.length > 1 && lastWord.endsWith('ً'))) {
            // إزالة التنوين وإضافة الألف
            modifiedLastWord = lastWord.slice(0, -1) + 'ا';
        }
        // التعامل مع التاء المربوطة (تتحول إلى هاء ساكنة)
        else if (lastChar === 'ة' || lastWord.includes('ة')) {
            // التاء المربوطة عند الوقف تُنطق هاء ساكنة
            modifiedLastWord = lastWord.replace(/ة[ًٌٍَُِّْ]?$/, 'هْ');
        }
        // الحركات الأخرى تتحول إلى سكون
        else if ([DIACRITICS.FATHA, DIACRITICS.DAMMA, DIACRITICS.KASRA,
        DIACRITICS.DAMMATAN, DIACRITICS.KASRATAN].includes(lastChar)) {
            modifiedLastWord = lastWord.slice(0, -1) + DIACRITICS.SUKUN;
        }

        words[words.length - 1] = modifiedLastWord;
        return words.join(' ');
    }

    /**
     * تطبيق قاعدة همزة الوصل
     * همزة الوصل تسقط في الدرج (عند الاتصال)
     * @param {string} text النص المراد معالجته
     * @returns {string} النص بعد المعالجة
     */
    applyHamzaWaslRule(text) {
        if (!text) return text;

        // أنماط همزة الوصل الشائعة
        const patterns = [
            // "وال" تصبح وصلة
            { regex: /(\S)[\s]+ال(\S)/g, replacement: '$1ل$2' },
            // "فال" تصبح وصلة
            { regex: /(\S)[\s]+فال(\S)/g, replacement: '$1فل$2' },
            // "بال" تصبح وصلة  
            { regex: /(\S)[\s]+بال(\S)/g, replacement: '$1بل$2' },
        ];

        let result = text;
        for (const pattern of patterns) {
            result = result.replace(pattern.regex, pattern.replacement);
        }

        return result;
    }

    /**
     * التحقق من التقاء الساكنين ومعالجته
     * في العربية لا يلتقي ساكنان
     * @param {string} text النص المراد معالجته
     * @returns {string} النص بعد المعالجة
     */
    handleTwoSukuns(text) {
        if (!text) return text;

        // البحث عن حرفين ساكنين متتاليين
        // الساكن الأول يُحرَّك غالباً بالكسرة
        const result = text.replace(
            /([^\s])ْ([^\s])ْ/g,
            (match, char1, char2) => `${char1}ِ${char2}ْ`
        );

        return result;
    }

    /**
     * الحصول على معلومات النطق للحرف
     * @param {string} char الحرف مع حركته
     * @returns {object} معلومات النطق
     */
    getPronunciationInfo(char) {
        if (!char || char.length === 0) return null;

        const baseChar = this.removeDiacritics(char);
        const diacritic = char.replace(baseChar, '');

        return {
            letter: baseChar,
            diacritic: diacritic,
            hasFatha: diacritic.includes(DIACRITICS.FATHA),
            hasDamma: diacritic.includes(DIACRITICS.DAMMA),
            hasKasra: diacritic.includes(DIACRITICS.KASRA),
            hasSukun: diacritic.includes(DIACRITICS.SUKUN),
            hasShadda: diacritic.includes(DIACRITICS.SHADDA),
            hasTanween: [DIACRITICS.FATHATAN, DIACRITICS.DAMMATAN, DIACRITICS.KASRATAN].some(t => diacritic.includes(t)),
            isQalqala: this.isQalqalaLetter(baseChar),
            isIdgham: this.isIdghamLetter(baseChar),
        };
    }

    /**
     * تحليل الجملة وتحديد نوع الإعراب للكلمات
     * @param {string} sentence الجملة المراد تحليلها
     * @returns {Array} مصفوفة تحتوي على تحليل كل كلمة
     */
    analyzeIrab(sentence) {
        if (!sentence) return [];

        const words = sentence.split(/\s+/);
        const analysis = [];

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const prevWord = i > 0 ? words[i - 1] : null;
            const cleanPrevWord = prevWord ? this.removeDiacritics(prevWord) : '';

            let irabType = 'unknown';
            let reason = '';

            // التحقق من حروف الجر
            if (['من', 'إلى', 'عن', 'على', 'في', 'ب', 'ك', 'ل'].includes(cleanPrevWord)) {
                irabType = 'jarr';
                reason = 'مجرور بحرف الجر';
            }
            // التحقق من أدوات الجزم
            else if (['لم', 'لما', 'لا'].includes(cleanPrevWord)) {
                irabType = 'jazm';
                reason = 'فعل مضارع مجزوم';
            }
            // التحقق من إن وأخواتها
            else if (['إن', 'أن', 'كأن', 'لكن', 'ليت', 'لعل'].includes(cleanPrevWord)) {
                irabType = 'nasb';
                reason = 'اسم إن وأخواتها';
            }
            // التحقق من كان وأخواتها
            else if (['كان', 'أصبح', 'أضحى', 'ظل', 'بات', 'صار', 'ليس', 'زال', 'برح', 'فتئ', 'انفك'].includes(cleanPrevWord)) {
                // اسم كان مرفوع، خبرها منصوب
                if (i === 1) {
                    irabType = 'raf3';
                    reason = 'اسم كان وأخواتها';
                } else {
                    irabType = 'nasb';
                    reason = 'خبر كان وأخواتها';
                }
            }

            analysis.push({
                word: word,
                cleanWord: this.removeDiacritics(word),
                position: i,
                irabType: irabType,
                reason: reason
            });
        }

        return analysis;
    }

    /**
     * تطبيق قواعد النطق للنص الكامل
     * @param {string} text النص المراد معالجته
     * @param {object} options خيارات المعالجة
     * @returns {string} النص بعد المعالجة
     */
    processForPronunciation(text, options = {}) {
        if (!text) return text;

        let result = text;

        // تطبيق قاعدة همزة الوصل (إذا كانت مفعّلة)
        if (options.applyHamzaWasl !== false) {
            result = this.applyHamzaWaslRule(result);
        }

        // معالجة التقاء الساكنين
        if (options.handleTwoSukuns !== false) {
            result = this.handleTwoSukuns(result);
        }

        // تطبيق قاعدة الوقف (إذا كانت مفعّلة)
        if (options.applyWaqf === true) {
            result = this.applyWaqfRule(result);
        }

        return result;
    }

    /**
     * الحصول على تعليمات نطق النص
     * @param {string} text النص
     * @returns {object} تعليمات النطق
     */
    getPronunciationGuide(text) {
        if (!text) return null;

        const guide = {
            originalText: text,
            processedText: this.processForPronunciation(text, { applyWaqf: true }),
            words: [],
            punctuationNotes: []
        };

        // تحليل كل كلمة
        const words = text.split(/\s+/);
        for (const word of words) {
            const chars = [];
            let i = 0;
            while (i < word.length) {
                let charWithDiacritics = word[i];
                // جمع الحركات المتتالية
                while (i + 1 < word.length && ALL_DIACRITICS_REGEX.test(word[i + 1])) {
                    i++;
                    charWithDiacritics += word[i];
                }
                chars.push(this.getPronunciationInfo(charWithDiacritics));
                i++;
            }
            guide.words.push({
                word: word,
                characters: chars.filter(c => c !== null)
            });
        }

        // ملاحظات علامات الترقيم
        if (text.includes('.') || text.includes('،')) {
            guide.punctuationNotes.push('الوقف: الحرف الأخير يصبح ساكناً');
        }
        if (text.includes('؟')) {
            guide.punctuationNotes.push('الاستفهام: نغمة صاعدة في نهاية الجملة');
        }
        if (text.includes('!')) {
            guide.punctuationNotes.push('التعجب: نغمة قوية محملة بشعور');
        }

        return guide;
    }

    /**
     * إضافة التشكيل التلقائي لنص بسيط
     * ملاحظة: هذه وظيفة مبسطة للكلمات الشائعة
     * @param {string} text النص بدون تشكيل
     * @returns {string} النص مع تشكيل أساسي
     */
    addBasicDiacritics(text) {
        if (!text) return text;

        // قاموس الكلمات الشائعة مع تشكيلها
        const commonWords = {
            // الضمائر
            'أنا': 'أَنَا',
            'أنت': 'أَنْتَ',
            'أنتِ': 'أَنْتِ',
            'هو': 'هُوَ',
            'هي': 'هِيَ',
            'نحن': 'نَحْنُ',
            'هم': 'هُمْ',
            'هن': 'هُنَّ',

            // أدوات الاستفهام
            'ما': 'مَا',
            'من': 'مَنْ',
            'أين': 'أَيْنَ',
            'متى': 'مَتَى',
            'كيف': 'كَيْفَ',
            'لماذا': 'لِمَاذَا',
            'هل': 'هَلْ',

            // حروف الجر
            'في': 'فِي',
            'على': 'عَلَى',
            'إلى': 'إِلَى',
            'عن': 'عَنْ',

            // كلمات شائعة في التعليم
            'الحرف': 'الْحَرْفُ',
            'حرف': 'حَرْفٌ',
            'كلمة': 'كَلِمَةٌ',
            'الكلمة': 'الكَلِمَةُ',
            'جملة': 'جُمْلَةٌ',
            'الجملة': 'الجُمْلَةُ',
            'درس': 'دَرْسٌ',
            'الدرس': 'الدَّرْسُ',

            // تحيات
            'مرحبا': 'مَرْحَبًا',
            'أهلا': 'أَهْلًا',
            'شكرا': 'شُكْرًا',

            // أفعال شائعة
            'قال': 'قَالَ',
            'ذهب': 'ذَهَبَ',
            'جاء': 'جَاءَ',
            'كتب': 'كَتَبَ',
            'قرأ': 'قَرَأَ',
            'نطق': 'نَطَقَ',
            'سمع': 'سَمِعَ',
            'فهم': 'فَهِمَ',
        };

        let result = text;
        for (const [plain, diacritized] of Object.entries(commonWords)) {
            // استبدال الكلمات مع الحفاظ على حدود الكلمة
            const regex = new RegExp(`\\b${plain}\\b`, 'g');
            result = result.replace(regex, diacritized);
        }

        return result;
    }

    /**
     * الحصول على وصف القاعدة للحركة
     * @param {string} diacritic الحركة
     * @returns {string} وصف القاعدة
     */
    getDiacriticDescription(diacritic) {
        const descriptions = {
            [DIACRITICS.FATHA]: 'الفتحة (َ): تفتح الفم قليلاً، صوت مشابه للـ a القصيرة',
            [DIACRITICS.DAMMA]: 'الضمة (ُ): تضم الشفتين، صوت مشابه للـ u القصيرة',
            [DIACRITICS.KASRA]: 'الكسرة (ِ): تخفض الفك السفلي، صوت مشابه للـ i القصيرة',
            [DIACRITICS.SUKUN]: 'السكون (ْ): انعدام الحركة، الحرف يُنطق بقرع مخرجه فقط',
            [DIACRITICS.SHADDA]: 'الشدة (ّ): حرفان مدمجان، الأول ساكن والثاني متحرك، يُضغط على الحرف قليلاً',
            [DIACRITICS.FATHATAN]: 'تنوين الفتح (ً): فتحة مع نون ساكنة في النهاية',
            [DIACRITICS.DAMMATAN]: 'تنوين الضم (ٌ): ضمة مع نون ساكنة في النهاية',
            [DIACRITICS.KASRATAN]: 'تنوين الكسر (ٍ): كسرة مع نون ساكنة في النهاية',
        };

        return descriptions[diacritic] || 'حركة غير معروفة';
    }

    /**
     * الحصول على جميع القواعد كمرجع
     * @returns {object} جميع القواعد
     */
    getAllRules() {
        return {
            basicDiacritics: {
                title: 'القواعد الأساسية للحركات',
                rules: [
                    { name: 'الفتحة', symbol: 'َ', description: 'تفتح الفم قليلاً (مثل a قصيرة)' },
                    { name: 'الضمة', symbol: 'ُ', description: 'تضم الشفتين (مثل u قصيرة)' },
                    { name: 'الكسرة', symbol: 'ِ', description: 'تخفض الفك السفلي (مثل i قصيرة)' },
                    { name: 'السكون', symbol: 'ْ', description: 'انعدام الحركة، الحرف يُنطق بقرع مخرجه' },
                    { name: 'الشدة', symbol: 'ّ', description: 'حرفان مدمجان، يُضغط على الحرف لزمن حركتين' },
                ]
            },
            irabRules: {
                title: 'قواعد الإعراب',
                rules: [
                    {
                        name: 'الرفع (الضمة)',
                        cases: ['الفاعل', 'المبتدأ', 'الخبر', 'اسم كان'],
                        example: 'ذهبَ خالدٌ، السماءُ صافيةٌ'
                    },
                    {
                        name: 'النصب (الفتحة)',
                        cases: ['المفعول به', 'اسم إن', 'الحال', 'الظرف'],
                        example: 'شربتُ الماءَ، جاء الرجلُ مسرعاً'
                    },
                    {
                        name: 'الجر (الكسرة)',
                        cases: ['بعد حروف الجر', 'المضاف إليه'],
                        example: 'ذهبتُ إلى المدرسةِ، بابُ البيتِ'
                    },
                    {
                        name: 'الجزم (السكون)',
                        cases: ['الفعل المضارع المجزوم'],
                        example: 'لم يكتبْ'
                    },
                ]
            },
            waqfRules: {
                title: 'قواعد الوقف',
                rules: [
                    {
                        name: 'الوقف بالسكون',
                        description: 'الحركة الأخيرة تتحول إلى سكون عند التوقف',
                        example: 'جاءَ محمدٌ → جاءَ محمدْ'
                    },
                    {
                        name: 'الوقف على تنوين الفتح',
                        description: 'تنوين الفتح يتحول إلى ألف ممدودة',
                        example: 'رأيتُ رجلاً → رأيتُ رجلا'
                    },
                    {
                        name: 'الوقف على التاء المربوطة',
                        description: 'التاء المربوطة تتحول إلى هاء ساكنة',
                        example: 'شجرةٌ كبيرةٌ → شجرة كبيرهْ'
                    },
                ]
            },
            waslRules: {
                title: 'قواعد الوصل',
                rules: [
                    {
                        name: 'همزة الوصل',
                        description: 'تسقط همزة الوصل عند الاتصال',
                        example: 'في البيت → فِلْبَيت'
                    },
                    {
                        name: 'اللام الشمسية',
                        letters: SOLAR_LETTERS.join('، '),
                        description: 'لا تُنطق اللام، بل ندخل في الحرف بشدة',
                        example: 'الشَّمس → أَشَّمس'
                    },
                    {
                        name: 'اللام القمرية',
                        letters: LUNAR_LETTERS.join('، '),
                        description: 'تُنطق اللام واضحة',
                        example: 'الْقمر'
                    },
                    {
                        name: 'التقاء الساكنين',
                        description: 'الساكن الأول يُحرَّك (غالباً بالكسرة)',
                        example: 'قُمِ الليل (أصلها قُمْ الليل)'
                    },
                ]
            },
            tajweedRules: {
                title: 'قواعد التجويد',
                rules: [
                    {
                        name: 'الإدغام',
                        letters: IDGHAM_LETTERS.join('، '),
                        description: 'النون الساكنة أو التنوين تُدغم في حروف (يرملون)',
                        example: 'مَن يَقُول → مَيَّقول'
                    },
                    {
                        name: 'القلقلة',
                        letters: QALQALA_LETTERS.join('، '),
                        description: 'حروف (قطب جد) إذا جاءت ساكنة تهتز قليلاً',
                        example: 'يَقْتُل (القاف تخرج قوية)'
                    },
                ]
            },
            punctuationRules: {
                title: 'تأثير علامات الترقيم',
                rules: [
                    {
                        name: 'النقطة والفاصلة',
                        description: 'وجوب الوقف، الحرف الأخير يصبح ساكناً',
                        intonation: 'النقطة: نبرة منخفضة. الفاصلة: نبرة معلقة'
                    },
                    {
                        name: 'علامة الاستفهام',
                        description: 'الحرف الأخير ساكن مع نغمة صاعدة',
                        example: 'هل فهمتَ الدرسَ؟ → هل فهمتَ الدرسْ؟'
                    },
                    {
                        name: 'علامة التعجب',
                        description: 'نغمة قوية محملة بشعور (دهشة، غضب، فرح)'
                    },
                ]
            }
        };
    }
}

// تصدير الخدمة
export const arabicDiacriticsService = new ArabicDiacriticsService();
export { DIACRITICS, SOLAR_LETTERS, LUNAR_LETTERS, QALQALA_LETTERS, IDGHAM_LETTERS };
