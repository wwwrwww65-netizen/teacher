const ARABIC_ALPHABET_PATHS = {
    'أ': "M 150 70 q -5 70 0 140 M 130 50 c 0 -20 40 -20 40 0 s -40 10 -40 20 h 40",
    'م': "M 190 170 c -15 -15 15 -15 15 5 c -5 30 -10 60 -10 90",
    'ق': "M 190 160 a 18 18 0 1 1 -0.1 0 h 65 c 0 100 -180 100 -180 10 l -10 -30 M 180 130 a 5 5 0 1 1 -0.1 0 M 210 130 a 5 5 0 1 1 -0.1 0",
};

const DRAWING_LIBRARY = {
    'أسد': "🦁-PATH",
    'كتاب': "📖-PATH"
};

const letterNames = {
    'أ': ['ألف', 'أ', 'اليف'],
    'م': ['ميم', 'م'],
    'ق': ['قاف', 'ق']
};

function normalizeArabic(text) {
    if (!text) return "";
    return text
        .normalize('NFC')
        .replace(/[\u064B-\u0652]/g, "") // إزالة التشكيل
        .replace(/(^|\s)ال([\u0621-\u064A])/g, "$1$2")
        .replace(/[أإآ]/g, "ا")           // توحيد الألف
        .replace(/ة/g, "ه")                // توحيد التاء المربوطة
        .replace(/ى/g, "ي")                // توحيد الياء
        .replace(/[!؟?.،,]/g, "")         // إزالة علامات الترقيم للجرد
        .trim();
}

function parseIntent(aiText) {
    const rawText = aiText;
    const normalized = normalizeArabic(aiText);

    let result = {
        intent: null,
        confidence: 0,
        selectedAssetKey: null,
        log: ""
    };

    // Rule 1: Explicit Priority
    const explicitPatterns = [
        /(?:حرف|اكتب|ارسم|نكتب|كلمه)\s+([أ-ي]|[\u0621-\u064A]+)/u,
        /["']([أ-ي])["']/u
    ];

    for (const pattern of explicitPatterns) {
        const match = normalized.match(pattern);
        if (match) {
            const foundName = match[1];
            for (const [letter, synonyms] of Object.entries(letterNames)) {
                if (synonyms.some(s => normalizeArabic(s) === normalizeArabic(foundName))) {
                    result.intent = { shape: letter, type: 'letter' };
                    result.selectedAssetKey = letter;
                    result.confidence = 1.0;
                    result.log = `✅ Explicit: ${letter}`;
                    return result;
                }
            }
        }
    }

    // Rule 2: General Letter
    for (const [letter, synonyms] of Object.entries(letterNames)) {
        if (synonyms.some(s => {
            const ns = normalizeArabic(s);
            const regex = new RegExp(`(?:^|\\s)${ns}(?:$|\\s)`, 'u');
            return regex.test(normalized);
        })) {
            result.intent = { shape: letter, type: 'letter' };
            result.selectedAssetKey = letter;
            result.confidence = 0.8;
            result.log = `✅ General: ${letter}`;
            return result;
        }
    }

    // Rule 3: Objects
    for (const key of Object.keys(DRAWING_LIBRARY)) {
        const nKey = normalizeArabic(key);
        const wordRegex = new RegExp(`(?:^|\\s)${nKey}(?:$|\\s)`, 'u');
        if (wordRegex.test(normalized)) {
            result.intent = { shape: key, type: 'object' };
            result.selectedAssetKey = key;
            result.confidence = 0.7;
            result.log = `✅ Object: ${key}`;
            return result;
        }
    }

    return result;
}

const tests = [
    "القاف! إنه يشبه الفاء",
    "الألف! إنه أول حرف",
    "مثل الأسد!",
    "اكتب حرف الميم",
    "كتابة الدرس"
];

tests.forEach(t => {
    const result = parseIntent(t);
    console.log(`Text: "${t}" -> Result: ${result.intent ? result.selectedAssetKey + " (" + result.log + ")" : "FAIL"}`);
});
