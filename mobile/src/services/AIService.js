import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { firebaseService } from './FirebaseService';

const GOOGLE_API_KEY = 'AIzaSyDHjklmJ4NjIP0qFspkVxzmNRhS1qkAYOE';

// ============================================================================
// 🔤 مكتبة رسومات الحروف العربية - الشكل المنفصل (Isolated Form)
// ============================================================================
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

// ============================================================================
// 🔤 أشكال الحروف في مواضع مختلفة (Initial, Medial, Final)
// ============================================================================
const ARABIC_LETTER_FORMS = {
    // حرف الباء
    'ب_بداية': 'M 10 50 Q 50 70 90 50 L 100 50 M 50 80 A 3 3 0 1 1 50 79.9',  // بـ
    'ب_وسط': 'M 10 50 L 100 50 M 55 80 A 3 3 0 1 1 55 79.9',                    // ـبـ
    'ب_نهاية': 'M 10 50 Q 50 70 90 50 M 50 80 A 3 3 0 1 1 50 79.9',             // ـب
    
    // حرف التاء
    'ت_بداية': 'M 10 60 Q 50 80 90 60 L 100 60 M 40 45 A 2 2 0 1 1 40 44.9 M 70 45 A 2 2 0 1 1 70 44.9',
    'ت_وسط': 'M 10 60 L 100 60 M 45 45 A 2 2 0 1 1 45 44.9 M 65 45 A 2 2 0 1 1 65 44.9',
    'ت_نهاية': 'M 10 60 Q 50 80 90 60 M 40 45 A 2 2 0 1 1 40 44.9 M 70 45 A 2 2 0 1 1 70 44.9',
    
    // حرف العين
    'ع_بداية': 'M 80 30 L 50 50 Q 30 70 50 85 L 100 85',
    'ع_وسط': 'M 10 50 L 30 50 Q 50 60 70 50 L 100 50',
    'ع_نهاية': 'M 10 50 L 50 50 Q 30 70 50 85 Q 70 95 90 80',
    
    // حرف الميم
    'م_بداية': 'M 10 70 Q 50 90 80 70 L 100 70',
    'م_وسط': 'M 10 60 L 30 60 Q 50 75 70 60 L 100 60',
    'م_نهاية': 'M 10 70 Q 50 90 80 70 Q 90 50 70 40 Q 50 30 40 50',
    
    // حرف السين
    'س_بداية': 'M 10 70 Q 25 50 40 70 Q 55 50 70 70 L 100 70',
    'س_وسط': 'M 10 65 Q 30 50 50 65 Q 70 50 90 65 L 100 65',
    'س_نهاية': 'M 10 70 Q 25 50 40 70 Q 55 50 70 70 Q 85 50 100 70',
    
    // حرف النون
    'ن_بداية': 'M 10 60 Q 50 80 90 60 L 100 60 M 50 40 A 3 3 0 1 1 50 39.9',
    'ن_وسط': 'M 10 60 L 100 60 M 55 40 A 3 3 0 1 1 55 39.9',
    'ن_نهاية': 'M 10 60 Q 50 80 90 60 M 50 40 A 3 3 0 1 1 50 39.9',
};

