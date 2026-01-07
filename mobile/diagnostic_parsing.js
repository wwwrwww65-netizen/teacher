const tests = [
    "اكتب حرف الألف",
    "حرف الف",
    "الالف",
    "اكتب حرف ثاء",
    "ثاء",
    "جيم",
    "حرف الجيم"
];

// Mocking the AIService logic for quick testing
function normalizeArabic(text) {
    if (!text) return "";
    return text
        .normalize('NFC')
        .replace(/[\u064B-\u0652]/g, "") // remove tashkeel
        .replace(/(^|\s)ال([\u0621-\u064A])/g, "$1$2") // remove Al- prefix
        .replace(/[أإآ]/g, "ا")           // unify Alif
        .replace(/ة/g, "ه")                // unify Taa Marbuta
        .replace(/ى/g, "ي")                // unify Yaa
        .replace(/[!؟?.،,]/g, "")         // remove punctuation
        .trim();
}

const letterNames = {
    'أ': ['ألف', 'أ', 'اليف', 'الف'],
    'ث': ['ثاء', 'ث'],
    'ج': ['جيم', 'ج']
};

function parseIntent(aiText) {
    const normalized = normalizeArabic(aiText);
    console.log(`Input: "${aiText}" -> Norm: "${normalized}"`);

    // Explicit Pattern
    const explicitPatterns = [
        /(?:اكتب|ارسم|نكتب|كلمه|حرف)\s+(?:حرف\s+)?([أ-ي]|[\u0621-\u064A]+)/u,
        /["']([أ-ي])["']/u
    ];

    for (const pattern of explicitPatterns) {
        const match = normalized.match(pattern);
        if (match) {
            const foundName = match[1];
            // Check dictionary
            for (const [letter, synonyms] of Object.entries(letterNames)) {
                if (synonyms.some(s => normalizeArabic(s) === normalizeArabic(foundName))) {
                    return `✅ Priority: ${letter}`;
                }
            }
        }
    }

    // General Lookup
    for (const [letter, synonyms] of Object.entries(letterNames)) {
        if (synonyms.some(s => {
            const ns = normalizeArabic(s);
            const regex = new RegExp(`(?:^|\\s)${ns}(?:$|\\s)`, 'u');
            return regex.test(normalized);
        })) {
            return `✅ General: ${letter}`;
        }
    }

    return "❌ No Match";
}

tests.forEach(t => console.log(parseIntent(t)));
