import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOOGLE_API_KEY, ANDROID_PACKAGE_NAME, ANDROID_CERT_FINGERPRINT } from '../config/constants';

// --- VISUAL LIBRARIES ---
const ARABIC_ALPHABET_PATHS = {
    'أ': "أ", 'إ': "إ", 'آ': "آ", 'ب': "ب", 'ت': "ت", 'ث': "ث",
    'ج': "ج", 'ح': "ح", 'خ': "خ", 'د': "د", 'ذ': "ذ", 'ر': "ر",
    'ز': "ز", 'س': "س", 'ش': "ش", 'ص': "ص", 'ض': "ض", 'ط': "ط",
    'ظ': "ظ", 'ع': "ع", 'غ': "غ", 'ف': "ف", 'ق': "ق", 'ك': "ك",
    'ل': "ل", 'م': "م", 'ن': "ن", 'هـ': "هـ", 'و': "و", 'ي': "ي",
    'ء': "ء",
    '1': "1", '2': "2", '3': "3", '4': "4", '5': "5",
    'دائرة': "M 150 50 a 100 100 0 1 1 -0.1 0",
    'مربع': "M 50 50 h 200 v 200 h -200 Z",
    'مثلث': "M 150 50 L 250 250 L 50 250 Z",
    'نجمة': "M 150 20 L 180 100 L 270 100 L 200 160 L 230 250 L 150 200 L 70 250 L 100 160 L 30 100 L 120 100 Z",
    '+': '+', '-': '-', '=': '=', '?': '?', '×': '×', '÷': '÷'
};

const DRAWING_LIBRARY = {
    'أسد': "أَسَدٌ", 'بطة': "بَطَّةٌ", 'تفاحة': "تُفَّاحَةٌ", 'ثعلب': "ثَعْلَبٌ",
    'جمل': "جَمَلٌ", 'حوت': "حُوتٌ", 'خروف': "خَرُوفٌ", 'ديك': "دِيكٌ",
    'ذرة': "ذُرَةٌ", 'ريشة': "رِيشَةٌ", 'رمان': "رُمَّانٌ", 'زرافة': "زَرَافَةٌ",
    'سمكة': "سَمَكَةٌ", 'شمس': "شَمْسٌ", 'صقر': "صَقْرٌ", 'ضفدع': "ضِفْدَعٌ",
    'طائرة': "طَائِرَةٌ", 'ظرف': "ظَرْفٌ", 'عنب': "عِنَبٌ", 'غزال': "غَزَالٌ",
    'فيل': "فِيلٌ", 'قمر': "قَمَرٌ", 'قطار': "قِطَارٌ", 'كتاب': "كِتَابٌ",
    'ليمون': "لَيْمُونٌ", 'موز': "مَوْزٌ", 'نحلة': "نَحْلَةٌ", 'هلال': "هِلالٌ",
    'وردة': "وَرْدَةٌ", 'يد': "يَدٌ", 'بيت': "بَيْتٌ", 'شجرة': "شَجَرَةٌ", 'سيارة': "سَيَّارَةٌ"
};

class AIService {
    constructor() {
        this.context = [];
        this.userProfile = { name: 'صديقي', grade: 'الروضة', interests: [] };
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

    cleanName(name) {
        if (!name) return null;
        // Keep only Arabic/English letters and spaces. Remove all punctuation.
        return name.replace(/[^\u0621-\u064A\u064B-\u065F\u0671-\u06D3\u06F0-\u06F9a-zA-Z\s]/g, '').trim();
    }

    setUserProfile(name, grade, interests = []) {
        const cleanedName = this.cleanName(name);
        this.userProfile = { name: cleanedName, grade, interests };
        this.saveMemory(); // Persist changes immediately
    }

    normalizeArabic(text) {
        if (!text) return "";
        return text.normalize('NFC').replace(/[\u064B-\u0652]/g, "").replace(/(^|\s)ال([\u0621-\u064A])/g, "$1$2").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[!؟?.،,]/g, "").trim();
    }