// ============================================================================
// 🔢 الأرقام العربية والإنجليزية
// ============================================================================
const DRAWING_LIBRARY = {
    // أرقام إنجليزية
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
    
    // أرقام عربية
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

    // ============================================================================
    // ➕ الرموز الرياضية
    // ============================================================================
    '+': 'M 50 20 L 50 80 M 20 50 L 80 50',                          // زائد
    '-': 'M 20 50 L 80 50',                                          // ناقص
    '×': 'M 25 25 L 75 75 M 75 25 L 25 75',                          // ضرب
    '÷': 'M 20 50 L 80 50 M 50 25 A 3 3 0 1 1 50 24.9 M 50 75 A 3 3 0 1 1 50 74.9', // قسمة
    '=': 'M 20 40 L 80 40 M 20 60 L 80 60',                          // يساوي
    '<': 'M 70 20 L 30 50 L 70 80',                                  // أصغر من
    '>': 'M 30 20 L 70 50 L 30 80',                                  // أكبر من
    '≤': 'M 70 15 L 30 45 L 70 75 M 20 85 L 80 85',                  // أصغر أو يساوي
    '≥': 'M 30 15 L 70 45 L 30 75 M 20 85 L 80 85',                  // أكبر أو يساوي
    '≠': 'M 20 40 L 80 40 M 20 60 L 80 60 M 30 20 L 70 80',          // لا يساوي
    '%': 'M 25 25 A 5 5 0 1 1 25 24.9 M 75 75 A 5 5 0 1 1 75 74.9 M 30 70 L 70 30', // نسبة مئوية
    '√': 'M 20 50 L 35 65 L 50 20 L 80 20',                          // جذر تربيعي
    '∞': 'M 30 50 Q 40 30 50 50 Q 60 70 70 50 Q 60 30 50 50 Q 40 70 30 50', // ما لا نهاية

    // ============================================================================
    // 🎨 الأشكال والرسومات
    // ============================================================================
    'apple': 'M 50 40 Q 30 20 20 50 Q 20 80 50 90 Q 80 80 80 50 Q 70 20 50 40 M 50 40 Q 50 20 60 10',
    'تفاحة': 'M 50 40 Q 30 20 20 50 Q 20 80 50 90 Q 80 80 80 50 Q 70 20 50 40 M 50 40 Q 50 20 60 10',
    'tree': 'M 50 70 L 50 95 M 50 70 Q 20 70 20 40 Q 20 10 50 10 Q 80 10 80 40 Q 80 70 50 70',
    'شجرة': 'M 50 70 L 50 95 M 50 70 Q 20 70 20 40 Q 20 10 50 10 Q 80 10 80 40 Q 80 70 50 70',
    'house': 'M 20 50 L 50 20 L 80 50 L 80 90 L 20 90 L 20 50 M 40 90 L 40 70 L 60 70 L 60 90',
    'بيت': 'M 20 50 L 50 20 L 80 50 L 80 90 L 20 90 L 20 50 M 40 90 L 40 70 L 60 70 L 60 90',
    'منزل': 'M 20 50 L 50 20 L 80 50 L 80 90 L 20 90 L 20 50 M 40 90 L 40 70 L 60 70 L 60 90',
    'car': 'M 20 60 L 30 40 L 70 40 L 80 60 L 90 60 L 90 80 L 10 80 L 10 60 L 20 60 M 30 80 A 5 5 0 1 0 30 80 M 70 80 A 5 5 0 1 0 70 80',
    'سيارة': 'M 20 60 L 30 40 L 70 40 L 80 60 L 90 60 L 90 80 L 10 80 L 10 60 L 20 60 M 30 80 A 5 5 0 1 0 30 80 M 70 80 A 5 5 0 1 0 70 80',
    'ball': 'M 50 50 A 30 30 0 1 1 50 49.9 M 20 50 L 80 50 M 50 20 L 50 80',
    'كرة': 'M 50 50 A 30 30 0 1 1 50 49.9 M 20 50 L 80 50 M 50 20 L 50 80',
    'flower': 'M 50 50 A 10 10 0 1 0 50 50 M 50 40 Q 50 10 70 20 Q 50 40 50 50 M 50 60 Q 50 90 30 80 Q 50 60 50 50 M 60 50 Q 90 50 80 30 Q 60 50 50 50 M 40 50 Q 10 50 20 70 Q 40 50 50 50 M 50 90 L 50 100',
    'زهرة': 'M 50 50 A 10 10 0 1 0 50 50 M 50 40 Q 50 10 70 20 Q 50 40 50 50 M 50 60 Q 50 90 30 80 Q 50 60 50 50 M 60 50 Q 90 50 80 30 Q 60 50 50 50 M 40 50 Q 10 50 20 70 Q 40 50 50 50 M 50 90 L 50 100',
    'وردة': 'M 50 50 A 10 10 0 1 0 50 50 M 50 40 Q 50 10 70 20 Q 50 40 50 50 M 50 60 Q 50 90 30 80 Q 50 60 50 50 M 60 50 Q 90 50 80 30 Q 60 50 50 50 M 40 50 Q 10 50 20 70 Q 40 50 50 50 M 50 90 L 50 100',
    'sun': 'M 50 50 A 15 15 0 1 1 50 49.9 M 50 30 L 50 10 M 50 70 L 50 90 M 70 50 L 90 50 M 30 50 L 10 50 M 65 35 L 80 20 M 35 65 L 20 80 M 65 65 L 80 80 M 35 35 L 20 20',
    'شمس': 'M 50 50 A 15 15 0 1 1 50 49.9 M 50 30 L 50 10 M 50 70 L 50 90 M 70 50 L 90 50 M 30 50 L 10 50 M 65 35 L 80 20 M 35 65 L 20 80 M 65 65 L 80 80 M 35 35 L 20 20',
    'star': 'M 50 20 L 60 40 L 85 40 L 65 55 L 75 80 L 50 65 L 25 80 L 35 55 L 15 40 L 40 40 L 50 20',
    'نجمة': 'M 50 20 L 60 40 L 85 40 L 65 55 L 75 80 L 50 65 L 25 80 L 35 55 L 15 40 L 40 40 L 50 20',
    'smile': 'M 50 50 A 30 30 0 1 1 50 49.9 M 35 40 A 3 3 0 1 1 35 39.9 M 65 40 A 3 3 0 1 1 65 39.9 M 35 65 Q 50 80 65 65',
    'وجه': 'M 50 50 A 30 30 0 1 1 50 49.9 M 35 40 A 3 3 0 1 1 35 39.9 M 65 40 A 3 3 0 1 1 65 39.9 M 35 65 Q 50 80 65 65',
    'مبتسم': 'M 50 50 A 30 30 0 1 1 50 49.9 M 35 40 A 3 3 0 1 1 35 39.9 M 65 40 A 3 3 0 1 1 65 39.9 M 35 65 Q 50 80 65 65',
};

