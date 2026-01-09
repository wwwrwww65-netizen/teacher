import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const GOOGLE_API_KEY = 'AIzaSyDHjklmJ4NjIP0qFspkVxzmNRhS1qkAYOE';

// مكتبة رسومات الحروف العربية
const ARABIC_ALPHABET_PATHS = {
    'أ': 'M 60 80 L 60 30 M 60 15 A 3 3 0 1 1 60 14.9',
    'ا': 'M 60 80 L 60 20',
    'ب': 'M 20 50 Q 60 70 100 50 M 60 80 A 3 3 0 1 1 60 79.9',
    'ت': 'M 20 60 Q 60 80 100 60 M 45 45 A 2 2 0 1 1 45 44.9 M 75 45 A 2 2 0 1 1 75 44.9',
    'ث': 'M 20 65 Q 60 85 100 65 M 40 50 A 2 2 0 1 1 40 49.9 M 60 35 A 2 2 0 1 1 60 34.9 M 80 50 A 2 2 0 1 1 80 49.9',
    'ج': 'M 80 30 Q 30 40 30 70 Q 30 90 60 90 Q 90 90 90 70 M 55 60 A 3 3 0 1 1 55 59.9',
    'ح': 'M 80 30 Q 30 40 30 70 Q 30 90 60 90 Q 90 90 90 70',
    'خ': 'M 80 30 Q 30 40 30 70 Q 30 90 60 90 Q 90 90 90 70 M 60 20 A 3 3 0 1 1 60 19.9',
    'د': 'M 30 60 L 80 60 Q 100 60 100 80',
    'ذ': 'M 30 60 L 80 60 Q 100 60 100 80 M 70 45 A 3 3 0 1 1 70 44.9',
    'ر': 'M 60 40 Q 80 60 60 80',
    'ز': 'M 60 40 Q 80 60 60 80 M 60 25 A 3 3 0 1 1 60 24.9',
    'س': 'M 10 70 Q 25 50 40 70 Q 55 50 70 70 Q 85 50 100 70',
    'ش': 'M 10 75 Q 25 55 40 75 Q 55 55 70 75 Q 85 55 100 75 M 40 40 A 2 2 0 1 1 40 39.9 M 55 30 A 2 2 0 1 1 55 29.9 M 70 40 A 2 2 0 1 1 70 39.9',
    'ص': 'M 20 60 Q 40 40 60 60 Q 80 40 100 60 L 100 80',
    'ض': 'M 20 60 Q 40 40 60 60 Q 80 40 100 60 L 100 80 M 60 35 A 3 3 0 1 1 60 34.9',
    'ط': 'M 30 80 L 30 50 Q 30 30 60 30 Q 90 30 90 50 L 90 80 M 60 20 L 60 10',
    'ظ': 'M 30 80 L 30 50 Q 30 30 60 30 Q 90 30 90 50 L 90 80 M 60 20 L 60 10 M 60 5 A 3 3 0 1 1 60 4.9',
    'ع': 'M 80 30 L 50 50 Q 30 70 50 85 Q 70 95 90 80',
    'غ': 'M 80 30 L 50 50 Q 30 70 50 85 Q 70 95 90 80 M 65 20 A 3 3 0 1 1 65 19.9',
    'ف': 'M 20 70 Q 60 90 100 70 L 100 50 Q 100 30 80 30 M 60 20 A 3 3 0 1 1 60 19.9',
    'ق': 'M 20 70 Q 60 90 100 70 L 100 50 Q 100 30 80 30 M 45 50 A 2 2 0 1 1 45 49.9 M 75 50 A 2 2 0 1 1 75 49.9',
    'ك': 'M 90 80 L 90 40 Q 90 20 60 20 L 30 20 M 60 35 L 45 50',
    'ل': 'M 60 80 L 60 20 Q 60 10 50 10 L 30 10',
    'م': 'M 20 70 Q 60 90 100 70 Q 110 50 90 40 Q 70 30 60 50',
    'ن': 'M 20 60 Q 60 80 100 60 M 60 40 A 3 3 0 1 1 60 39.9',
    'ه': 'M 40 60 Q 60 40 80 60 Q 60 80 40 60',
    'و': 'M 60 40 A 20 20 0 1 1 60 80 L 60 95',
    'ي': 'M 20 50 Q 60 70 100 50 M 45 85 A 2 2 0 1 1 45 84.9 M 75 85 A 2 2 0 1 1 75 84.9',
    'ى': 'M 20 50 Q 60 70 100 50 Q 110 60 100 70',
    'ة': 'M 40 60 Q 60 40 80 60 Q 60 80 40 60 M 50 35 A 2 2 0 1 1 50 34.9 M 70 35 A 2 2 0 1 1 70 34.9',
    'ء': 'M 50 50 Q 60 40 70 50 Q 60 60 50 50',
    'ئ': 'M 20 50 Q 60 70 100 50 M 45 85 A 2 2 0 1 1 45 84.9 M 75 85 A 2 2 0 1 1 75 84.9 M 60 30 Q 70 20 60 10',
    'ؤ': 'M 60 50 A 15 15 0 1 1 60 80 L 60 95 M 60 30 Q 70 20 60 10',
    'إ': 'M 60 80 L 60 20 M 60 95 A 3 3 0 1 1 60 94.9',
    'آ': 'M 60 80 L 60 20 M 50 10 Q 60 5 70 10',
};