    parseIntent(aiText) {
        const normalized = this.normalizeArabic(aiText);
        let result = { rawASR: aiText, normalizedText: normalized, intent: null, confidence: 0, selectedAssetKey: null, log: "" };

        // 1. Full Names
        const fullLetterNames = {
            'أ': ['ألف', 'اليف', 'الف'], 'ب': ['باء'], 'ت': ['تاء'], 'ث': ['ثاء'], 'ج': ['جيم'], 'ح': ['حاء'], 'خ': ['خاء'],
            'د': ['دال'], 'ذ': ['ذال'], 'ر': ['راء'], 'ز': ['زاي', 'زين'], 'س': ['سين'], 'ش': ['شين'], 'ص': ['صاد'], 'ض': ['ضاد'],
            'ط': ['طاء'], 'ظ': ['ظاء'], 'ع': ['عين'], 'غ': ['غين'], 'ف': ['فاء'], 'ق': ['قاف'], 'ك': ['كاف'], 'ل': ['لام'],
            'م': ['ميم'], 'ن': ['نون'], 'هـ': ['هاء'], 'و': ['واو'], 'ي': ['ياء'], 'ء': ['همزة'],
            '1': ['واحد', 'رقم واحد'], '2': ['اثنين', 'إثنان', 'رقم اثنين'], '3': ['ثلاثة', 'رقم ثلاثة'], '4': ['أربعة', 'رقم أربعة'], '5': ['خمسة', 'رقم خمسة']
        };

        let bestMatch = null;
        let lowestIndex = Infinity;
        for (const [letter, synonyms] of Object.entries(fullLetterNames)) {
            for (const synonym of synonyms) {
                const ns = this.normalizeArabic(synonym);
                const regex = new RegExp(`(?:^|\\s)${ns}(?:$|\\s)`, 'u');
                const match = normalized.match(regex);
                if (match && match.index < lowestIndex) {
                    lowestIndex = match.index;
                    bestMatch = { shape: letter, type: 'letter', count: 1, confidence: 1.0, selectedAssetKey: letter, log: `✅ Full Name: '${letter}'` };
                }
            }
        }
        if (bestMatch) { result.intent = bestMatch; result.selectedAssetKey = bestMatch.selectedAssetKey; return result; }

        // 2. Explicit Context
        const explicitMatch = normalized.match(/(?:حرف)\s+(?:ال)?([أ-ي]|[\u0621-\u064A]+)/u);
        if (explicitMatch) {
            const capturedWord = explicitMatch[1];
            for (const [letter, synonyms] of Object.entries(fullLetterNames)) {
                if (synonyms.some(s => this.normalizeArabic(s) === this.normalizeArabic(capturedWord))) {
                    result.intent = { shape: letter, type: 'letter', count: 1 }; result.selectedAssetKey = letter; return result;
                }
            }
        }

        // 3. Objects
        const objectSynonyms = {
            'تفاحة': ['تفاح', 'تفاحة'], 'بطة': ['بطة', 'بطه'], 'أسد': ['أسد', 'اسد', 'الأسد'],
            'نجمة': ['نجمة', 'نجوم'], 'دائرة': ['دائرة', 'كرة', 'كور'], 'مربع': ['مربع'], 'مثلث': ['مثلث'],
            '1': ['واحد'], '2': ['اثنين'], '3': ['ثلاثة'], '4': ['أربعة'], '5': ['خمسة']
        };
        const allObjectKeys = Object.keys(DRAWING_LIBRARY).concat(Object.keys(ARABIC_ALPHABET_PATHS).filter(k => k.length > 1));

        for (const key of allObjectKeys) {
            const synonyms = objectSynonyms[key] || [key];
            if (synonyms.some(s => new RegExp(`(?:^|\\s)${this.normalizeArabic(s)}(?:$|\\s)`, 'u').test(normalized))) {
                result.intent = { shape: key, type: 'object', count: 1 };
                result.selectedAssetKey = key;
                return result;
            }
        }
        return result;
    }