// ============================================================================
// 🛠️ دوال مساعدة للتحويل والمعالجة
// ============================================================================

/**
 * تحويل الأرقام الإنجليزية إلى عربية
 */
function convertToArabicNumerals(text) {
    if (!text) return text;
    const map = {
        '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
        '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
    };
    return text.replace(/[0-9]/g, digit => map[digit] || digit);
}

/**
 * تحويل الأرقام العربية إلى إنجليزية (للمعالجة الداخلية)
 */
function convertToEnglishNumerals(text) {
    if (!text) return text;
    const map = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };
    return text.replace(/[٠-٩]/g, digit => map[digit] || digit);
}

/**
 * تحويل الرموز الرياضية إلى نص عربي للنطق
 */
function convertMathSymbolsToArabic(text) {
    if (!text) return text;
    return text
        .replace(/\+/g, ' زَائِدْ ')
        .replace(/\-/g, ' نَاقِصْ ')
        .replace(/×/g, ' ضَرْبْ ')
        .replace(/÷/g, ' قِسْمَةْ ')
        .replace(/=/g, ' يُسَاوِي ')
        .replace(/</g, ' أَصْغَرْ مِنْ ')
        .replace(/>/g, ' أَكْبَرْ مِنْ ')
        .replace(/≤/g, ' أَصْغَرْ أَوْ يُسَاوِي ')
        .replace(/≥/g, ' أَكْبَرْ أَوْ يُسَاوِي ')
        .replace(/≠/g, ' لَا يُسَاوِي ')
        .replace(/%/g, ' بِالْمِئَةْ ')
        .replace(/√/g, ' جَذْرْ ')
        .replace(/∞/g, ' مَا لَا نِهَايَةْ ')
        .replace(/\s+/g, ' ')
        .trim();
}