const DRAWING_LIBRARY = {
    '1': 'M 60 20 L 60 80 M 50 80 L 70 80',
    '2': 'M 30 30 Q 60 10 80 30 Q 90 50 60 60 L 30 80 L 90 80',
    '3': 'M 30 25 Q 60 15 80 30 Q 90 45 60 55 Q 90 65 80 80 Q 60 95 30 85',
    '4': 'M 70 80 L 70 20 L 30 60 L 90 60',
    '5': 'M 80 20 L 40 20 L 35 45 Q 60 40 80 55 Q 90 75 60 85 Q 35 90 25 75',
    '6': 'M 70 25 Q 40 20 30 50 Q 25 80 55 85 Q 85 85 85 60 Q 85 40 55 40 Q 30 45 30 60',
    '7': 'M 30 20 L 80 20 L 50 80',
    '8': 'M 60 50 Q 30 35 40 20 Q 60 5 80 20 Q 95 40 60 50 Q 25 60 35 80 Q 55 95 80 80 Q 95 65 60 50',
    '9': 'M 40 75 Q 70 80 80 50 Q 85 20 55 15 Q 25 15 25 40 Q 25 60 55 60 Q 80 55 80 40',
    '0': 'M 60 20 Q 30 20 30 50 Q 30 80 60 80 Q 90 80 90 50 Q 90 20 60 20',
    '١': 'M 60 20 L 60 80',
    '٢': 'M 40 30 Q 60 20 80 40 Q 70 60 50 80',
    '٣': 'M 35 25 Q 55 20 70 35 Q 75 50 55 55 Q 75 60 70 75 Q 55 85 35 80',
    '٤': 'M 70 20 L 30 60 L 90 60 M 70 40 L 70 80',
    '٥': 'M 30 20 A 30 30 0 1 1 30 80',
    '٦': 'M 60 20 A 25 25 0 1 1 35 70 L 35 85',
    '٧': 'M 30 20 L 70 20 L 70 80',
    '٨': 'M 30 40 L 70 40 L 70 80 L 30 80 L 30 40',
    '٩': 'M 70 80 A 25 25 0 1 1 70 30',
    '٠': 'M 60 80 A 3 3 0 1 1 60 79.9',

    // --- SHAPES & FUN OBJECTS ---
    'apple': 'M 50 40 Q 30 20 20 50 Q 20 80 50 90 Q 80 80 80 50 Q 70 20 50 40 M 50 40 Q 50 20 60 10', // apple / تفاحة
    'tree': 'M 50 70 L 50 95 M 50 70 Q 20 70 20 40 Q 20 10 50 10 Q 80 10 80 40 Q 80 70 50 70', // tree / شجرة
    'house': 'M 20 50 L 50 20 L 80 50 L 80 90 L 20 90 L 20 50 M 40 90 L 40 70 L 60 70 L 60 90', // house / بيت
    'car': 'M 20 60 L 30 40 L 70 40 L 80 60 L 90 60 L 90 80 L 10 80 L 10 60 L 20 60 M 30 80 A 5 5 0 1 0 30 80 M 70 80 A 5 5 0 1 0 70 80', // car / سيارة
    'ball': 'M 50 50 A 30 30 0 1 1 50 49.9 M 20 50 L 80 50 M 50 20 L 50 80', // ball / كرة
    'flower': 'M 50 50 A 10 10 0 1 0 50 50 M 50 40 Q 50 10 70 20 Q 50 40 50 50 M 50 60 Q 50 90 30 80 Q 50 60 50 50 M 60 50 Q 90 50 80 30 Q 60 50 50 50 M 40 50 Q 10 50 20 70 Q 40 50 50 50 M 50 90 L 50 100', // flower / زهرة
    'sun': 'M 50 50 A 15 15 0 1 1 50 49.9 M 50 30 L 50 10 M 50 70 L 50 90 M 70 50 L 90 50 M 30 50 L 10 50 M 65 35 L 80 20 M 35 65 L 20 80 M 65 65 L 80 80 M 35 35 L 20 20', // sun / شمس
    'star': 'M 50 20 L 60 40 L 85 40 L 65 55 L 75 80 L 50 65 L 25 80 L 35 55 L 15 40 L 40 40 L 50 20', // star / نجمة
    'smile': 'M 50 50 A 30 30 0 1 1 50 49.9 M 35 40 A 3 3 0 1 1 35 39.9 M 65 40 A 3 3 0 1 1 65 39.9 M 35 65 Q 50 80 65 65', // smile / وجه سعيد
};