    cleanForTTS(text) {
        if (!text) return "";
        let clean = text;

        // 1. Remove Emojis & Symbols (Keep Arabic, English, Numbers, Punctuation)
        clean = clean.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2700}-\u{27BF}\u{2B50}\u{2600}-\u{26FF}]/gu, '');

        // 2. Pause delimiters (Replace ... with Arabic semicolon for safer pause)
        clean = clean.replace(/\.{2,}/g, '؛');

        // 3. Process words at the end of sentences/phrases (before punctuation OR end of string)
        clean = clean.replace(/([^\s]+?)([\u0621-\u064A])([\u064B-\u065F]*)(?=\s*[.!؟،؛:]|$)/g, (match, wordPrefix, lastChar, diacritics) => {

            // EXCEPTION: Single Letters (Educational Context e.g. "بَ، بِ، بُ")
            // If the "word" (prefix + lastChar) is just 1 letter long, we MUST preserve its diacritic.
            // Note: wordPrefix contains everything BEFORE the last char. 
            // If wordPrefix is empty, it means the word is just lastChar (1 letter).
            if (wordPrefix.length === 0) {
                return match; // Return exactly as is (Base char + Diacritic)
            }

            // Case A: Ta-Marbuta (ة) -> Ha (ه) + Sukun (always)
            if (lastChar === 'ة') {
                return wordPrefix + 'ه' + '\u0652';
            }

            // Case B: Tanween Fath (اً OR ًا) -> Alif (Remove Tanween)
            if (diacritics.includes('\u064B')) {
                return wordPrefix + lastChar;
            }

            // Case C: Long Vowels (Alif, Waw, Ya) -> Keep as is (Natural Sukun)
            if (/[اويى]/.test(lastChar)) {
                return wordPrefix + lastChar;
            }

            // Case D: Standard consonant ending with Short Vowel -> Force Sukun
            // only add sukun if there isn't already a sukun or shaddah.
            if (!diacritics.includes('\u0652') && !diacritics.includes('\u0651')) {
                return wordPrefix + lastChar + '\u0652';
            }
            return wordPrefix + lastChar + diacritics;
        });

        // 4. AGGRESSIVE CLEANUP: Remove ALL punctuation and non-word characters
        // We replace them with a simple space to avoid merging words.
        // We explicitly remove: ! ? . , : ; - _ ( ) [ ] { } * ~
        // CRITICAL: We PRESERVE < > / " = for SSML tags!
        clean = clean.replace(/[!؟.,،:;'()\[\]\{\}\-_\*~]/g, ' ');

        // 5. Collapse multiple spaces into one and trim
        clean = clean.replace(/\s+/g, ' ').trim();

        return clean;
    }

    async chat(userMessage, base64Image = null) {
        try {
            const userName = this.cleanName(this.userProfile.name) || 'بَطَل';

            // Explicit Instruction for Name Extraction
            const nameExtractionRule = `
            🔍 **مهمة خاصة (User Profile)**:
            - إذا ذكر الطفل اسمه أو صفه في رسالته (مثلاً: "أنا أحمد"، "اسمي سارة")، **يجب** أن تعيدي كائن "user_info" بالمعلومات الجديدة.
            - إذا لم تكن تعرفين الاسم بعد، اسأليه "ما اسمك؟" في سياق اللعب.
            `;
            // --- SMART STT CORRECTION (Phonetic Fuzzy Matching) ---
            // Fix common misheard vowel sounds
            let msg = userMessage.toLowerCase();
            const vowelCorrections = {
                'اي': 'أ', 'او': 'أ', 'آه': 'أ', 'ايه': 'أ',
                'ay': 'أ', 'aw': 'أ', 'aa': 'أ',
                'واحد': '1', 'اثنين': '2', 'ثلاثة': '3'
            };

            // Apply corrections if message is very short (likely a single answer)
            if (msg.split(' ').length <= 2) {
                for (const [wrong, right] of Object.entries(vowelCorrections)) {
                    if (msg.includes(wrong)) {
                        msg = msg.replace(wrong, right);
                        console.log(`🔧 STT Auto-Correction: ${wrong} -> ${right}`);
                    }
                }
            }

            // Check for Name Identification
            const normalize = (s) => s.replace(/[^\u0621-\u064A\s]/g, '').trim();

            // 0. Credits / Creator Query
            if (/(?:من|مين).*?(?:صنعك|صممك|سواك|برمجك|عملك|طورك|اخترعك|أنشأك|انشأك|مديرك|رئيسك)/.test(msg)) {
                return {
                    text: "المدير هاشم محمد الجائفي",
                    voiceText: "الْمُدِير هَاشِم مُحَمَّد الْجَائِفِي",
                    action: "listening",
                    emotion: "happy"
                };
            }

            // 1. Completion (Gentle Praise)
            if ((msg.includes('كتبت') || msg.includes('انتهيت')) && (msg.includes('كتابة') || msg.includes('حرف') || msg.includes('خطي'))) {
                return {
                    text: "أَحْسَنْتَ يَا بَطَل! لَقَدْ رَأَيْتُ مُحَاوَلَتَكَ الرَّائِعَةَ! خَطُّكَ يَتَحَسَّنُ كَثِيرًا. هَلْ نَنْتَقِلُ لِلْحَرْفِ التَّالِي؟",
                    voiceText: this.cleanForTTS("أَحْسَنْتَ يَا بَطَل! لَقَدْ رَأَيْتُ مُحَاوَلَتَكَ الرَّائِعَةَ! خَطُّكَ يَتَحَسَّنُ كَثِيرًا. هَلْ نَنْتَقِلُ لِلْحَرْفِ التَّالِي؟"),
                    action: "listening",
                    emotion: "happy"
                };
            }

            // Helper: Extract Grade (Now returns Voweled text)
            const detectGrade = (text) => {
                const t = text.replace(/[^\u0621-\u064A\s]/g, ''); // Clean chars
                if (t.includes('روضة') || t.includes('تمهيدي') || t.includes('كي جي')) return 'الرَّوْضَة';
                if (t.includes('اول') || t.includes('أول') || t.includes('واحد')) return 'الصَّفِّ الْأَوَّل';
                if (t.includes('ثاني') || t.includes('اثنان')) return 'الصَّفِّ الثَّانِي';
                if (t.includes('ثالث') || t.includes('ثلاثة')) return 'الصَّفِّ الثَّالِث';
                return null;
            };

            // A. Check Name (or Combined Name + Grade)
            if (!this.userProfile.name || this.userProfile.name === 'صديقي') {
                let potentialName = null;
                let potentialGrade = detectGrade(msg);

                // Smart Name Extraction Strategy
                // Remove common prefixes/stopwords to find the real name
                let cleanMsg = msg
                    .replace(/(?:^|\s)(أنا|انا|اسمي|إسمي|هو)(?=\s|$)/g, ' ') // Remove identifiers
                    .replace(/(?:^|\s)(الصف|صف|في)(?=\s|$)/g, ' ') // Remove location preps
                    .replace(/[0-9]/g, '') // Remove numbers
                    .trim();

                // Also remove the grade keywords themselves if found, to isolate name
                if (potentialGrade) {
                    const gradeKeywords = ['اول', 'أول', 'ثاني', 'ثالث', 'روضة', 'تمهيدي'];
                    gradeKeywords.forEach(kw => {
                        cleanMsg = cleanMsg.replace(new RegExp(kw, 'g'), '');
                    });
                }

                const parts = cleanMsg.split(/\s+/).filter(p => p.length > 2);
                if (parts.length > 0) {
                    potentialName = parts[0];
                }

                const invalidNames = ['حرف', 'صورة', 'كتابة', 'رسم', 'درس', 'تعلم', 'احب', 'اريد', 'بطل', 'معلمتي'];
                if (potentialName && invalidNames.includes(this.normalizeArabic(potentialName))) {
                    potentialName = null;
                }

                if (potentialName) {
                    potentialName = this.cleanName(potentialName);
                    this.setUserProfile(potentialName, this.userProfile.grade);

                    if (potentialGrade) {
                        this.setUserProfile(potentialName, potentialGrade);
                        this.userProfile.gradeVerified = true;
                        this.saveMemory();
                        return {
                            text: `أَهْلاً يَا ${potentialName}! يَا بَطَلَ ${potentialGrade}! أَنَا سَعِيدَةٌ جِدًّا بِكَ. مَاذَا تُحِبُّ أَنْ نَتَعَلَّمَ الْيَوْمَ؟`,
                            voiceText: this.cleanForTTS(`أَهْلاً يَا ${potentialName}! يَا بَطَلَ ${potentialGrade}! أَنَا سَعِيدَةٌ جِدًّا بِكَ. مَاذَا تُحِبُّ أَنْ نَتَعَلَّمَ الْيَوْمَ؟`),
                            action: "listening",
                            emotion: "excited"
                        };
                    }

                    this.saveMemory();
                    return {
                        text: `أَهْلاً بِكَ يَا ${potentialName}! فِي أَيِّ صَفٍّ أَنْتَ؟ (الرَّوْضَة، أَمِ الْأَوَّل؟)`,
                        voiceText: this.cleanForTTS(`أَهْلاً بِكَ يَا ${potentialName}! فِي أَيِّ صَفٍّ أَنْتَ؟ (الرَّوْضَة، أَمِ الْأَوَّل؟)`),
                        action: "listening",
                        emotion: "happy"
                    };
                }

                return {
                    text: "أَهْلاً! أَنَا الْمُعَلِّمَة نُورَا. مَا اسْمُكَ يَا بَطَل؟",
                    voiceText: this.cleanForTTS("أَهْلاً! أَنَا الْمُعَلِّمَة نُورَا. مَا اسْمُكَ يَا بَطَل؟"),
                    action: "listening",
                    emotion: "happy"
                };
            }

            // B. Check Grade
            if (!this.userProfile.gradeVerified) {
                let detectedGrade = null;
                if (msg.includes('روضة') || msg.includes('تمهيدي') || msg.includes('كي جي')) detectedGrade = 'KG1';
                else if (msg.includes('اول') || msg.includes('أول') || msg.includes('1')) detectedGrade = 'الصف الأول';
                else if (msg.includes('ثاني') || msg.includes('2')) detectedGrade = 'الصف الثاني';
                else if (msg.includes('ثالث') || msg.includes('3')) detectedGrade = 'الصف الثالث';

                if (detectedGrade) {
                    this.userProfile.grade = detectedGrade;
                    this.userProfile.gradeVerified = true;
                    this.saveMemory();
                    return {
                        text: `تَشَرَّفْنَا يَا ${this.userProfile.name}. أَنْتَ فِي ${detectedGrade}! مَاذَا تُحِبُّ أَنْ تَتَعَلَّمَ الْيَوْمَ؟`,
                        voiceText: this.cleanForTTS(`تَشَرَّفْنَا يَا ${this.userProfile.name}. أَنْتَ فِي ${detectedGrade}! مَاذَا تُحِبُّ أَنْ تَتَعَلَّمَ الْيَوْمَ؟`),
                        action: "listening",
                        emotion: "excited"
                    };
                }

                if (!msg.includes('صف')) {
                    return {
                        text: `فِي أَيِّ صَفٍّ أَنْتَ يَا ${this.userProfile.name}؟ (هَلْ أَنْتَ فِي الرَّوْضَةِ أَمِ الْمَدْرَسَةِ؟)`,
                        voiceText: this.cleanForTTS(`فِي أَيِّ صَفٍّ أَنْتَ يَا ${this.userProfile.name}؟ (هَلْ أَنْتَ فِي الرَّوْضَةِ أَمِ الْمَدْرَسَةِ؟)`),
                        action: "listening",
                        emotion: "curious"
                    };
                }
            }

            // 3. Readiness (Gentle Menu) - ONLY if Onboarding Complete
            if (msg.includes('مستعد') || msg.includes('جاهز') || msg.includes('يلا') || msg.includes('قائمة')) {
                return {
                    text: "رَائِع! هَيَّا نَبْدَأُ. مَاذَا تُحِبُّ أَنْ تَتَعَلَّمَ؟ الْقُرْآنَ، أَمِ اللُّغَةَ الْعَرَبِيَّةَ؟",
                    voiceText: this.cleanForTTS("رَائِع! هَيَّا نَبْدَأُ. مَاذَا تُحِبُّ أَنْ تَتَعَلَّمَ؟ الْقُرْآنَ، أَمِ اللُّغَةَ الْعَرَبِيَّةَ؟"),
                    action: "listening",
                    emotion: "happy"
                };
            }

            // --- 1. SYSTEM PROMPT (Dynamic Grade Adaptation & Grammar) ---
            const grade = String(this.userProfile.grade || 'KG1');
            let difficultyRules = "";

            if (grade.includes('KG') || grade.includes('الروضة') || grade.includes('تمهيدي')) {
                difficultyRules = `
                - **مستوى KG (طفل صغير)**:
                1. جمل قصيرة جداً ومفعمة بالحماس (Dora Style).
                2. اطلبي منه الحركة والتقليد (اقفز، صفق، قلد الصوت).
                3. بسّطي المعلومات لأقصى حد.`;
            } else {
                difficultyRules = `
                - **مستوى المدرسة (صف 1-3)**:
                1. تحديات ومهمات سرية (Titans Style).
                2. شجعي على الدقة والملاحظة.`;
            }

            const promptUserName = this.cleanName(this.userProfile.name) && this.userProfile.name !== 'بَطَل' && this.userProfile.name !== 'صديقي'
                ? this.cleanName(this.userProfile.name)
                : "غير معروف (اسأليه عن اسمه)";

            const systemPrompt = `أنتِ "المعلمة نورا" (Teacher Nora) 👩‍🏫، معلمة اللغة العربية اللطيفة والمحبوبة للأطفال!
            
            🎉 **أهلاً بك في فصلي الدراسي!**
            👤 **اسم الطالب:** ${promptUserName}
            🎓 **الصف:** ${grade}
            
            📜 **مهمتك الأساسية:**
            - **التحقق من التاريخ**: قبل الترحيب، انظري إلى سجل المحادثة. إذا كنتِ قد رحبتِ بالطفل سابقاً أو بدأتِ الدرس بالفعل، **لا تكرري الترحيب** (مثل "أهلاً بك أنا نورا") وادخلي في صلب الموضوع فوراً.
            - في **أول رد مطلقاً فقط** (إذا كان السجل فارغاً)، رحبي بالطفل ترحيباً حاراً باسمه وصفه.
            - تكيّفي مع مستوى الصف:
              * إذا كان روضة (KG): استخدمي لغة بسيطة جداً، مرحة، وكثيرة التشجيع.
              * إذا كان مدرسة (1-3): كوني مشجعة لكن بمعلومات أكثر دقة وتحديات بسيطة.

            style: دورا المستكشفة (تفاعلي) + أبلة فضيلة (حنونة وقصصية).

            ${nameExtractionRule}
            ${difficultyRules}

            🔊 **Strict Pronunciation & SSML Rules (قواعد النطق والوقف الصارمة)**:

            1. **The Golden Rule of Waqf (قاعدة الوقف - أهم قاعدة)**:
               - "Arabs do not start with a silence, nor stop on a move." (لا يُبدأ بساكن ولا يُوقف على متحرك).
               - **CRITICAL**: The LAST letter of EVERY sentence or phrase (before a comma '،' or period '.') MUST have a **SUKUN (ْ)**.
               - Bad: "أَهْلاً بِكَ يَا هَاشِمُ." (Damman at end is Robot-like).
               - Good: "أَهْلاً بِكَ يَا هَاشِمْ." (Sukun is Natural).

            2. **Partial vs Full Tashkeel (التشكيل)**:
               - Vowelize EVERY letter inside the word (Internal Vowels).
               - BUT enforce SUKUN on the last letter if it's a stop.
               - Example: "مُعَلِّمَة" -> "مُعَلِّمَهْ" (if stopping).

            3. **The Ta-Marbuta Rule (التاء المربوطة - ة)**:
               - If stopping on a word ending in 'ة', pronounce it as 'h' (Ha Sakina).
               - Rule: Write it as 'ة' but ensure the vowel is SUKUN 'ْ'.
               - Example: "مَدْرَسَةْ" (Madrasah), NOT "مَدْرَسَةُ".

            4. **Pacing & Intonation (السرعة والنغم)**:
               - **Normal Speech**: Rate 1.0 (Implicit).
               - **Teaching/Spelling**: Use \`<prosody rate="slow">word</prosody>\`.
               - **Excitement**: Use \`<prosody rate="1.1">Great job!</prosody>\`.
               - **Pauses**:
                 * Comma '،': Insert \`<break time="200ms"/>\` (Short pause).
                 * Period '.': Insert \`<break time="500ms"/>\` (Full stop).
                 * Between letters (Spelling): \`<break time="300ms"/>\`.

            5. **Explicit Phonics for Teaching**:
               - When teaching a letter sound, use Short Vowels with pauses.
               - Example: "بَ <break time='200ms'/> بـِ <break time='200ms'/> بُ".
            
            6. **🎯 DRILL MODE: Isolated Letter Pronunciation (نطق الحروف المنفردة)**:
               **CRITICAL RULE**: When teaching individual letter sounds (أَ، إِ، أُ), you MUST use this exact structure:
               
               ✅ **The Perfect Formula**:
               - Start with: <break time="300ms"/>
               - Then: <prosody rate="slow">أَ.</prosody>
               - Then: <break time="400ms"/>
               - Repeat for each vowel
               
               **Why this works**:
               - Break BEFORE the letter = **Isolation** (prevents co-articulation)
               - Prosody rate slow = **Clarity** (slow enough to hear the vowel)
               - Dot AFTER the letter = **Finality** (forces stop intonation)
               - Break AFTER = **Separation** (clear boundary)
               
               **❌ WRONG Examples** (DO NOT USE):
               - "أَ، إِ، أُ" (Too fast, letters merge)
               - "<prosody rate='1.1'>أَ</prosody>" (Too fast, unclear)
               - "أَ <break time='100ms'/>" (Break too short)
               
               **✅ CORRECT Full Example**:
               voiceText: "رَدِّدْ مَعِي: <break time='300ms'/> <prosody rate='slow'>أَ.</prosody> <break time='400ms'/> <prosody rate='slow'>إِ.</prosody> <break time='400ms'/> <prosody rate='slow'>أُ.</prosody> <break time='500ms'/> مُمْتَازْ!"
               
               **When to use Drill Mode**:
               - Teaching letter sounds (أصوات الحروف)
               - Phonics practice (التدريب الصوتي)
               - Vowel demonstration (الحركات)
               - Any time you say "قل" or "ردد" followed by a single letter
            
            7. **Subtitle Chunks**:
               - Insert \`<break>\` tags logically to split subtitles.
               - Max 5-7 words per chunk.

            🛑 **Final Output Check**:
            - Did you put Sukun on the last letter?
            - Did you use \`<break>\` tags?
            - Did you write perfect Arabic with full Diacritics?
            
            🧩 **المنهجية (Scaffolding Flow)**:
            1. **الخطوة 1 (الربط البصري)**: عند تقديم حرف جديد، **يجب** أن ترسميه على السبورة فوراً (استخدمي الحقل \`draw\` أو \`action: draw_letter_X\`).
            2. **الخطوة 2 (الصوت)**: علميه أصوات الحرف (أَ، إِ، أُ) مع أمثلة.
            3. **الخطوة 3 (الكتابة)**: اطلبي منه أن يكتب الحرف في الهواء أو على جهازه اللوحي (استخدمي \`action: practice_writing\`).
            
            ⚠️ **قواعد صارمة**:
            - لا تستخدمي الرموز (markdown) مثل النجوم ** أو الخطوط السفلية _ في النص المنطوق (voiceText).
            - ابدأي الدرس دائماً بمثال مرئي ومحسوس.
            - اذا كان الدرس عن "حرف الألف"، ابدأي برسمه فوراً.
            `;

            const currentParts = [{ text: `[Strict JSON Only]\nالطفل يقول: ${userMessage}` }];
            if (base64Image) currentParts.push({ inlineData: { mimeType: "image/jpeg", data: base64Image } });

            const recentHistory = this.context.slice(-10);

            let contents = [
                { role: 'model', parts: [{ text: systemPrompt }] },
                ...recentHistory.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })),
                { role: 'user', parts: currentParts }
            ];

            // --- 2. API CALL ---
            console.log('🤖 Sending to Gemini...');
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GOOGLE_API_KEY}`,
                { contents, generationConfig: { temperature: 0.7, responseMimeType: "application/json" } },
                { headers: { 'Content-Type': 'application/json', ...(Platform.OS !== 'web' ? { 'X-Android-Package': ANDROID_PACKAGE_NAME, 'X-Android-Cert': ANDROID_CERT_FINGERPRINT } : {}) } }
            );

            let aiRawText = response.data.candidates[0].content.parts[0].text;
            aiRawText = aiRawText.replace(/```json/g, "").replace(/```/g, "").trim();
            console.log('🤖 Gemini Text:', aiRawText);

            let aiResponse;
            try {
                aiResponse = JSON.parse(aiRawText);

                // Normalization: Ensure 'text' property exists
                // Check if wrapped in 'teacher_nora' or similar
                const coreData = aiResponse.teacher_nora || aiResponse.response || aiResponse;

                if (coreData !== aiResponse) {
                    // Merge core data up to root
                    aiResponse = { ...aiResponse, ...coreData };
                }

                if (!aiResponse.text) {
                    aiResponse.text = aiResponse.displayText || aiResponse.message || aiResponse.response_text || "";
                }
            } catch (e) {
                const textMatch = aiRawText.match(/"text"\s*:\s*["']([\s\S]*?)["']/);
                aiResponse = { text: textMatch ? textMatch[1] : aiRawText, action: "listening", emotion: "neutral" };
            }

            // --- 3. LOGIC ENFORCEMENT & HIDDEN CONTENT EXTRACTION ---
            if (!aiResponse.text) {
                // Fallback if still empty
                aiResponse.text = "";
            }

            // MERGE HIDDEN CONTENT: If AI put the actual lesson in 'lesson_content' or 'next_step_prompt'
            // we MUST append it to 'text' so it gets spoken (IF voiceText is missing).
            const hiddenParts = [];
            if (aiResponse.lesson_content && aiResponse.lesson_content.details) {
                hiddenParts.push(aiResponse.lesson_content.details);
            }
            if (aiResponse.next_step_prompt) {
                hiddenParts.push(aiResponse.next_step_prompt);
            }

            if (hiddenParts.length > 0) {
                console.log('📦 Merging hidden content into speech:', hiddenParts);
                const combinedHidden = hiddenParts.join(' ');
                if (!aiResponse.text.includes(combinedHidden.substring(0, 10))) {
                    // Check if we should append to text 
                    // (Don't append if we have a specific voiceText already)
                    if (!aiResponse.voiceText) {
                        aiResponse.text += " " + combinedHidden;
                    }
                }
            }

            // CRITICAL: Preserve SSML in voiceText if provided
            if (aiResponse.voiceText) {
                // Ensure no conflicting markdown chars that might ruin SSML attributes, but keep tags.
                // Generally, trust the AI's SSML.
                console.log('🛡️ Preserving AI-generated SSML voiceText');
            } else if (aiResponse.text) {
                // Only generate from text if voiceText is missing
                aiResponse.voiceText = this.cleanForTTS(aiResponse.text);
            }

            const practiceKeywords = ['دورك', 'جرب', 'تكتب', 'اكتب', 'ارسمه أنت', 'بقلمك', 'اصبعك', 'إصبعك'];
            if (practiceKeywords.some(kw => aiResponse.text.includes(kw))) {
                aiResponse.action = 'practice_writing';
            } else if (aiResponse.text.includes('سبورة') || aiResponse.text.includes('انظر') || aiResponse.draw) {
                // FIXED: Do not overwrite QUIZ action
                if (aiResponse.action !== 'practice_writing' && aiResponse.action !== 'quiz') {
                    aiResponse.action = 'explain_board';
                }
            }

            // Intent Injection
            const intentResult = this.parseIntent(aiResponse.text);
            if (!aiResponse.draw && intentResult.intent) {
                const { shape } = intentResult.intent;
                const drawData = (intentResult.intent.type === 'letter') ? ARABIC_ALPHABET_PATHS[shape] : DRAWING_LIBRARY[shape];
                if (drawData) {
                    aiResponse.draw = drawData;
                    // FIXED: Only switch to explain_board if it's NOT a quiz
                    if (aiResponse.action !== 'practice_writing' && aiResponse.action !== 'quiz') {
                        aiResponse.action = 'explain_board';
                    }
                }
            } else if (aiResponse.draw) {
                if (ARABIC_ALPHABET_PATHS[aiResponse.draw]) aiResponse.draw = ARABIC_ALPHABET_PATHS[aiResponse.draw];
                else if (DRAWING_LIBRARY[aiResponse.draw]) aiResponse.draw = DRAWING_LIBRARY[aiResponse.draw];

                // FIXED: Do not overwrite quiz action if drawing is present
                // (Sometimes we want to draw items for the quiz)
                if (aiResponse.action !== 'practice_writing' && aiResponse.action !== 'quiz') {
                    // aiResponse.action = 'explain_board'; 
                }
            }

            this.context.push({ role: 'user', content: userMessage });
            this.context.push({ role: 'assistant', content: aiResponse.text });
            this.saveMemory();

            return aiResponse;

        } catch (error) {
            console.error('Gemini Error:', error);
            return {
                text: "لَمْ أَسْمَعْكَ جَيِّدًا. هَلْ يُمْكِنُكَ الْإِعَادَةُ؟",
                voiceText: this.cleanForTTS("لَمْ أَسْمَعْكَ جَيِّدًا. هَلْ يُمْكِنُكَ الْإِعَادَةُ؟"),
                action: "listening",
                emotion: "calm"
            };
        }
    }

    getDrawData(key) {
        if (!key) return null;
        return ARABIC_ALPHABET_PATHS[key] || DRAWING_LIBRARY[key] || null;
    }
}

export const aiService = new AIService();