class AIService {
    constructor() {
        this.context = [];
        this.userProfile = {
            name: '',
            grade: '',
            gradeId: 'Grade1',
            interests: [],
            gradeVerified: false,
            // نظام الذاكرة الموسع
            lastLesson: '',          // آخر درس (مثل: "حرف العين")
            lastTopic: '',           // آخر موضوع (مثل: "كتابة الحرف")
            totalSessions: 0,        // عدد الجلسات الكلي
            lastSessionDate: null,   // تاريخ آخر جلسة
            isFirstTime: true        // هل هذه أول مرة؟
        };
    }

    async loadMemory() {
        try {
            // 1. Load from Local Storage (Fast)
            const data = await AsyncStorage.getItem('nora_memory');
            if (data) {
                const parsed = JSON.parse(data);
                this.context = parsed.context || [];
                if (parsed.userProfile) {
                    this.userProfile = { ...this.userProfile, ...parsed.userProfile };
                    console.log('📱 [Memory] Loaded local profile:', this.userProfile.name);
                }
            }

            // 2. Load from Firebase (Cloud Sync)
            // لجلب أحدث مستوى ومعلومات للطالب من قاعدة البيانات
            const cloudProfile = await firebaseService.getStudentData();
            if (cloudProfile) {
                console.log('☁️ [Memory] Found cloud profile, syncing...');
                this.userProfile = { ...this.userProfile, ...cloudProfile };
                
                // Update local storage with synced data
                await AsyncStorage.setItem('nora_memory', JSON.stringify({
                    context: this.context.slice(-20),
                    userProfile: this.userProfile
                }));
            }
        } catch (e) {
            console.error('❌ [Memory] Error loading memory:', e);
        }
    }

    async saveMemory() {
        try {
            // 1. Save locally
            await AsyncStorage.setItem('nora_memory', JSON.stringify({
                context: this.context.slice(-20),
                userProfile: this.userProfile
            }));

            // 2. Save to Firebase Database
            // حفظ معلومات الطالب ومستواه في قاعدة البيانات
            await firebaseService.saveStudentData(this.userProfile);
        } catch (e) {
            console.error('❌ [Memory] Error saving memory:', e);
        }
    }

    setUserProfile(profile) {
        this.userProfile = { ...this.userProfile, ...profile };
        this.saveMemory();
    }

    /**
     * تحديث معلومات الجلسة الحالية
     */
    updateSession(updates = {}) {
        const now = new Date().toISOString();
        this.userProfile = {
            ...this.userProfile,
            ...updates,
            lastSessionDate: now,
            isFirstTime: false
        };
        this.saveMemory();
        console.log('📊 [SESSION] Updated:', this.userProfile);
    }

    /**
     * بدء جلسة جديدة
     */
    startNewSession() {
        this.userProfile.totalSessions = (this.userProfile.totalSessions || 0) + 1;
        this.userProfile.lastSessionDate = new Date().toISOString();
        this.saveMemory();
        console.log(`🎓 [SESSION] Started session #${this.userProfile.totalSessions}`);
    }

    /**
     * تحديث آخر درس
     */
    updateLastLesson(lesson, topic = '') {
        this.userProfile.lastLesson = lesson;
        if (topic) this.userProfile.lastTopic = topic;
        this.saveMemory();
        console.log(`📚 [LESSON] Updated: ${lesson}${topic ? ` - ${topic}` : ''}`);
    }