class AIService {
    constructor() {
        this.context = [];
        this.userProfile = { name: '', grade: '', gradeId: 'Grade1', interests: [], gradeVerified: false };
    }

    async loadMemory() {
        try {
            const data = await AsyncStorage.getItem('nora_memory');
            if (data) {
                const parsed = JSON.parse(data);
                this.context = parsed.context || [];
                if (parsed.userProfile) {
                    this.userProfile = { ...this.userProfile, ...parsed.userProfile };
                }
            }
        } catch (e) { }
    }

    async saveMemory() {
        try {
            await AsyncStorage.setItem('nora_memory', JSON.stringify({
                context: this.context.slice(-20),
                userProfile: this.userProfile
            }));
        } catch (e) { }
    }

    setUserProfile(profile) {
        this.userProfile = { ...this.userProfile, ...profile };
        this.saveMemory();
    }

    cleanForTTS(text) {
        if (!text) return '';
        return text
            .replace(/\*\*/g, '')
            .replace(/[#_`~]/g, '')
            .replace(/\[.*?\]/g, '')
            .replace(/\(.*?\)/g, '')
            .replace(/\{.*?\}/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    getDrawData(key) {
        if (!key) return null;
        let normalizedKey = key.trim().replace(/[ًٌٍَُِّْ]/g, '').toLowerCase();

        // Arabic-to-English Mapping & English Code Handling
        const dictionary = {
            'تفاحة': 'apple', 'تفاحه': 'apple',
            'شجرة': 'tree', 'شجره': 'tree',
            'بيت': 'house', 'منزل': 'house',
            'سيارة': 'car', 'سياره': 'car',
            'كرة': 'ball', 'كره': 'ball',
            'زهرة': 'flower', 'وردة': 'flower',
            'شمس': 'sun',
            'نجمة': 'star', 'نجمه': 'star',
            'وجه': 'smile', 'مبتسم': 'smile'
        };

        // Handle "letter_x" format from Gemini
        if (normalizedKey.startsWith('letter_')) {
            const char = normalizedKey.split('_')[1];
            const englishToArabic = {
                // Single letters
                'a': 'أ', 'b': 'ب', 't': 'ت', 'th': 'ث', 'j': 'ج', 'h': 'ح', 'kh': 'خ',
                'd': 'د', 'dh': 'ذ', 'r': 'ر', 'z': 'ز', 's': 'س', 'sh': 'ش', 's2': 'ص',
                'd2': 'ض', 't2': 'ط', 'z2': 'ظ', 'aa': 'ع', 'gh': 'غ', 'f': 'ف', 'q': 'ق',
                'k': 'ك', 'l': 'ل', 'm': 'م', 'n': 'ن', 'h2': 'ه', 'w': 'و', 'y': 'ي',
                // Full names (what Gemini often uses)
                'alif': 'أ', 'alef': 'أ', 'baa': 'ب', 'ba': 'ب', 'taa': 'ت', 'ta': 'ت',
                'thaa': 'ث', 'tha': 'ث', 'jeem': 'ج', 'jim': 'ج', 'haa': 'ح', 'ha': 'ح',
                'khaa': 'خ', 'kha': 'خ', 'daal': 'د', 'dal': 'د', 'dhaal': 'ذ', 'dhal': 'ذ',
                'raa': 'ر', 'ra': 'ر', 'zay': 'ز', 'zayn': 'ز', 'seen': 'س', 'sin': 'س',
                'sheen': 'ش', 'shin': 'ش', 'saad': 'ص', 'sad': 'ص', 'daad': 'ض', 'dad': 'ض',
                'tah': 'ط', 'dhah': 'ظ', 'ayn': 'ع', 'ain': 'ع', 'ghayn': 'غ', 'ghain': 'غ',
                'faa': 'ف', 'fa': 'ف', 'qaaf': 'ق', 'qaf': 'ق', 'kaaf': 'ك', 'kaf': 'ك',
                'laam': 'ل', 'lam': 'ل', 'meem': 'م', 'mim': 'م', 'noon': 'ن', 'nun': 'ن',
                'hah': 'ه', 'waw': 'و', 'yaa': 'ي', 'ya': 'ي'
            };
            if (englishToArabic[char]) return englishToArabic[char];
        }

        // Also check for standalone letter names (without letter_ prefix)
        const letterNames = {
            'alif': 'أ', 'alef': 'أ', 'baa': 'ب', 'ba': 'ب', 'taa': 'ت', 'ta': 'ت',
            'thaa': 'ث', 'tha': 'ث', 'jeem': 'ج', 'jim': 'ج', 'haa': 'ح', 'ha': 'ح',
            'khaa': 'خ', 'kha': 'خ', 'daal': 'د', 'dal': 'د', 'dhaal': 'ذ', 'dhal': 'ذ',
            'raa': 'ر', 'ra': 'ر', 'zay': 'ز', 'zayn': 'ز', 'seen': 'س', 'sin': 'س',
            'sheen': 'ش', 'shin': 'ش', 'saad': 'ص', 'sad': 'ص', 'daad': 'ض', 'dad': 'ض',
            'tah': 'ط', 'dhah': 'ظ', 'ayn': 'ع', 'ain': 'ع', 'ghayn': 'غ', 'ghain': 'غ',
            'faa': 'ف', 'fa': 'ف', 'qaaf': 'ق', 'qaf': 'ق', 'kaaf': 'ك', 'kaf': 'ك',
            'laam': 'ل', 'lam': 'ل', 'meem': 'م', 'mim': 'م', 'noon': 'ن', 'nun': 'ن',
            'hah': 'ه', 'waw': 'و', 'yaa': 'ي', 'ya': 'ي'
        };
        if (letterNames[normalizedKey]) return letterNames[normalizedKey];

        if (dictionary[normalizedKey]) {
            normalizedKey = dictionary[normalizedKey];
        }

        // FORCE PLAIN TEXT FOR LETTERS
        if (/^[\u0600-\u06FF]$/.test(normalizedKey)) return normalizedKey;

        // Try exact match first
        // if (ARABIC_ALPHABET_PATHS[normalizedKey]) return ARABIC_ALPHABET_PATHS[normalizedKey]; // DEPRECATED for letters
        if (DRAWING_LIBRARY[normalizedKey]) return DRAWING_LIBRARY[normalizedKey];

        // Try first character (only if it's a single Arabic letter)
        if (normalizedKey.length === 1) {
            const firstChar = normalizedKey.charAt(0);
            if (ARABIC_ALPHABET_PATHS[firstChar]) return ARABIC_ALPHABET_PATHS[firstChar];
            if (DRAWING_LIBRARY[firstChar]) return DRAWING_LIBRARY[firstChar];
        }

        return null; // Return null so the UI can decide (e.g. render as text)
    }

    async chat(userMessage) {
        try {
            const systemPrompt = `أنتِ المعلمة نورا. معلمة عربية محبوبة للأطفال.
            
قواعد:
1. تحدثي بالفصحى البسيطة فقط
2. كوني لطيفة وحنونة
3. استخدمي جمل قصيرة وواضحة
4. لا تستخدمي رموز markdown

الطفل اسمه: ${this.userProfile.name || 'بطل'}
الصف: ${this.userProfile.grade || 'الأول'}`;

            const contents = [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: 'حسناً، سأكون المعلمة نورا الحنونة.' }] },
                { role: 'user', parts: [{ text: userMessage }] }
            ];

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_API_KEY}`,
                { contents, generationConfig: { temperature: 0.9 } },
                { headers: { 'Content-Type': 'application/json' } }
            );

            const aiRawText = response.data.candidates[0].content.parts[0].text;

            this.context.push({ role: 'user', content: userMessage });
            this.context.push({ role: 'assistant', content: aiRawText });
            this.saveMemory();

            return {
                text: aiRawText,
                voiceText: this.cleanForTTS(aiRawText)
            };
        } catch (error) {
            console.error('❌ [AIService] Chat Error:', error.message || error);
            return { text: "لَمْ أَسْمَعْكَ جَيِّدًا.", action: "listening" };
        }
    }
}

export const aiService = new AIService();
