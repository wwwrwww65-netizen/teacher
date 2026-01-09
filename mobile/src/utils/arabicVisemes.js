/**
 * مخارج الحروف العربية (Arabic Phonemes/Visemes)
 * نظام متكامل لمزامنة حركة الفم مع النطق العربي
 */

// أشكال الفم (Mouth Shapes)
export const MOUTH_SHAPES = {
    // فم مغلق (للحروف الشفوية)
    CLOSED: {
        name: 'مغلق',
        path: 'M92 90 Q100 92 108 90',
        duration: 100,
    },

    // فم نصف مفتوح (للحروف المتوسطة)
    HALF_OPEN: {
        name: 'نصف مفتوح',
        path: 'M92 90 Q100 95 108 90',
        duration: 150,
    },

    // فم مفتوح (للحروف الحلقية)
    OPEN: {
        name: 'مفتوح',
        path: 'M92 85 Q100 95 108 85 Q100 100 92 85',
        duration: 200,
    },

    // فم واسع (للحروف الجوفية)
    WIDE: {
        name: 'واسع',
        path: 'M85 88 Q100 100 115 88 Q100 105 85 88',
        duration: 250,
    },

    // شفاه مدورة (للحروف المستديرة)
    ROUNDED: {
        name: 'مدور',
        path: 'M90 88 Q100 95 110 88 Q100 100 90 88',
        duration: 180,
    },
};

// مخارج الحروف العربية (Arabic Phoneme Mapping)
export const ARABIC_PHONEMES = {
    // الحروف الشفوية (Labial) - ب، م، و، ف
    'ب': 'CLOSED',
    'م': 'CLOSED',
    'و': 'ROUNDED',
    'ف': 'HALF_OPEN',

    // الحروف اللثوية (Dental) - ت، د، ط، ض، ث، ذ، ظ
    'ت': 'HALF_OPEN',
    'د': 'HALF_OPEN',
    'ط': 'HALF_OPEN',
    'ض': 'HALF_OPEN',
    'ث': 'HALF_OPEN',
    'ذ': 'HALF_OPEN',
    'ظ': 'HALF_OPEN',

    // الحروف اللثوية الأسنانية (Alveolar) - ن، ل، ر، س، ز، ص
    'ن': 'HALF_OPEN',
    'ل': 'HALF_OPEN',
    'ر': 'HALF_OPEN',
    'س': 'HALF_OPEN',
    'ز': 'HALF_OPEN',
    'ص': 'HALF_OPEN',

    // الحروف الغارية (Palatal) - ش، ج، ي
    'ش': 'HALF_OPEN',
    'ج': 'HALF_OPEN',
    'ي': 'HALF_OPEN',

    // الحروف الطبقية (Velar) - ك، ق، خ، غ
    'ك': 'OPEN',
    'ق': 'OPEN',
    'خ': 'OPEN',
    'غ': 'OPEN',

    // الحروف الحلقية (Pharyngeal) - ح، ع
    'ح': 'OPEN',
    'ع': 'WIDE',

    // الحروف الحنجرية (Glottal) - ء، هـ
    'ء': 'OPEN',
    'ه': 'OPEN',
    'هـ': 'OPEN',

    // الحركات (Vowels)
    'َ': 'OPEN',      // فتحة
    'ِ': 'HALF_OPEN', // كسرة
    'ُ': 'ROUNDED',   // ضمة
    'ا': 'WIDE',      // ألف
};

// تحليل النص العربي وتحويله لمخارج
export const analyzeArabicText = (text) => {
    const visemes = [];
    const chars = text.split('');

    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];

        // تجاهل المسافات والأرقام
        if (char === ' ' || /\d/.test(char)) {
            visemes.push({
                char,
                shape: 'CLOSED',
                duration: 50,
            });
            continue;
        }

        // الحصول على شكل الفم المناسب
        const shapeName = ARABIC_PHONEMES[char] || 'HALF_OPEN';
        const shape = MOUTH_SHAPES[shapeName];

        visemes.push({
            char,
            shape: shapeName,
            path: shape.path,
            duration: shape.duration,
        });
    }

    return visemes;
};

// توليد timeline للحركات
export const generateVisemeTimeline = (text, baseDuration = 100) => {
    const visemes = analyzeArabicText(text);
    const timeline = [];
    let currentTime = 0;

    visemes.forEach((viseme) => {
        timeline.push({
            time: currentTime,
            shape: viseme.shape,
            path: viseme.path,
            char: viseme.char,
        });

        currentTime += viseme.duration || baseDuration;
    });

    return {
        timeline,
        totalDuration: currentTime,
    };
};

// مثال للاستخدام:
// const text = "مرحباً بكم في الفصل";
// const { timeline, totalDuration } = generateVisemeTimeline(text);
// timeline.forEach(({ time, shape, char }) => {
//   console.log(`${time}ms: ${char} -> ${shape}`);
// });