    /**
     * الحصول على سياق الترحيب لـ Gemini
     */
    getGreetingContext() {
        const { name, grade, isFirstTime, lastLesson, totalSessions, lastSessionDate } = this.userProfile;
        
        console.log('👋 [GREETING] Getting greeting context:', { name, grade, isFirstTime, lastLesson, totalSessions });
        
        if (isFirstTime) {
            const message = `أَهْلًا وَسَهْلًا بِكَ يَا ${name || 'بطل'}! لَقَدْ عَرَفْتُ أَنَّكَ بَطَلٌ فِي ${grade || 'الصَّفِّ الأول'}، هَذَا رَائِع! أَنَا الْمُعَلِّمَةُ نُورَا، وَهَذَا فُصُلُنَا الْدِّرَاسِيُّ الْمُذهِلُ. كَيْفَ تُحِبُّ أَنْ نَبْدَأَ رِحْلَتَنَا الْيَوْمَ؟`;
            console.log('👋 [GREETING] First visit greeting:', message);
            return {
                type: 'first_visit',
                message: message
            };
        } else {
            const sessionInfo = `هذه الجلسة رقم ${totalSessions || 1} مع الطفل ${name || 'البطل'}.`;
            const lessonInfo = lastLesson ? 
                `آخر درس كان: "${lastLesson}". ذكّريه بذلك بطريقة ودودة.` : 
                'لم يكمل أي درس بعد.';
            
            const message = `${sessionInfo} ${lessonInfo} أَهْلاً بِعَوْدَتِكَ يَا ${name || 'بطل'}! لَقَدْ اشْتَقْتُ إليكْ! ${lastLesson ? `هَلْ تَذْكُرُ أَيْنَ كُنَّا؟ لَقَدْ وَصَلْنَا فِي الْمَرَّةِ الْمَاضِيَةِ إِلَى ${lastLesson}. مَا رَأْيُكَ؟ هَلْ نُكْمِلُ الْدَّرْسَ الْيَوْمَ؟` : 'مَاذَا تُحِبُّ أَنْ نَتَعَلَّمَ الْيَوْمَ؟'}`;
            console.log('👋 [GREETING] Returning visit greeting:', message);
            return {
                type: 'returning_visit',
                message: message
            };
        }
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
        
        // تحويل الأرقام الإنجليزية إلى عربية تلقائياً
        let processedKey = convertToArabicNumerals(key);
        let normalizedKey = processedKey.trim().replace(/[ًٌٍَُِّْ]/g, '').toLowerCase();

        // ============================================================================
        // 1️⃣ التحقق من أشكال الحروف المختلفة (بداية/وسط/نهاية)
        // ============================================================================
        if (ARABIC_LETTER_FORMS[normalizedKey]) {
            console.log(`📐 [DRAW] Found letter form: ${normalizedKey}`);
            return ARABIC_LETTER_FORMS[normalizedKey];
        }

        // ============================================================================
        // 2️⃣ التحقق من الرموز الرياضية مباشرة
        // ============================================================================
        if (DRAWING_LIBRARY[normalizedKey]) {
            console.log(`🔢 [DRAW] Found math symbol or number: ${normalizedKey}`);
            return DRAWING_LIBRARY[normalizedKey];
        }

        // ============================================================================
        // 3️⃣ معالجة الكلمات العربية (قاموس الترجمة)
        // ============================================================================
        const dictionary = {
            'تفاحة': 'تفاحة', 'تفاحه': 'تفاحة',
            'شجرة': 'شجرة', 'شجره': 'شجرة',
            'بيت': 'بيت', 'منزل': 'منزل',
            'سيارة': 'سيارة', 'سياره': 'سيارة',
            'كرة': 'كرة', 'كره': 'كرة',
            'زهرة': 'زهرة', 'وردة': 'وردة',
            'شمس': 'شمس',
            'نجمة': 'نجمة', 'نجمه': 'نجمة',
            'وجه': 'وجه', 'مبتسم': 'مبتسم',
            // إضافة الكلمات الإنجليزية
            'apple': 'تفاحة',
            'tree': 'شجرة',
            'house': 'بيت',
            'car': 'سيارة',
            'ball': 'كرة',
            'flower': 'زهرة',
            'sun': 'شمس',
            'star': 'نجمة',
            'smile': 'وجه'
        };

        if (dictionary[normalizedKey]) {
            const mappedKey = dictionary[normalizedKey];
            if (DRAWING_LIBRARY[mappedKey]) {
                console.log(`🎨 [DRAW] Found shape via dictionary: ${normalizedKey} → ${mappedKey}`);
                return DRAWING_LIBRARY[mappedKey];
            }
        }

        // ============================================================================
        // 4️⃣ معالجة صيغة "letter_x" من Gemini
        // ============================================================================
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
            if (englishToArabic[char]) {
                console.log(`🔤 [DRAW] Converted letter_${char} → ${englishToArabic[char]}`);
                return englishToArabic[char];
            }
        }

        // ============================================================================
        // 5️⃣ معالجة أسماء الحروف بالإنجليزية (بدون letter_)
        // ============================================================================
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
        if (letterNames[normalizedKey]) {
            console.log(`🔤 [DRAW] Converted letter name: ${normalizedKey} → ${letterNames[normalizedKey]}`);
            return letterNames[normalizedKey];
        }

        // ============================================================================
        // 6️⃣ إرجاع الحروف العربية المفردة كنص (بدون SVG)
        // ============================================================================
        if (/^[\u0600-\u06FF]$/.test(normalizedKey)) {
            console.log(`✍️ [DRAW] Single Arabic letter as text: ${normalizedKey}`);
            return normalizedKey;
        }

        // ============================================================================
        // 7️⃣ محاولة أخيرة: البحث في المكتبات بالحرف الأول
        // ============================================================================
        if (normalizedKey.length === 1) {
            const firstChar = normalizedKey.charAt(0);
            if (ARABIC_ALPHABET_PATHS[firstChar]) {
                console.log(`📝 [DRAW] Found in ARABIC_ALPHABET_PATHS: ${firstChar}`);
                return ARABIC_ALPHABET_PATHS[firstChar];
            }
            if (DRAWING_LIBRARY[firstChar]) {
                console.log(`📝 [DRAW] Found in DRAWING_LIBRARY: ${firstChar}`);
                return DRAWING_LIBRARY[firstChar];
            }
        }

        console.log(`⚠️ [DRAW] No drawing found for: ${key}, returning null (will render as text)`);
        return null; // Return null so the UI can decide (e.g. render as text)
    }

    /**
     * تحضير النص للنطق: تحويل الرموز الرياضية والأرقام إلى نص عربي
     */
    prepareTextForSpeech(text) {
        if (!text) return '';
        
        // 1. تحويل الرموز الرياضية إلى كلمات عربية
        let processedText = convertMathSymbolsToArabic(text);
        
        // 2. تحويل الأرقام الإنجليزية إلى عربية (لنطق أفضل)
        processedText = convertToArabicNumerals(processedText);
        
        // 3. تنظيف النص من الأكواد والرموز غير المرغوبة
        processedText = this.cleanForTTS(processedText);
        
        console.log(`🎙️ [TTS-PREP] Original: "${text}"`);
        console.log(`🎙️ [TTS-PREP] Prepared: "${processedText}"`);
        
        return processedText;
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
                voiceText: this.prepareTextForSpeech(aiRawText)
            };
        } catch (error) {
            console.error('❌ [AIService] Chat Error:', error.message || error);
            return { text: "لَمْ أَسْمَعْكَ جَيِّدًا.", action: "listening" };
        }
    }
}

// ============================================================================
// 📤 تصدير الخدمة والدوال المساعدة
// ============================================================================
export const aiService = new AIService();

// تصدير الدوال المساعدة للاستخدام في ملفات أخرى
export {
    convertToArabicNumerals,
    convertToEnglishNumerals,
    convertMathSymbolsToArabic,
    ARABIC_ALPHABET_PATHS,
    ARABIC_LETTER_FORMS,
    DRAWING_LIBRARY
};
