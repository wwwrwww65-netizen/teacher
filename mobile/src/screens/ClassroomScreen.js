import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    StatusBar,
    Platform,
    PermissionsAndroid,
    ImageBackground,
    Dimensions,
    TextInput,
    KeyboardAvoidingView,
    Modal,
    I18nManager,
    Animated,
    ScrollView
} from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Teacher3D from '../components/avatar/Teacher3D';
import ChalkboardWhiteboard from '../components/ChalkboardWhiteboard';
import HandwritingModal from '../components/HandwritingModal';
import Voice from '@react-native-voice/voice';
import { aiService } from '../services/AIService';
import arabicVoiceService from '../services/ArabicVoiceService';
import { musicService } from '../services/MusicService';
import { soundService } from '../services/SoundService';
import { theme } from '../config/theme';
import BouncyButton from '../components/BouncyButton';
import BackgroundMusic from '../components/BackgroundMusic';
import { WebView } from 'react-native-webview';
import geminiLiveService from '../services/GeminiLiveService';
import { LIVE_AUDIO_HTML } from '../services/LiveAudioBridge';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import GlobalAudioService from '../services/GlobalAudioService';
import { curriculumSearchService } from '../services/CurriculumSearchService';

const { width, height } = Dimensions.get('window');

// Helper function to normalize Arabic text for comparison
const normalize = (text) => {
    if (!text) return '';
    return text
        .replace(/[ًٌٍَُِّْ]/g, '') // Remove diacritics
        .replace(/[أإآ]/g, 'ا') // Normalize alif
        .replace(/ة/g, 'ه') // Normalize taa marbuta
        .replace(/ى/g, 'ي') // Normalize alif maqsura
        .replace(/[*_#~]/g, '') // Strip markdown formatting symbols
        .toLowerCase()
        .trim();
};

const resolveArabicLetter = (input) => {
    if (!input) return null;
    const raw = String(input).trim();
    // 🔢 Allow numbers (Arabic/English) to pass through as-is
    if (/^[\d\u0660-\u0669]+$/.test(raw)) return raw;
    if (raw.length === 1) return raw;

    const cleaned = normalize(raw).replace(/[^ء-ي0-9]/g, '');

    const map = {
        'الالف': 'أ', 'الف': 'أ',
        'الباء': 'ب', 'باء': 'ب',
        'التاء': 'ت', 'تاء': 'ت',
        'الثاء': 'ث', 'ثاء': 'ث',
        'الجيم': 'ج', 'جيم': 'ج',
        'الحاء': 'ح', 'حاء': 'ح',
        'الخاء': 'خ', 'خاء': 'خ',
        'الدال': 'د', 'دال': 'د',
        'الذال': 'ذ', 'ذال': 'ذ',
        'الراء': 'ر', 'راء': 'ر',
        'الزاي': 'ز', 'زاي': 'ز',
        'السين': 'س', 'سين': 'س',
        'الشين': 'ش', 'شين': 'ش',
        'الصاد': 'ص', 'صاد': 'ص',
        'الضاد': 'ض', 'ضاد': 'ض',
        'الطاء': 'ط', 'طاء': 'ط',
        'الظاء': 'ظ', 'ظاء': 'ظ',
        'العين': 'ع', 'عين': 'ع',
        'الغين': 'غ', 'غين': 'غ',
        'الفاء': 'ف', 'فاء': 'ف',
        'القاف': 'ق', 'قاف': 'ق',
        'الكاف': 'ك', 'كاف': 'ك',
        'اللام': 'ل', 'لام': 'ل',
        'الميم': 'م', 'ميم': 'م',
        'النون': 'ن', 'نون': 'ن',
        'الهاء': 'ه', 'هاء': 'ه',
        'الواو': 'و', 'واو': 'و',
        'الياء': 'ي', 'ياء': 'ي'
    };

    return map[cleaned] || (cleaned.startsWith('ال') ? (map[cleaned.slice(2)] || null) : null);
};

// 🌟 قائمة شاملة للإيموجي (Comprehensive Emoji Map)
const EMOJI_MAP = {
    // 👤 أعضاء الجسم (Body Parts)
    'عين': '👁️', 'عيون': '👀',
    'يد': '✋', 'ايد': '✋', 'يدين': '👐',
    'راس': '🗣️', 'رأس': '🗣️',
    'اذن': '👂', 'أذن': '👂', 'اذان': '👂',
    'انف': '👃', 'أنف': '👃',
    'فم': '👄',
    'قدم': '🦶', 'رجل': '🦵',
    'قلب': '❤️',
    'دماغ': '🧠',
    
    // 🦁 حيوانات (Animals)
    'اسد': '🦁', 'أسد': '🦁',
    'ارنب': '🐰', 'أرنب': '🐰',
    'قطة': '🐱', 'قطه': '🐱', 'هر': '🐱',
    'كلب': '🐶',
    'فيل': '🐘',
    'جمل': '🐫', 'ناقة': '🐫', 'ناقه': '🐫',
    'حصان': '🐎', 'فرس': '🐴',
    'بقرة': '🐄', 'بقره': '🐄',
    'خروف': '🐑', 'غنم': '🐑',
    'دجاجة': '🐔', 'دجاجه': '🐔', 'فرخة': '🐔',
    'بطة': '🦆', 'بطه': '🦆',
    'سمكة': '🐟', 'سمكه': '🐟', 'سمك': '🐠',
    'عصفور': '🐦', 'طائر': '🐦', 'طير': '🐦',
    'فراشة': '🦋', 'فراشه': '🦋',
    'نحلة': '🐝', 'نحله': '🐝',
    'نملة': '🐜', 'نمله': '🐜',
    'عنكبوت': '🕷️',
    'ثعبان': '🐍',
    'تمساح': '🐊',
    'سلحفاة': '🐢', 'سلحفاه': '🐢',
    'ضفدع': '🐸',
    'قرد': '🐵',
    'دب': '🐻',
    'باندا': '🐼',
    'كنغر': '🦘',
    'زرافة': '🦒', 'زرافه': '🦒',
    'حمار': '🐴',
    'خنزير': '🐷',
    'فار': '🐭', 'فأر': '🐭',
    
    // 🍎 فواكه (Fruits)
    'تفاح': '🍎', 'تفاحة': '🍎', 'تفاحه': '🍎',
    'موز': '🍌', 'موزة': '🍌', 'موزه': '🍌',
    'برتقال': '🍊', 'برتقالة': '🍊', 'برتقاله': '🍊',
    'ليمون': '🍋', 'ليمونة': '🍋', 'ليمونه': '🍋',
    'عنب': '🍇',
    'فراولة': '🍓', 'فراوله': '🍓',
    'كرز': '🍒',
    'خوخ': '🍑',
    'مانجو': '🥭',
    'اناناس': '🍍', 'أناناس': '🍍',
    'بطيخ': '🍉',
    'شمام': '🍈',
    'كيوي': '🥝',
    'رمان': '🍎',
    
    // 🥕 خضروات (Vegetables)
    'جزر': '🥕',
    'طماطم': '🍅', 'بندورة': '🍅', 'بندوره': '🍅',
    'خيار': '🥒',
    'باذنجان': '🍆',
    'بطاطس': '🥔', 'بطاطا': '🥔',
    'ذرة': '🌽',
    'فلفل': '🌶️',
    'بصل': '🧅',
    'ثوم': '🧄',
    'خس': '🥬',
    
    // 🌳 طبيعة (Nature)
    'شجرة': '🌳', 'شجره': '🌳',
    'زهرة': '🌸', 'زهره': '🌸', 'وردة': '🌹', 'ورده': '🌹',
    'شمس': '☀️',
    'قمر': '🌙',
    'نجمة': '⭐', 'نجمه': '⭐', 'نجم': '⭐',
    'سحابة': '☁️', 'سحابه': '☁️', 'غيمة': '☁️', 'غيمه': '☁️',
    'مطر': '🌧️',
    'برق': '⚡',
    'رعد': '⛈️',
    'ثلج': '❄️',
    'ريح': '💨', 'رياح': '💨',
    'ماء': '💧',
    'بحر': '🌊',
    'جبل': '⛰️',
    'نار': '🔥',
    'ارض': '🌍', 'أرض': '🌍',
    
    // 🚗 مواصلات (Transportation)
    'سيارة': '🚗', 'سياره': '🚗',
    'حافلة': '🚌', 'حافله': '🚌', 'باص': '🚌',
    'قطار': '🚂',
    'طائرة': '✈️', 'طائره': '✈️',
    'سفينة': '🚢', 'سفينه': '🚢',
    'دراجة': '🚲', 'دراجه': '🚲', 'بسكليت': '🚲',
    'دراجة نارية': '🏍️', 'دراجه ناريه': '🏍️',
    'شاحنة': '🚚', 'شاحنه': '🚚',
    'اسعاف': '🚑', 'إسعاف': '🚑',
    'شرطة': '🚓', 'شرطه': '🚓',
    'اطفاء': '🚒', 'إطفاء': '🚒',
    'صاروخ': '🚀',
    
    // 🏠 أشياء ومباني (Objects & Buildings)
    'بيت': '🏠', 'منزل': '🏠',
    'مدرسة': '🏫', 'مدرسه': '🏫',
    'مسجد': '🕌',
    'كنيسة': '⛪', 'كنيسه': '⛪',
    'مستشفى': '🏥',
    'كرة': '⚽', 'كره': '⚽',
    'ساعة': '⌚', 'ساعه': '⌚',
    'قلم': '✏️',
    'كتاب': '📖',
    'حقيبة': '🎒', 'حقيبه': '🎒', 'شنطة': '🎒', 'شنطه': '🎒',
    'مفتاح': '🔑',
    'باب': '🚪',
    'نافذة': '🪟', 'نافذه': '🪟', 'شباك': '🪟',
    'كرسي': '🪑',
    'طاولة': '🪑', 'طاوله': '🪑',
    'سرير': '🛏️',
    'مصباح': '💡',
    'هاتف': '📱',
    'حاسوب': '💻',
    'تلفاز': '📺',
    'كاميرا': '📷',
    'علم': '🚩',
    
    // 🍕 طعام (Food)
    'خبز': '🍞',
    'جبن': '🧀',
    'بيضة': '🥚', 'بيضه': '🥚', 'بيض': '🥚',
    'لحم': '🍖',
    'دجاج': '🍗',
    'بيتزا': '🍕',
    'همبرغر': '🍔',
    'ساندويش': '🥪',
    'حلوى': '🍬',
    'كعكة': '🍰', 'كعكه': '🍰',
    'ايس كريم': '🍦', 'آيس كريم': '🍦', 'بوظة': '🍦', 'بوظه': '🍦',
    'شوكولاتة': '🍫', 'شوكولاته': '🍫',
    'عسل': '🍯',
    'حليب': '🥛',
    'ماء': '💧',
    'عصير': '🧃',
    'شاي': '🍵',
    'قهوة': '☕', 'قهوه': '☕',
    
    // 😊 مشاعر ووجوه (Emotions & Faces)
    'وجه': '😊',
    'سعيد': '😊', 'سعيدة': '😊', 'سعيده': '😊',
    'حزين': '😢', 'حزينة': '😢', 'حزينه': '😢',
    'غاضب': '😠', 'غاضبة': '😠', 'غاضبه': '😠',
    'ضحك': '😂',
    'حب': '😍',
    'نوم': '😴',
    'مريض': '🤒', 'مريضة': '🤒', 'مريضه': '🤒',
    
    // 🎨 ألوان (Colors - مع رموز تعبيرية)
    'احمر': '🔴', 'أحمر': '🔴',
    'ازرق': '🔵', 'أزرق': '🔵',
    'اخضر': '🟢', 'أخضر': '🟢',
    'اصفر': '🟡', 'أصفر': '🟡',
    'برتقالي': '🟠',
    'بنفسجي': '🟣',
    'اسود': '⚫', 'أسود': '⚫',
    'ابيض': '⚪', 'أبيض': '⚪',
    
    // 👦 أشخاص (People)
    'ولد': '👦',
    'بنت': '👧',
    'رجل': '👨',
    'امراة': '👩', 'إمرأة': '👩', 'امرأة': '👩',
    'طفل': '👶',
    'عائلة': '👨‍👩‍👧‍👦', 'عائله': '👨‍👩‍👧‍👦',
    
    // 🎵 أنشطة وهوايات (Activities)
    'كرة قدم': '⚽',
    'كرة سلة': '🏀',
    'موسيقى': '🎵', 'موسيقا': '🎵',
    'رسم': '🎨',
    'قراءة': '📖', 'قراءه': '📖',
};

// 🌟 دالة إضافة الإيموجي تلقائياً (Auto Emoji Enrichment)
const enrichWithEmoji = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // تحقق إذا كان النص يحتوي على إيموجي بالفعل
    if (/\p{Emoji}/u.test(text)) return text;
    
    // تطبيع النص للمقارنة
    const normalizedInput = normalize(text);
    
    // 1. بحث دقيق (Exact Match)
    for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
        if (normalizedInput === normalize(key)) {
            return `${text} ${emoji}`;
        }
    }
    
    // 2. بحث جزئي (Partial Match) - إذا كان النص يحتوي على الكلمة
    for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
        if (normalizedInput.includes(normalize(key))) {
            return `${text} ${emoji}`;
        }
    }
    
    return text;
};

const ClassroomScreen = ({ navigation, route }) => {
    const avatarRef = useRef(null);
    const whiteboardRef = useRef(null);
    const currentTargetLetterRef = useRef(null);

    // استلام بيانات الدرس والمنهج (إذا وجدت)
    // استلام بيانات الدرس والمنهج والصور
    const { lessonType, curriculumContent, lessonTitle, lessonImages } = route.params || {};
    const lessonImagesRef = useRef(lessonImages || []); // 📸 Store images in ref
    const curriculumContentRef = useRef(curriculumContent);
    const lessonTypeRef = useRef(lessonType);
    const lessonTitleRef = useRef(lessonTitle);

    useEffect(() => {
        if (curriculumContent) {
            console.log('📚 [CLASSROOM] Curriculum Content Received:', { 
                type: lessonType, 
                title: lessonTitle,
                contentLength: curriculumContent.length 
            });
        }
    }, [curriculumContent]);

    const [status, setStatus] = useState('initializing');
    const statusRef = useRef('initializing');
    const [transcript, setTranscript] = useState('');
    const [isMicActive, setIsMicActive] = useState(false);
    const [userName, setUserName] = useState('يا بطل');
    const transcriptScrollRef = useRef(null);
    const [isLiveMode, setIsLiveMode] = useState(true);
    const isLiveModeRef = useRef(true);
    const isMountedRef = useRef(true); // 🛡️ Track mount state to prevent zombies
    const liveAudioBridgeRef = useRef(null);
    const justFinishedTaskRef = useRef(false); // New: preventing praise re-triggers

    // 🎵 Control Global Background Music
    useEffect(() => {
        // Stop global music when entering classroom
        GlobalAudioService.stopAppBackgroundMusic();
        
        return () => {
            // Resume global music when leaving classroom
            GlobalAudioService.playAppBackgroundMusic();
        };
    }, []);

    useEffect(() => { isLiveModeRef.current = isLiveMode; }, [isLiveMode]);

    const updateStatus = (newStatus) => {
        console.log(`📡 Status Transition: ${statusRef.current} -> ${newStatus}`);
        statusRef.current = newStatus;
        setStatus(newStatus);
    };

    // Mute/Listen State
    const [isMuted, setIsMuted] = useState(false);
    const isMutedRef = useRef(false);

    useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

    // Keyboard State
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const [inputText, setInputText] = useState('');
    // 📷 Camera State
    const [isCameraActive, setIsCameraActive] = useState(false);

    const [isWritingModalVisible, setIsWritingModalVisible] = useState(false);
    const isWritingModalRef = useRef(false);
    const [writingLetter, setWritingLetter] = useState('أ');
    const lastSmartQuizContextRef = useRef(null);

    useEffect(() => {
        isWritingModalRef.current = isWritingModalVisible;
        if (isWritingModalVisible) {
            console.log('✍️ [WRITE-MODAL] visible in classroom', { writingLetter });
        } else {
            console.log('✍️ [WRITE-MODAL] hidden in classroom');
        }
    }, [isWritingModalVisible, writingLetter]);

    // 🆕 Load User Profile from AIService
    useEffect(() => {
        const loadUserProfile = async () => {
            if (aiService.userProfile?.name) {
                console.log('👤 [CLASSROOM] Loaded user name:', aiService.userProfile.name);
                setUserName(aiService.userProfile.name);
            }
        };
        loadUserProfile();
    }, []);

    const [drawingIntent, setDrawingIntent] = useState(null);
    const lastQuizOptionsRef = useRef(null);
    const pendingQuizRef = useRef(false);
    const pendingWritingRef = useRef(false);

    // --- Unified Speech Events ---
    useEffect(() => {
        const handleFinish = () => {
            // 🛑 SECURITY CHECK: If user interrupted, DO NOT auto-resume mic!
            if (isInterruptedRef.current) {
                console.log('🛑 [VOICE-LISTENER] Interrupted. Ignoring onFinish (Mic remains muted).');
                return;
            }

            console.log('✅ Speech/TTS Finished speaking.');
            avatarRef.current?.stopTalking();

            // IMPORTANT: Tell Live Service we are done speaking so it un-mutes the mic upstream
            if (geminiLiveService) {
                geminiLiveService.isSpeaking = false;
                console.log('🔊 [LIVE-MIC] isSpeaking reset to FALSE. Mic should accept input now.');
            }

            if (statusRef.current === 'speaking' || isLiveModeRef.current) {
                if (!isLiveModeRef.current) updateStatus('listening');

                if (pendingWritingRef.current) {
                    setIsWritingModalVisible(true);
                    pendingWritingRef.current = false;
                    // IMPORTANT: Pause mic immediately in Live mode (don't wait for useEffect)
                    if (isLiveModeRef.current && geminiLiveService) {
                        geminiLiveService.pauseMic();
                        console.log('✍️ [LIVE-MIC] Paused immediately for writing modal');
                    }
                } else if (pendingQuizRef.current) {
                    setIsSelectionModalVisible(true);
                    pendingQuizRef.current = false;
                    // IMPORTANT: Pause mic immediately for Quiz too
                    if (isLiveModeRef.current && geminiLiveService) {
                        geminiLiveService.pauseMic();
                        console.log('🎯 [LIVE-MIC] Paused immediately for quiz modal');
                    }
                }
            }
        };

        const voiceListener = { onFinish: handleFinish };
        arabicVoiceService.addListener(voiceListener);

        return () => {
            arabicVoiceService.removeListener(voiceListener);
        };
    }, []);

    // --- Interactive Selection Choice Logic ---
    const [isSelectionModalVisible, setIsSelectionModalVisible] = useState(false);
    const isSelectionModalVisibleRef = useRef(false);
    const [selectionOptions, setSelectionOptions] = useState([]);
    const [correctAnswer, setCorrectAnswer] = useState(null);

    useEffect(() => {
        isSelectionModalVisibleRef.current = isSelectionModalVisible;
        if (isSelectionModalVisible) {
            console.log('🎯 [QUIZ-MODAL] opened', { options: selectionOptions, correctAnswer });
        } else {
            console.log('🎯 [QUIZ-MODAL] closed');
        }
    }, [isSelectionModalVisible, selectionOptions, correctAnswer]);

    // NEW: Track status of EACH option individually { "OptionA": "wrong", "OptionB": "idle" }
    const [optionStates, setOptionStates] = useState({});
    const quizErrorCounter = useRef(0);



    const setupLiveMode = async (overrideName, overrideGrade) => {
        updateStatus('thinking');
        isLiveModeRef.current = true; // LOCK IMMEDIATELY

        try {
            // 🆕 Disconnect existing session if any (to allow restart with new curriculum)
            if (geminiLiveService.isConnected || geminiLiveService.isConnecting) {
                console.log('🔄 [LIVE] Disconnecting existing session for restart...');
                geminiLiveService.disconnect();
                // Wait a bit for the socket to actually close and state to settle
                await new Promise(r => setTimeout(r, 800));
            }

            // KILL OLD VOICE COMPLETELY
            await arabicVoiceService.cancel();
            try {
                await Voice.stop();
                Voice.removeAllListeners(); // IMPORTANT: Wipe old system listeners
                await Voice.destroy();
            } catch (e) { }

            // 🧠 بدء جلسة جديدة في الذاكرة
            aiService.startNewSession();

            const finalName = overrideName || userName;
            const finalGrade = overrideGrade || aiService.userProfile.grade;
            const finalAge = aiService.userProfile.age || '6';
            
            // تحضير سياق المنهج (إذا وجد)
            const curriculumContext = curriculumContentRef.current ? {
                content: curriculumContentRef.current,
                title: lessonTitleRef.current,
                type: lessonTypeRef.current
            } : null;

            console.log('🔗 Connecting to Gemini with:', { finalName, finalGrade, finalAge, hasCurriculum: !!curriculumContext });
            
            await geminiLiveService.connect(finalName, finalGrade, finalAge, curriculumContext);
            
            // 📸 Send Images if available AND no pre-existing curriculum content
            // (If curriculumContent exists, it likely already includes the image analysis)
            if (lessonImagesRef.current && lessonImagesRef.current.length > 0 && !curriculumContentRef.current) {
                console.log('📸 [CLASSROOM] Found attached images (without curriculum), sending to AI...', lessonImagesRef.current.length);
                setTimeout(() => {
                    geminiLiveService.sendImages(lessonImagesRef.current);
                }, 2000);
            } else if (lessonImagesRef.current && lessonImagesRef.current.length > 0 && curriculumContentRef.current) {
                console.log('✅ [CLASSROOM] Images attached but skipping Live-Send because Curriculum Content is present (Pre-analyzed).');
            }

            // Force Audio Unlock
            setTimeout(() => {
                if (liveAudioBridgeRef.current) {
                    liveAudioBridgeRef.current.injectJavaScript(`
                        if (document.getElementById('authBtn')) document.getElementById('authBtn').click();
                    `);
                }
            }, 1000);

            geminiLiveService.onAudioData = (base64) => {
                console.log('🔊 [BRIDGE] Sending audio to WebView, length:', base64?.length || 0);
                if (liveAudioBridgeRef.current) {
                    liveAudioBridgeRef.current.postMessage(JSON.stringify({ type: 'audio', data: base64 }));
                } else {
                    console.log('❌ [BRIDGE] WebView ref is null!');
                }
                avatarRef.current?.startTalking();
            };

            geminiLiveService.onIncrementalText = (partialText) => {
                // نكتفي بتسجيله في السجل ولا نعرضه على الشاشة فوراً
                console.log('🛰️ [LIVE-STREAM] Buffering...');
                // setTranscript(partialText);
            };

            geminiLiveService.onContentReceived = async (text) => {
                if (!isMountedRef.current) {
                    console.log('🛑 [LIVE] Component unmounted, ignoring received content.');
                    return;
                }
                console.log('🚀 [LIVE-HYBRID] Full Text Ready. Starting Sync-Speech.');
                console.log('🎤 [TEACHER-RECEIVED] Teacher received content to speak:', text.substring(0, 150) + (text.length > 150 ? '...' : ''));
                console.log('📢 [TEACHER-RECEIVED] Full content received:', text);
                setTranscript("");

                try {
                    geminiLiveService.pauseMic();
                    await new Promise(r => setTimeout(r, 200));
                    const rawText = text.trim();
                    
                    // ⚡ CRITICAL FIX: ابدأ تحميل الصوت فوراً (Pre-warm)
                    // هذا يحدث بالتوازي مع معالجة النص!
                    // نقوم بتنظيف شامل لجميع الأدوات بما فيها markLessonComplete
                    const cleanToolsRegex = /\s*`?(?:drawOnBoard|askToWrite|showQuiz|markLessonComplete)\s*\([^)]*\)\s*`?/gi;
                    const prewarmText = rawText.replace(cleanToolsRegex, ' ').trim();
                    
                    let audioPreloadPromise = null;
                    if (prewarmText.length > 10) {
                        console.log('⚡ [TTS-PREWARM] Starting audio download in background...');
                        // نستخدم دالة prepareTextForTTS أيضاً لضمان نظافة تامة قبل الإرسال
                        const ultraSafeText = prepareTextForTTS(prewarmText);
                        
                        audioPreloadPromise = arabicVoiceService.fetchGoogleTTS(ultraSafeText)
                            .then(audio => ({ audioContent: audio, text: ultraSafeText }))
                            .catch(e => {
                                console.warn('⚠️ [TTS-PREWARM] Failed:', e);
                                return null;
                            });
                    }
                    
                    // 🧹 Clean tool calls from text before displaying/TTS
                    let cleanText = rawText.replace(cleanToolsRegex, ' ').trim();
                    console.log('🧹 [CLEAN] Removed tool calls including markLessonComplete. Raw len:', rawText.length, 'Clean len:', cleanText.length);
                    
                    const normalizedText = normalize(cleanText);
                    const skipSmartTriggersThisTurn = justFinishedTaskRef.current;
                    if (skipSmartTriggersThisTurn) {
                        console.log('🌈 [DEBOUNCE] Skipping SMART triggers in onContentReceived for praise turn.');
                    }

                    const lessonParenMatch = normalizedText.match(/حرف[^\(]{0,24}\(([^)]+)\)/);
                    if (lessonParenMatch?.[1]) {
                        const lessonChar = resolveArabicLetter(lessonParenMatch[1]);
                        if (lessonChar) {
                            currentTargetLetterRef.current = lessonChar;
                            console.log('📘 [LESSON] current letter set:', { lessonName: lessonParenMatch[1], lessonChar });
                            
                            // 🧠 تحديث الذاكرة بآخر درس
                            aiService.updateLastLesson(`حرف ${lessonParenMatch[1]}`, 'تعلم الحروف');
                        }
                    }
                    const containsDrawText = /drawOnBoard/i.test(cleanText);
                    const containsQuizText = /showQuiz/i.test(cleanText);
                    const containsWriteText = /askToWrite/i.test(cleanText);
                    let fallbackDrawTriggered = false;
                    let fallbackQuizTriggered = false;
                    let fallbackWriteTriggered = false;

                    const quizDebounceOverride =
                        skipSmartTriggersThisTurn &&
                        (
                            containsQuizText ||
                            normalizedText.includes('اختبر') ||
                            normalizedText.includes('سؤال') ||
                            normalizedText.includes('اختر') ||
                            normalizedText.includes('الاجابة الصحيحة') ||
                            normalizedText.includes('الإجابة الصحيحة') ||
                            normalizedText.includes('اختر الاجابة') ||
                            normalizedText.includes('اختر الإجابة')
                        );

                    if ((!skipSmartTriggersThisTurn || quizDebounceOverride) && !fallbackQuizTriggered) {
                        let effectiveText = cleanText;
                        let effectiveNormalized = normalizedText;

                        const prevQuizContext = lastSmartQuizContextRef.current;
                        const looksLikeContinuation = cleanText.length <= 40 && !normalizedText.includes('سؤال') && !normalizedText.includes('هل هي');

                        if (prevQuizContext && looksLikeContinuation) {
                            effectiveText = `${prevQuizContext.text} ${cleanText}`;
                            effectiveNormalized = normalize(effectiveText);
                        }

                        const hasQuizIntent =
                            effectiveNormalized.includes('اختبر') ||
                            effectiveNormalized.includes('سؤال') ||
                            effectiveNormalized.includes('اختر') ||
                            effectiveNormalized.includes('هل هي') ||
                            effectiveNormalized.includes('ايهما') ||
                            effectiveNormalized.includes('أيّهما') ||
                            effectiveNormalized.includes('من بين');

                        if (hasQuizIntent) {
                            if (quizDebounceOverride) {
                                console.log('🌈 [DEBOUNCE-OVERRIDE] SMART quiz triggered despite praise debounce.');
                            }
                            let searchText = effectiveText;
                            const intentIndex = effectiveNormalized.lastIndexOf('هل هي');
                            if (intentIndex !== -1) {
                                searchText = effectiveText.slice(intentIndex);
                            } else {
                                const qIndex = effectiveText.lastIndexOf('؟');
                                if (qIndex !== -1 && qIndex + 1 < effectiveText.length) {
                                    searchText = effectiveText.slice(qIndex + 1);
                                }
                            }

                            const positionMatch = effectiveNormalized.match(/اين\s+يظهر\s+حرف\s*\(([^)]+)\)\s*في\s+كلمه\s*\(([^)]+)\)/);
                            if (positionMatch) {
                                const letterName = (positionMatch[1] || '').trim();
                                const wordRaw = (positionMatch[2] || '').trim();
                                const letterChar = resolveArabicLetter(letterName) || letterName.charAt(0) || '';
                                const normalizedWord = normalize(wordRaw).replace(/[^ء-ي]/g, '');
                                const normalizedLetter = normalize(letterChar).replace(/[^ء-ي]/g, '');
                                const letterIndex = normalizedLetter ? normalizedWord.indexOf(normalizedLetter) : -1;
                                const options = ['في أول الكلمة', 'في وسط الكلمة', 'في آخر الكلمة'];
                                let fallbackAnswer = 'في الكلمة';

                                if (letterIndex === 0) {
                                    fallbackAnswer = 'في أول الكلمة';
                                } else if (letterIndex === normalizedWord.length - 1 && letterIndex !== -1) {
                                    fallbackAnswer = 'في آخر الكلمة';
                                } else if (letterIndex > 0) {
                                    fallbackAnswer = 'في وسط الكلمة';
                                }

                                fallbackQuizTriggered = true;
                                setSelectionOptions(options);
                                setCorrectAnswer(fallbackAnswer);
                                pendingQuizRef.current = true;
                                console.log('🎯 [SMART-FALLBACK] Position quiz detected:', { letterName, letterChar, wordRaw, normalizedWord, options, fallbackAnswer });
                                lastSmartQuizContextRef.current = null;
                            } else {
                                const optionsRaw = [];
                                const parenRegex = /\(([^)]+)\)/g;
                                let match;
                                while ((match = parenRegex.exec(searchText)) !== null) {
                                    const opt = (match[1] || '').trim();
                                    if (!opt) continue;
                                    if (opt.length > 30) continue;
                                    if (!optionsRaw.includes(opt)) optionsRaw.push(opt);
                                }

                                const lessonLetter = currentTargetLetterRef.current || '';
                                const filteredOptions = optionsRaw.filter(opt => {
                                    const normalizedOpt = normalize(opt).replace(/[^ء-ي]/g, '');
                                    if (!normalizedOpt) return false;
                                    if (lessonLetter) {
                                        const resolvedFromOpt = resolveArabicLetter(opt);
                                        if (resolvedFromOpt && resolvedFromOpt === lessonLetter) {
                                            return false;
                                        }
                                    }
                                    return true;
                                });

                                if (filteredOptions.length >= 2 && filteredOptions.length <= 4) {
                                    const fallbackAnswer = filteredOptions[0];
                                    fallbackQuizTriggered = true;
                                    setSelectionOptions(filteredOptions);
                                    setCorrectAnswer(fallbackAnswer);
                                    pendingQuizRef.current = true;
                                    console.log('🎯 [SMART-FALLBACK] Quiz detected from text:', { optionsCount: filteredOptions.length, options: filteredOptions, fallbackAnswer });
                                    lastSmartQuizContextRef.current = null;
                                } else {
                                    // 🚀 NEW: Handle vague "What is this letter?" questions with auto-generated options
                                    const vagueQuestionKeywords = ['المشار اليه', 'المشار إليه', 'ما هو الحرف', 'اي حرف', 'أي حرف'];
                                    const isVagueQuestion = vagueQuestionKeywords.some(kw => effectiveNormalized.includes(normalize(kw)));
                                    
                                    if (isVagueQuestion) {
                                        const currentLetter = currentTargetLetterRef.current || 'أ'; // Default fallback
                                        console.log('🎯 [SMART-FALLBACK] Vague question detected via keywords. Auto-generating quiz for:', currentLetter);
                                        
                                        // Generate distractions based on alphabet proximity or random
                                        const alphabet = ['أ','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','ه','و','ي'];
                                        const distractors = alphabet.filter(c => c !== currentLetter).sort(() => 0.5 - Math.random()).slice(0, 2);
                                        const autoOptions = [currentLetter, ...distractors].sort(() => 0.5 - Math.random());
                                        
                                        fallbackQuizTriggered = true;
                                        setSelectionOptions(autoOptions);
                                        setCorrectAnswer(currentLetter);
                                        pendingQuizRef.current = true;
                                        lastSmartQuizContextRef.current = null;
                                    } else {
                                        lastSmartQuizContextRef.current = { text: effectiveText };
                                    }
                                }
                            }
                        } else {
                            lastSmartQuizContextRef.current = { text: effectiveText };
                        }
                    }

                    // 🔧 FALLBACK: Detect tool calls written as text and execute them
                    // drawOnBoard detection (Use rawText to catch the code before cleaning)
                    const drawMatch = rawText.match(/`?drawOnBoard\s*\(\s*item\s*=\s*(?:(["'])(.*?)\1|([^)\s]+))\s*\)`?/i);
                    const matchedItem = drawMatch ? (drawMatch[2] || drawMatch[3]) : null;

                    if (matchedItem) {
                        console.log('🎨 [FALLBACK] Detected drawOnBoard as text, executing:', matchedItem);
                        
                        // 🔍 Debug: Check if emoji is present
                        const hasEmoji = /\p{Emoji}/u.test(matchedItem);
                        const charCodes = Array.from(matchedItem).map(c => `${c}(U+${c.codePointAt(0).toString(16).toUpperCase()})`).join(' ');
                        console.log('🔍 [EMOJI-DEBUG] Has Emoji:', hasEmoji);
                        console.log('🔍 [EMOJI-DEBUG] Character breakdown:', charCodes);
                        
                        fallbackDrawTriggered = true;
                        let item = matchedItem;

                        const letterNameMap = {
                            'alif': 'أ', 'alef': 'أ', 'ba': 'ب', 'baa': 'ب', 'ta': 'ت', 'taa': 'ت',
                            'tha': 'ث', 'thaa': 'ث', 'jim': 'ج', 'jeem': 'ج', 'ha': 'ح', 'haa': 'ح',
                            'kha': 'خ', 'khaa': 'خ', 'dal': 'د', 'daal': 'د', 'dhal': 'ذ', 'dhaal': 'ذ',
                            'ra': 'ر', 'raa': 'ر', 'zay': 'ز', 'zayn': 'ز', 'seen': 'س', 'sin': 'س',
                            'sheen': 'ش', 'shin': 'ش', 'sad': 'ص', 'saad': 'ص', 'dad': 'ض', 'daad': 'ض',
                            'tah': 'ط', 'dhah': 'ظ', 'ayn': 'ع', 'ain': 'ع', 'ghayn': 'غ', 'ghain': 'غ',
                            'fa': 'ف', 'faa': 'ف', 'qaf': 'ق', 'qaaf': 'ق', 'kaf': 'ك', 'kaaf': 'ك',
                            'lam': 'ل', 'laam': 'ل', 'meem': 'م', 'mim': 'م', 'noon': 'ن', 'nun': 'ن',
                            'hah': 'ه', 'waw': 'و', 'ya': 'ي', 'yaa': 'ي'
                        };

                        if (item.startsWith('letter_')) item = item.replace('letter_', '');
                        const resolvedFromTool = letterNameMap[item.toLowerCase()] || item;

                        let finalItem = resolvedFromTool;
                        
                        // 🌟 ENRICHMENT: Add Emoji if applicable
                        finalItem = enrichWithEmoji(finalItem);
                        
                        const currentLessonLetter = currentTargetLetterRef.current;

                        if (currentLessonLetter && typeof resolvedFromTool === 'string' && resolvedFromTool.length === 1) {
                            const normalizedLesson = normalize(currentLessonLetter).replace(/[^ء-ي]/g, '');
                            const normalizedTool = normalize(resolvedFromTool).replace(/[^ء-ي]/g, '');

                            if (normalizedLesson && normalizedTool && normalizedLesson !== normalizedTool) {
                                console.log('🎨 [FALLBACK] drawOnBoard letter conflict detected. Using lesson letter instead.', {
                                    toolLetter: resolvedFromTool,
                                    lessonLetter: currentLessonLetter
                                });
                                finalItem = currentLessonLetter;
                            } else {
                                currentTargetLetterRef.current = resolvedFromTool;
                            }
                        }

                        console.log('🎨 [FALLBACK] Resolved to:', finalItem);
                        
                        // 🔢 عرض كل شي كنص (no SVG at all!)
                        console.log('📝 [FALLBACK] Displaying as plain text:', finalItem);
                        const drawData = null;  // Always use text, never SVG
                        
                        // ✅ إذا لم يتم إيجاد رسم SVG، نعرض النص مباشرةً
                        if (!drawData) {
                            console.log('⚠️ [FALLBACK] No SVG drawing found, displaying as text:', finalItem);
                        }
                        
                        avatarRef.current?.walkToBoard();
                        setTimeout(() => {
                            whiteboardRef.current?.write(drawData || finalItem, { count: 1, duration: 3000 });
                        }, 1200);
                    }

                    // 🎨 SMART FALLBACK: Detect natural language drawing intents
                    // عندما يقول النموذج "رسمته لك على السبورة" بدون استخدام الأداة
                    // 🔧 تم تحسينه: لا يُفعّل إلا إذا كان هناك محتوى واضح للرسم
                    if (!drawMatch && !skipSmartTriggersThisTurn) {
                        const normalizedText = normalize(cleanText);
                        
                        // الكلمات التي تدل على نية الرسم الفعلي (وليس مجرد ذكر السبورة)
                        const strongDrawKeywords = [
                            'رسمت', 'سارسم', 'ارسم لك', 'شكل الحرف', 'هذا هو حرف',
                            'سأكتب', 'ساكتب', 'ساقوم بكتابة'
                        ];
                        
                        // الكلمات الضعيفة: تحتاج لمحتوى واضح بجانبها
                        const weakDrawKeywords = [
                            'على السبوره', 'على اللوح', 'انظر للسبوره', 'السبورة', 'اللوحة', 'السبوره', 'الى السبوره'
                        ];
                        
                        const hasStrongDrawIntent = strongDrawKeywords.some(kw => normalizedText.includes(normalize(kw)));
                        const hasWeakDrawIntent = weakDrawKeywords.some(kw => normalizedText.includes(normalize(kw)));
                        
                        // 🔧 شرط جديد: يجب أن يكون هناك محتوى واضح للرسم
                        // إما نية قوية، أو نية ضعيفة + ذكر حرف/رقم/كائن/كلمة محددة
                        const hasSpecificContent = 
                            /\(([^)]+)\)/.test(cleanText) || 
                            /[""]([^""]+)[""]/.test(cleanText) ||
                            /حرف\s+(?:ال)?([ء-ي])/.test(normalizedText) ||
                            /(?:ال)?رقم[\s\u064a\u064b\u064c\u064d\u064e\u064f\u0650]+([\u0660-\u06690-9]+)/.test(cleanText) ||  // 🔧 Improved: allows diacritics between 'رقم' and number
                            /(?:ال)?رقم[\s\u064a\u064b\u064c\u064d\u064e\u064f\u0650]+(واحد|اثنان|اثنين|ثلاثة|اربعة|اربعه|خمسة|خمسه|ستة|سته|سبعة|سبعه|ثمانية|ثمانيه|تسعة|تسعه|عشرة|عشره|صفر)/.test(normalizedText) ||  // 🔧 Improved: added ـه endings
                            /(?:ال)?كلمة\s+([ء-ي]+)/.test(normalizedText);
                        
                        // 🆕 كشف ذكي للرياضيات: إذا ذكرت السبورة + عملية حسابية بدون تفاصيل
                        const hasDrawIntent = hasStrongDrawIntent || (hasWeakDrawIntent && hasSpecificContent);

                        if (hasDrawIntent) {
                            // استخراج اسم الحرف من النص
                            const letterNameMap = {
                                'الالف': 'أ', 'الف': 'أ', 'الباء': 'ب', 'باء': 'ب', 'التاء': 'ت', 'تاء': 'ت',
                                'الثاء': 'ث', 'ثاء': 'ث', 'الجيم': 'ج', 'جيم': 'ج', 'الحاء': 'ح', 'حاء': 'ح',
                                'الخاء': 'خ', 'خاء': 'خ', 'الدال': 'د', 'دال': 'د', 'الذال': 'ذ', 'ذال': 'ذ',
                                'الراء': 'ر', 'راء': 'ر', 'الزاي': 'ز', 'زاي': 'ز', 'السين': 'س', 'سين': 'س',
                                'الشين': 'ش', 'شين': 'ش', 'الصاد': 'ص', 'صاد': 'ص', 'الضاد': 'ض', 'ضاد': 'ض',
                                'الطاء': 'ط', 'طاء': 'ط', 'الظاء': 'ظ', 'ظاء': 'ظ', 'العين': 'ع', 'عين': 'ع',
                                'الغين': 'غ', 'غين': 'غ', 'الفاء': 'ف', 'فاء': 'ف', 'القاف': 'ق', 'قاف': 'ق',
                                'الكاف': 'ك', 'كاف': 'ك', 'اللام': 'ل', 'لام': 'ل', 'الميم': 'م', 'ميم': 'م',
                                'النون': 'ن', 'نون': 'ن', 'الهاء': 'ه', 'هاء': 'ه', 'الواو': 'و', 'واو': 'و',
                                'الياء': 'ي', 'ياء': 'ي'
                            };

                            let foundLetter = null;

                            // 1. البحث عن كائنات شائعة (Common Objects) أولاً
                            const commonObjectsMap = {
                                'تفاحة': 'apple', 'تفاحه': 'apple', 'شجرة': 'tree', 'شجره': 'tree',
                                'بيت': 'house', 'منزل': 'house', 'سيارة': 'car', 'سياره': 'car',
                                'كرة': 'ball', 'كره': 'ball', 'زهرة': 'flower', 'وردة': 'flower',
                                'شمس': 'sun', 'نجمة': 'star', 'نجمه': 'star', 'وجه': 'smile', 'مبتسم': 'smile',
                                'جمل': 'camel', 'ناقة': 'camel', 'فيل': 'elephant', 'بطة': 'duck', 'بطه': 'duck'
                            };

                            for (const [name, key] of Object.entries(commonObjectsMap)) {
                                if (normalizedText.includes(normalize(name))) {
                                    foundLetter = key;
                                    console.log('🎨 [SMART-FALLBACK] Found object:', name, '->', key);
                                    break;
                                }
                            }

                            // 2. إذا لم نجد كائناً، نبحث عن اسم الحرف بشكل دقيق
                            // نستخدم regex مع word boundaries لتجنب المطابقات الخاطئة
                            // مثل: "مثالاً" لا يجب أن تُطابق "لام"
                            if (!foundLetter) {
                                for (const [name, letter] of Object.entries(letterNameMap)) {
                                    // 🔧 البحث عن اسم الحرف ككلمة مستقلة فقط
                                    // يجب أن يكون مسبوقاً ومتبوعاً بمسافة أو بداية/نهاية النص
                                    const escapedName = normalize(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                    const wordBoundaryRegex = new RegExp(`(?:^|\\s|حرف\\s*)${escapedName}(?:\\s|$|[،.!؟])`, 'i');
                                    
                                    if (wordBoundaryRegex.test(normalizedText)) {
                                        foundLetter = letter;
                                        console.log('🎨 [SMART-FALLBACK] Found letter name:', name, '->', letter);
                                        break;
                                    }
                                }
                            }

                            // 3. البحث عن أسماء الأرقام بالعربية
                            if (!foundLetter) {
                                const numberNameMap = {
                                    'واحد': '١', 'اثنان': '٢', 'اثنين': '٢', 
                                    'ثلاثة': '٣', 'ثلاثه': '٣',
                                    'اربعة': '٤', 'اربعه': '٤',
                                    'خمسة': '٥', 'خمسه': '٥',
                                    'ستة': '٦', 'سته': '٦',
                                    'سبعة': '٧', 'سبعه': '٧',
                                    'ثمانية': '٨', 'ثمانيه': '٨',
                                    'تسعة': '٩', 'تسعه': '٩',
                                    'عشرة': '١٠', 'عشره': '١٠', 
                                    'صفر': '٠'
                                };
                                
                                for (const [name, number] of Object.entries(numberNameMap)) {
                                    const escapedName = normalize(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                    const wordBoundaryRegex = new RegExp(`(?:^|\\s|رقم\\s*)${escapedName}(?:\\s|$|[،.!؟])`, 'i');
                                    
                                    if (wordBoundaryRegex.test(normalizedText)) {
                                        foundLetter = number;
                                        console.log('🔢 [SMART-FALLBACK] Found number name:', name, '->', number);
                                        break;
                                    }
                                }
                            }

                            // 4. البحث عن أي رقم عربي مفرد في النص (فولباك)
                            // إذا وجدنا "انظر للسبورة" + رقم مفرد
                            if (!foundLetter && (hasWeakDrawIntent || normalizedText.includes('انظر') || normalizedText.includes('السبورة'))) {
                                const singleNumberMatch = cleanText.match(/([\u0660-\u0669])(?![\u0660-\u0669])/);  // رقم واحد فقط
                                if (singleNumberMatch) {
                                    foundLetter = singleNumberMatch[1];
                                    console.log('🔢 [SMART-FALLBACK] Found standalone Arabic number:', foundLetter);
                                }
                            }

                            // 5. البحث عن معادلات رياضية (Math Equations)
                            // يدعم الأرقام العربية والإنجليزية: ١ + ١ = ٢ أو 1 + 1 = 2
                            if (!foundLetter) {
                                const mathRegex = /([\u0660-\u06690-9]+(?:\s*[\+\-×÷\/]\s*[\u0660-\u06690-9]+)+(:?\s*=\s*[\u0660-\u06690-9?]+)?)/;
                                const mathMatch = cleanText.match(mathRegex);
                                if (mathMatch && mathMatch[0]) {
                                    foundLetter = mathMatch[0].trim();
                                    console.log('🎨 [SMART-FALLBACK] Found math equation:', foundLetter);
                                }
                            }

                            // 6. البحث عن أي نص بين أقواس () أو علامات تنصيص ""
                            // هذا يسمح بكتابة أي كلمة مثل: (أسد)، (أحبك)، "مدرسة"
                            if (!foundLetter) {
                                const quotedText = cleanText.match(/[\(\["'`](.*?)[\)\]"'`]/);
                                if (quotedText && quotedText[1]) {
                                    const extracted = quotedText[1].trim();
                                    if (extracted.length > 0 && extracted.length < 50) {
                                        foundLetter = extracted;
                                        console.log('🎨 [SMART-FALLBACK] Found general text to write:', foundLetter);
                                    }
                                }
                            }

                            if (foundLetter) {
                                console.log('🎨 [SMART-FALLBACK] Drawing detected letter:', foundLetter);
                                if (typeof foundLetter === 'string' && foundLetter.length === 1) {
                                    currentTargetLetterRef.current = foundLetter;
                                }
                                
                                // 🔢 عرض كل شي كنص (no SVG at all!)
                                console.log('📝 [SMART-FALLBACK] Displaying as plain text:', foundLetter);
                                const drawData = null;  // Always use text, never SVG
                                
                                // ✅ إذا لم يتم إيجاد رسم SVG، نعرض النص مباشرةً
                                if (!drawData) {
                                    console.log('⚠️ [SMART-FALLBACK] No SVG drawing found, displaying as text:', foundLetter);
                                }
                                
                                avatarRef.current?.walkToRight();
                                setTimeout(() => {
                                    // 🔧 If it's a list (comma separated), slow down drawing
                                    const isList = foundLetter.includes('،') || foundLetter.includes(',');
                                    whiteboardRef.current?.write(drawData || foundLetter, { 
                                        count: 1, 
                                        duration: isList ? 5000 : 3000 
                                    });
                                }, 1200);
                                fallbackDrawTriggered = true;
                            }
                        }

                        // 🔍 SAFETY NET: كشف قوائم الأرقام/الحروف إذا نسيت المعلمة استدعاء الأداة
                        // النمط المستهدف: "١، ٢، ٣" أو "أ، ب، ت" مسبوق بكلمات مثل "سأكتب" أو "انظر"
                        if (!fallbackDrawTriggered && !fallbackWriteTriggered) {
                            const listMatch = cleanText.match(/((?:[0-9٠-٩]+|['"]?[a-zA-Zء-ي]['"]?)(?:\s*[،,]\s*(?:[0-9٠-٩]+|['"]?[a-zA-Zء-ي]['"]?)){2,})/);
                            const hasContext = normalizedText.includes('ساكتب') || normalizedText.includes('سأكتب') || normalizedText.includes('انظر') || normalizedText.includes('لنشاهد');
                            
                            if (listMatch && hasContext) {
                                const listContent = listMatch[0];
                                console.log('🎨 [SMART-FALLBACK] Detected list pattern context:', listContent);
                                avatarRef.current?.walkToRight();
                                setTimeout(() => {
                                    whiteboardRef.current?.write(listContent, { count: 1, duration: 5000 });
                                }, 1200);
                                fallbackDrawTriggered = true;
                            }
                        }
                    }

                    if (skipSmartTriggersThisTurn && !fallbackWriteTriggered && !pendingQuizRef.current && !isSelectionModalVisibleRef.current) {
                        const trainMatch =
                            normalizedText.match(/نتدرب على كتابه[^\(]{0,24}\(([^)]+)\)/) ||
                            normalizedText.match(/نتدرب على كتابة[^\(]{0,24}\(([^)]+)\)/);
                        if (trainMatch?.[1]) {
                            const requested = trainMatch[1];
                            const requestedChar = resolveArabicLetter(requested);
                            const effectiveLetter = currentTargetLetterRef.current || requestedChar || 'أ';
                            console.log('✍️ [SMART-FALLBACK] Scheduling writing after praise:', { requested, effectiveLetter });
                            fallbackWriteTriggered = true;
                            setWritingLetter(effectiveLetter);
                            pendingWritingRef.current = true;
                        } else {
                            const strongWriteMatch =
                                normalizedText.match(/اكتب\s+الحرف[^\(]{0,24}\(([^)]+)\)/) ||
                                normalizedText.match(/اكتبي\s+الحرف[^\(]{0,24}\(([^)]+)\)/);
                            if (strongWriteMatch?.[1]) {
                                const requested = strongWriteMatch[1];
                                const requestedChar = resolveArabicLetter(requested);
                                const effectiveLetter = currentTargetLetterRef.current || requestedChar || 'أ';
                                console.log('✍️ [SMART-FALLBACK] Explicit write after praise:', { requested, effectiveLetter });
                                fallbackWriteTriggered = true;
                                setWritingLetter(effectiveLetter);
                                pendingWritingRef.current = true;
                            }
                        }
                    }

                    if (!fallbackWriteTriggered && !skipSmartTriggersThisTurn && !fallbackQuizTriggered && !pendingQuizRef.current && !isSelectionModalVisibleRef.current) {
                        // 🔍 تحسين ذكي: استبعاد صيغ المتكلم (أنا) لتجنب الخلط مع الرسم على السبورة
                        // مثال: "سأكتب لك" يجب ألا تفتح نافذة الكتابة.
                        const isSelfreferential = 
                            normalizedText.includes('سأكتب') || 
                            normalizedText.includes('ساكتب') ||
                            normalizedText.includes('سأقوم بكتابة') ||
                            normalizedText.includes('دعني اكتب') ||
                            normalizedText.includes('انظر كيف اكتب');

                        const hasWriteIntent = !isSelfreferential && (
                            /(^|\s)اكتب(\s|$)/.test(normalizedText) || // "اكتب" كلمة كاملة فقط
                            /(^|\s)اكتبي(\s|$)/.test(normalizedText) ||
                            normalizedText.includes('دورك') ||
                            normalizedText.includes('بقلمك') ||
                            normalizedText.includes('بإصبعك') ||
                            normalizedText.includes('حاول أن تكتب') ||
                            normalizedText.includes('جرب أن تكتب') ||
                            normalizedText.includes('هيا نكتب') // "هيا نكتب" عادة تعني دعوة للطالب
                        );

                        const hasLetterMention =
                            normalizedText.includes('حرف') ||
                            normalizedText.includes('رقم') ||
                            /\(([^)]+)\)/.test(cleanText) ||
                            /[""]([^""]+)[""]/.test(cleanText) ||  // علامات تنصيص عربية
                            /"([^"]+)"/.test(cleanText);           // علامات تنصيص إنجليزية

                        if (hasWriteIntent && hasLetterMention) {
                            // 🔧 محسّن: استخراج الحرف/الرقم من مصادر متعددة
                            let extracted = null;
                            
                            // 1. البحث في الأقواس
                            const parenMatch = cleanText.match(/\(([^)]+)\)/);
                            if (parenMatch?.[1]) extracted = parenMatch[1].trim();
                            
                            // 2. البحث في علامات التنصيص العربية ""
                            if (!extracted) {
                                const arabicQuoteMatch = cleanText.match(/[""]([^""]+)[""]/);
                                if (arabicQuoteMatch?.[1]) extracted = arabicQuoteMatch[1].trim();
                            }
                            
                            // 3. البحث في علامات التنصيص الإنجليزية ""
                            if (!extracted) {
                                const englishQuoteMatch = cleanText.match(/"([^"]+)"/);
                                if (englishQuoteMatch?.[1]) extracted = englishQuoteMatch[1].trim();
                            }
                            
                            // 4. البحث عن "الرقم X" أو "رقم X"
                            if (!extracted) {
                                const numberMatch = normalizedText.match(/(?:ال)?رقم\s+([٠-٩0-9])/);
                                if (numberMatch?.[1]) extracted = numberMatch[1];
                            }
                            
                            // 5. البحث عن "حرف X"
                            if (!extracted) {
                                const letterMatch = normalizedText.match(/حرف\s+(ال)?([ء-ي])/);
                                if (letterMatch?.[2]) extracted = letterMatch[2];
                            }
                            
                            // ⚠️ قيد صارم: لا تفتح النافذة إلا إذا تم استخراج محتوى صريح
                            if (extracted) {
                                const requestedChar = resolveArabicLetter(extracted) || extracted;
                                
                                console.log('✍️ [SMART-FALLBACK] askToWrite intent detected:', { 
                                    extracted, 
                                    requestedChar, 
                                    source: 'text_extraction_verified'
                                });
                                
                                fallbackWriteTriggered = true;
                                setWritingLetter(requestedChar);
                                pendingWritingRef.current = true;
                            } else {
                                console.log('⚠️ [SMART-FALLBACK] Write intent detected but NO specific content found in text. Ignoring to prevent hallucination.');
                            }
                        }
                    }

                    // showQuiz detection (Use rawText)
                    const quizMatch = rawText.match(/`?showQuiz\s*\(\s*question\s*=\s*['"]([^'"]+)['"]\s*,\s*options\s*=\s*\[([^\]]+)\]\s*,\s*answer\s*=\s*['"]([^'"]+)['"]\s*\)`?/i);
                    if (quizMatch) {
                        console.log('🎯 [FALLBACK] Detected showQuiz as text, executing...');
                        fallbackQuizTriggered = true;
                        const question = quizMatch[1];
                        const optionsStr = quizMatch[2];
                        const answer = quizMatch[3];
                        const options = optionsStr.split(',').map(o => o.replace(/['"]/g, '').trim());

                        setSelectionOptions(options);
                        setCorrectAnswer(answer);
                        pendingQuizRef.current = true;

                        // 🧠 FIX: إذا كان النص المنطوق لا يحتوي على السؤال (الذكاء الاصطناعي "نسي" قراءته)، نقوم بدمجه قسراً.
                        // نتجنب التكرار إذا كان السؤال موجوداً بالفعل.
                        if (cleanText.length < 40 && !cleanText.includes(question) && !normalizedText.includes(normalize(question))) {
                            console.log('🗣️ [SMART-SPEECH] Injecting missed quiz question into speech.');
                            cleanText = `${question} ${cleanText}`;
                        }
                    }

                    // askToWrite detection (Use rawText)
                    const writeMatch =
                        rawText.match(/`?askToWrite\s*\(\s*letter\s*=\s*['"]?([^'")\s]+)['"]?\s*\)`?/i) ||
                        rawText.match(/askToWrite\s*\(\s*\{\s*letter\s*:\s*['"]([^'"]+)['"]\s*\}\s*\)/i);
                    if (writeMatch && writeMatch[1]) {
                        const requestedLetter = writeMatch[1];
                        // Try to resolve standard letter name first
                        let requestedChar = resolveArabicLetter(requestedLetter);
                        
                        // If strict resolution failed, but input is a specific Arabic char/word, use it directly
                        if (!requestedChar && requestedLetter && /^[\u0600-\u06FF\s]+$/.test(requestedLetter)) {
                             requestedChar = requestedLetter.trim();
                        }

                        // PRIORITY FIX: Use tool's requested char FIRST. Only fallback to ref if tool arg was invalid.
                        const effectiveLetter = requestedChar || currentTargetLetterRef.current || 'أ';
                        
                        console.log('✍️ [FALLBACK] Detected askToWrite as text, executing:', { requestedLetter, effectiveLetter });
                        fallbackWriteTriggered = true;
                        setWritingLetter(effectiveLetter);
                        pendingWritingRef.current = true;
                    }

                    if (containsDrawText && !fallbackDrawTriggered) {
                        console.log('🧩 [LIVE-HYBRID] drawOnBoard text detected but pattern did not match', { textSnippet: cleanText.slice(0, 120) });
                    }
                    if (containsQuizText && !fallbackQuizTriggered) {
                        console.log('🧩 [LIVE-HYBRID] showQuiz text detected but pattern did not match', { textSnippet: cleanText.slice(0, 120) });
                    }
                    if (containsWriteText && !fallbackWriteTriggered) {
                        console.log('🧩 [LIVE-HYBRID] askToWrite text detected but pattern did not match', { textSnippet: cleanText.slice(0, 120) });
                    }

                    if (!fallbackDrawTriggered && !fallbackQuizTriggered && !fallbackWriteTriggered &&
                        !pendingQuizRef.current && !pendingWritingRef.current) {
                        console.log('🧩 [LIVE-HYBRID] No tools or fallbacks detected for this turn', { textLength: cleanText.length });
                    }

                    // ⚡ استخدام الصوت المُحمّل مسبقاً إذا كان موجوداً
                    let preloadedAudio = null;
                    if (audioPreloadPromise) {
                        const result = await audioPreloadPromise;
                        if (result && result.audioContent) {
                            console.log('⚡ [TTS-PRELOAD] Audio ready! Saved ~2 seconds.');
                            preloadedAudio = result.audioContent;
                        }
                    }

                    // نطق النص مع تفعيل التزامن "كلمة بكلمة"
                    await speakResponse({
                        text: cleanText,
                        voiceText: cleanText,
                        action: 'speaking',
                        emotion: 'happy',
                        preloadedAudio: preloadedAudio // ⚡ تمرير الصوت المُحمّل
                    });
                } catch (e) {
                    console.error('❌ [LIVE-HYBRID] Error:', e);
                } finally {
                    // Only resume if we aren't about to open a modal (Writing/Quiz)
                    setTimeout(() => {
                        // 🛑 SECURITY CHECK: If unmounted, do nothing
                        if (!isMountedRef.current) {
                             console.log('🛑 [AUTO-RESUME] Aborted: Component unmounted.');
                             return;
                        }

                        // Check ALL modal states (Writing & Quiz) + Pending flags
                        if (!isWritingModalRef.current && !pendingWritingRef.current &&
                            !pendingQuizRef.current && !isSelectionModalVisibleRef.current) {
                            
                            // 🛑 Check if User Manually Muted
                            if (!userManuallyMutedMicRef.current) {
                                console.log('🎤 [AUTO-RESUME] Resuming Mic (Normal Flow)...');
                                geminiLiveService.resumeMic();
                                setIsMicActive(true);
                                updateStatus('listening');
                            } else {
                                console.log('🤐 [AUTO-RESUME] Skipped: User Manually Muted Mic');
                                updateStatus('ready');
                            }

                        } else {
                            console.log('🔇 [LIVE-HYBRID] Keeping mic paused for pending/active modal');
                        }
                    }, 400);
                }
            };

            geminiLiveService.onToolCall = (name, args) => {
                let safeArgs = args;
                if (typeof safeArgs === 'string') {
                    try {
                        safeArgs = JSON.parse(safeArgs);
                    } catch (e) {
                        safeArgs = {};
                    }
                }

                console.log('🛠️ Gemini Live Action:', name, safeArgs);

                if (name === 'showQuiz') {
                    console.log('🎯 [LIVE] Quiz pending - will show after speech finishes.');
                    setSelectionOptions(Array.isArray(safeArgs.options) ? safeArgs.options : []);
                    setCorrectAnswer(safeArgs.answer);
                    pendingQuizRef.current = true; // Use pending ref to sync with end of speech
                }

                if (name === 'drawOnBoard') {
                    const item = safeArgs.item;
                    const drawData = aiService.getDrawData(item);
                    if (typeof item === 'string' && item.length === 1) {
                        currentTargetLetterRef.current = item;
                    }
                    avatarRef.current?.walkToRight();
                    setTimeout(() => {
                        whiteboardRef.current?.write(drawData || item, { count: 1, duration: 3000 });
                    }, 1200);
                }

                if (name === 'askToWrite') {
                    if (pendingQuizRef.current || isSelectionModalVisibleRef.current) {
                        console.log('✍️ [LIVE] askToWrite ignored because quiz is active.');
                        return;
                    }
                    const requestedLetter = safeArgs.letter;
                    const requestedChar = resolveArabicLetter(requestedLetter);
                    const effectiveLetter = currentTargetLetterRef.current || requestedChar || 'أ';
                    console.log('✍️ [LIVE] Asking to write:', { requestedLetter, effectiveLetter });
                    setWritingLetter(effectiveLetter);
                    pendingWritingRef.current = true;
                }
            };

            // HANDLE DISCONNECTS (e.g. Network drop, Timeouts)
            geminiLiveService.onDisconnect = () => {
                console.log('🔌 Gemini Live Disconnected unexpectedly.');
                if (isLiveModeRef.current) {
                    setIsLiveMode(false);
                    updateStatus('idle');
                    setIsMicActive(false);
                    // Optional: Try to reconnect automatically after 2s?
                    // setTimeout(() => setIsLiveMode(true), 2000); 
                }
            };

            updateStatus('listening');
            setIsMicActive(true);
        } catch (e) {
            console.error('Failed to connect to Live API:', e);
            setIsLiveMode(false);
        }
    };

    // --- Analytics Logging (Placeholder) ---
    const logAnalyticsEvent = (eventName, payload) => {
        const event = {
            event: eventName,
            timestamp: Date.now(),
            studentId: "local-student-1", // Placeholder
            grade: "KG1", // Should ideally come from props or context
            ...payload
        };
        console.log('📊 ANALYTICS EVENT:', JSON.stringify(event, null, 2));
    };

    const handleOptionSelect = (option) => {
        // QUIZ MODE VALIDATION
        console.log('🎯 [QUIZ-MODAL] option selected', { option, correctAnswer });
        if (correctAnswer) {
            if (option === correctAnswer) {
                // ✅ CORRECT
                setOptionStates(prev => ({ ...prev, [option]: 'correct' }));
                soundService.playSuccess();

                logAnalyticsEvent('choice_selected', {
                    questionId: 'current-quiz', // Placeholder ID
                    selected: option,
                    correct: true,
                    attempts: quizErrorCounter.current + 1
                });

                quizErrorCounter.current = 0; // Reset counter

                setTimeout(() => {
                    setIsSelectionModalVisible(false);
                    setCorrectAnswer(null);
                    setOptionStates({}); // Clear states
                    pendingQuizRef.current = false; // Reset pending flag

                    // Enable protection for the praise turn
                    justFinishedTaskRef.current = true;

                    geminiLiveService.sendText(`✅ أحسنت! الإجابة صحيحة: "${option}". الآن احتفلي به بحماس وشجعيه وانتقلي لسؤال جديد أو درس آخر!`);
                }, 1000);
            } else {
                // ❌ WRONG (Persistent Red)
                setOptionStates(prev => ({ ...prev, [option]: 'wrong' }));
                soundService.playFailure();
                quizErrorCounter.current += 1;

                logAnalyticsEvent('choice_selected', {
                    questionId: 'current-quiz',
                    selected: option,
                    correct: false,
                    attempts: quizErrorCounter.current
                });

                // 🧠 Smart Error Handler: If 2 consecutive errors -> Trigger Explain
                if (quizErrorCounter.current >= 2) {
                    console.log('🚨 2 Consecutive Errors - Triggering Breakdown...');

                    logAnalyticsEvent('explain_triggered', {
                        reason: 'two_wrong_attempts',
                        questionId: 'current-quiz'
                    });

                    setTimeout(() => {
                        setIsSelectionModalVisible(false);
                        setCorrectAnswer(null);
                        setOptionStates({});
                        quizErrorCounter.current = 0;
                        pendingQuizRef.current = false; // Reset pending flag

                        geminiLiveService.sendText(`❌ الطفل أخطأ مرتين في الاختبار (آخر إجابة: "${option}"). لا بأس! الآن اشرحي له الدرس بطريقة مختلفة وارسمي على السبورة بأمثلة واضحة ليفهم الفكرة!`);
                    }, 500);
                }
            }
            return;
        }

        // NORMAL SELECTION MODE (Generic)
        setOptionStates(prev => ({ ...prev, [option]: 'selected' }));
        soundService.playPop();
        setTimeout(() => {
            setIsSelectionModalVisible(false);
            setOptionStates({});
            pendingQuizRef.current = false; // Reset pending flag
            geminiLiveService.sendText(`لقد اختار الطفل: ${option}`);
        }, 500);
    };

    const renderSelectionModal = () => {
        if (!isSelectionModalVisible) return null;

        return (
            <Modal
                transparent={true}
                visible={isSelectionModalVisible}
                animationType="fade"
                onRequestClose={() => { }}
            >
                <View style={styles.selectionOverlay}>
                    <View style={styles.selectionContainer}>
                        <Text style={styles.selectionTitle}>
                            {correctAnswer ? "اختبر ذكاءك! أين الإجابة؟ 🧐" : "اختر ماذا تريد يا بطل! 🤔"}
                        </Text>
                        <View style={styles.optionsWrapper}>
                            {selectionOptions.map((opt, index) => {
                                const status = optionStates[opt] || 'idle';
                                let cardStyle = styles.optionCard;
                                let icon = null;

                                if (status === 'correct') {
                                    cardStyle = [styles.optionCard, { backgroundColor: '#C8E6C9', borderColor: '#4CAF50' }];
                                    icon = <Text style={{ fontSize: 24, marginLeft: 10 }}>✅</Text>;
                                } else if (status === 'wrong') {
                                    cardStyle = [styles.optionCard, { backgroundColor: '#FFCDD2', borderColor: '#F44336' }];
                                    icon = <Text style={{ fontSize: 24, marginLeft: 10 }}>❌</Text>;
                                } else if (status === 'selected') {
                                    cardStyle = [styles.optionCard, { backgroundColor: '#FFF9C4', borderColor: '#FFEB3B' }];
                                }

                                return (
                                    <BouncyButton
                                        key={index}
                                        onPress={() => handleOptionSelect(opt)}
                                        style={[cardStyle, { flexDirection: 'row', justifyContent: 'center' }]}
                                    >
                                        <Text style={styles.optionText}>{opt}</Text>
                                        {icon}
                                    </BouncyButton>
                                );
                            })}
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    useEffect(() => {
        isWritingModalRef.current = isWritingModalVisible;
        if (isWritingModalVisible) {
            console.log('✍️ Writing Modal Open: Soft-Pausing Mic...');
            // setIsMicActive(false); // ⚠️ Removed to prevent Re-render killing Audio
        } else {
            console.log('✍️ Writing Modal Closed: Resuming check...');
            // Resume mic check
            if (isLiveModeRef.current && geminiLiveService && !isMutedRef.current) {
                 if (!userManuallyMutedMicRef.current) {
                    geminiLiveService.resumeMic();
                    setIsMicActive(true);
                 }
            }
        }
    }, [isWritingModalVisible, isLiveMode]);

    // 🆕 QUIZ MODAL MIC CONTROL
    useEffect(() => {
        if (isSelectionModalVisible) {
            console.log('🎯 Quiz Modal Open: Soft-Pausing Mic (Teacher continues)...');
            // setIsMicActive(false); // ⚠️ Removed to prevent Re-render killing Audio
        } else {
            console.log('🎯 Quiz Modal Closed: Resuming check...');
            if (!isWritingModalRef.current && isLiveModeRef.current && geminiLiveService && !isMutedRef.current) {
                 if (!userManuallyMutedMicRef.current) {
                    geminiLiveService.resumeMic();
                    setIsMicActive(true);
                 }
            }
        }
    }, [isSelectionModalVisible, isLiveMode]);

    // ⌨️ KEYBOARD MODAL MIC CONTROL
    useEffect(() => {
        if (isKeyboardOpen) {
            console.log('⌨️ Keyboard Open: Soft-Pausing Mic (Teacher continues)...');
             // setIsMicActive(false); // ⚠️ Removed to prevent Re-render killing Audio
        } else {
            console.log('⌨️ Keyboard Closed: Resuming check...');
            if (isLiveModeRef.current && geminiLiveService && !isMutedRef.current) {
                 if (!userManuallyMutedMicRef.current) {
                    geminiLiveService.resumeMic();
                    setIsMicActive(true);
                 }
            }
        }
    }, [isKeyboardOpen, isLiveMode]);

    useEffect(() => {
        initializeClassroom();
        return () => {
            console.log('🧹 [CLEANUP] Cleaning up ClassroomScreen...');
            isMountedRef.current = false; // 🛡️ Mark as unmounted immediately
            
            // إيقاف جميع الأصوات
            try { arabicVoiceService.stop(); } catch (e) {}
            try { arabicVoiceService.cancel(); } catch (e) {}
            
            // إيقاف Voice Recognition
            try { Voice.stop(); } catch (e) {}
            try { Voice.destroy(); } catch (e) {}
            
            // قطع اتصال Gemini Live
            try { geminiLiveService.disconnect(); } catch (e) {}
            
            // إيقاف WebView Audio
            if (liveAudioBridgeRef.current) {
                try {
                    const stopScript = `
                        if (window.audioContext) { window.audioContext.close(); }
                        if (window.currentSource) { window.currentSource.stop(); }
                        window.audioQueue = [];
                        window.isPlaying = false;
                        true;
                    `;
                    liveAudioBridgeRef.current.injectJavaScript(stopScript);
                } catch (e) {}
            }
            
            console.log('✅ [CLEANUP] ClassroomScreen cleaned up successfully');
        };
    }, []);

    // 🛑 Lock to prevent audio from auto-resuming after interruption
    const isInterruptedRef = useRef(false);
    // 🎤 User Preference: Did user explicitly mute the mic?
    const userManuallyMutedMicRef = useRef(false);

    const toggleMute = async () => {
        // ... (Existing Interrupt Logic for Speaker Button) ...
        // ... (This function stays for the Speaker Button) ...
        // 1. INTERRUPT LOGIC: If teacher is speaking, stop her immediately.
        if (status === 'speaking') {
             // ... logic same as before ...
             console.log('🛑 [INTERRUPT] Stopping Teacher Forcefully & LOCKING...');
             isInterruptedRef.current = true;
             geminiLiveService.sendText(" ");
             if (liveAudioBridgeRef.current) {
                 const stopScript = `
                     if (window.audioContext) { window.audioContext.suspend(); }
                     if (window.currentSource) { window.currentSource.stop(); }
                     window.audioQueue = []; 
                     window.isPlaying = false;
                     true;
                 `;
                 liveAudioBridgeRef.current.injectJavaScript(stopScript);
             }
             try { await arabicVoiceService.cancel(); } catch (e) {}
             
             if (avatarRef.current) {
                 avatarRef.current.stopTalking();
                 avatarRef.current.setEmotion('neutral');
             }
             if (whiteboardRef.current) whiteboardRef.current.clear();
 
             setIsMuted(true);
             geminiLiveService.pauseMic();
             setIsMicActive(false);
             updateStatus('ready'); 
             return;
        }

        // ... Normal Toggle Logic for Speaker Button ...
        const newMuteState = !isMuted;
        setIsMuted(newMuteState);
        if (newMuteState) {
            geminiLiveService.pauseMic();
            setIsMicActive(false);
        } else {
            console.log('🔊 [SPEAKER-BTN] Unmuting Speaker...');
            // Unlock interrupt lock so we can hear teacher later
            isInterruptedRef.current = false; 
            
            // Only auto-resume mic if user didn't manually mute it
            if (!userManuallyMutedMicRef.current) {
                geminiLiveService.resumeMic();
                setIsMicActive(true);
                updateStatus('listening');
            } else {
                console.log('🎤 [AUTO] Mic kept OFF because user manually muted it.');
            }
        }
    };

    // 🎤 NEW: Exclusive Mic Control for Mic Button
    const toggleMicOnly = () => {
        if (isMicActive) {
            console.log('🎤 [MIC-BTN] User Manually Muting Mic...');
            userManuallyMutedMicRef.current = true; // MARK MANUAL MUTE
            geminiLiveService.pauseMic();
            setIsMicActive(false);
            // Optionally update UI to show mic crossed out
        } else {
            console.log('🎤 [MIC-BTN] User Manually Unmuting Mic...');
            userManuallyMutedMicRef.current = false; // UNMARK MANUAL MUTE
            // Unlock interrupt lock if user wants to speak
            isInterruptedRef.current = false; 
            geminiLiveService.resumeMic();
            setIsMicActive(true);
            
            // Should we update status? Ideally yes, if not speaking
            if (status !== 'speaking') {
                updateStatus('listening');
            }
        }
    };

    const requestPermissions = async () => {
        if (Platform.OS === 'android') {
            try {
                // Request ONLY Audio for classroom start
                await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
            } catch (err) {
                console.warn(err);
            }
        }
    };

    const requestCameraPermissions = async () => {
        if (Platform.OS === 'android') {
            try {
                const permissions = [
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                ];
                
                // Add storage permissions for Android 12 and below
                if (Platform.Version < 33) {
                    permissions.push(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
                    permissions.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
                }
                
                await PermissionsAndroid.requestMultiple(permissions);
                return true;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    const initializeClassroom = async () => {
        global.gemini = geminiLiveService;
        await requestPermissions();
        let name = 'بَطَل'; // Default

        try {
            const userDataStr = await AsyncStorage.getItem('nora_memory');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                console.log('📂 Loaded User Profile (Raw):', userData);

                // 1. Sanitize Name immediately
                if (userData.userProfile && userData.userProfile.name) {
                    // eslint-disable-next-line no-misleading-character-class
                    name = userData.userProfile.name.replace(/[^\u0621-\u064A\u064B-\u065F\u0671-\u06D3\u06F0-\u06F9a-zA-Z\s]/g, '').trim();
                }

                // 2. Resolve Grade
                const grade = (userData.userProfile && userData.userProfile.grade) || 'KG1';

                // 3. Update AI Service with verification status
                // We assume if a grade exists in storage and is not default KG1 (or if we explicitly saved it), it's verified.
                // Better: Check a boolean flag if we saved it.
                const isVerified = (userData.userProfile && userData.userProfile.gradeVerified) || (grade !== 'KG1');

                // 3. Update AI Service with FULL profile
                aiService.setUserProfile({
                    ...(userData.userProfile || {}), // Load everything (lastLesson, sessions, etc)
                    name: name,
                    grade: grade,
                    gradeVerified: isVerified
                });

                console.log('✅ AI Service Profile Sync:', aiService.userProfile);

                // 4. Save back cleaned version if changed
                if (userData.userProfile && name !== userData.userProfile.name) {
                    console.log('🧹 Cleaned name on load:', userData.userProfile.name, '->', name);
                    const updatedData = {
                        ...userData,
                        userProfile: { ...userData.userProfile, name, gradeVerified: isVerified }
                    };
                    AsyncStorage.setItem('nora_memory', JSON.stringify(updatedData));
                }
            }
        } catch (e) { console.log('No user profile found', e); }

        setUserName(name);
        await arabicVoiceService.initialize();

        // Launch Gemini Live immediately
        console.log('🚀 Launching Gemini Live...');
        const resolvedGrade = aiService.userProfile.grade || 'KG1';
        setupLiveMode(name, resolvedGrade);
    };





    const letterNamesForTTS = {
        'أ': 'الألف',
        'ا': 'الألف',
        'ب': 'الباء',
        'ت': 'التاء',
        'ث': 'الثاء',
        'ج': 'الجيم',
        'ح': 'الحاء',
        'خ': 'الخاء',
        'د': 'الدال',
        'ذ': 'الذال',
        'ر': 'الراء',
        'ز': 'الزاي',
        'س': 'السين',
        'ش': 'الشين',
        'ص': 'الصاد',
        'ض': 'الضاد',
        'ط': 'الطاء',
        'ظ': 'الظاء',
        'ع': 'العين',
        'غ': 'الغين',
        'ف': 'الفاء',
        'ق': 'القاف',
        'ك': 'الكاف',
        'ل': 'اللام',
        'م': 'الميم',
        'ن': 'النون',
        'ه': 'الهاء',
        'و': 'الواو',
        'ي': 'الياء'
    };

    const looksLikeCodeForChild = (text) => {
        if (!text) return false;
        const base = text.trim();
        if (!base) return false;
        // 🛠️ RELAXED: Removed < > from strict check to avoid false positives on truncated tags or typos.
        // We focus on English letters combined with brackets, keys like "function", "return", or known tool names.
        return /[A-Za-z]+[\[\{]|[\]\}];|["'`]{2,}|showQuiz|drawOnBoard|askToWrite|function|return|optionsCount|fallbackAnswer|options\s*:|question\s*:|answer\s*:/i.test(base);
    };

    const prepareTextForTTS = (text) => {
        if (!text) return '';
        let result = text;
        
        // 0. 🔢 إزالة الأرقام الموجودة بين أقواس لمنع التكرار (مثال: "عشرة (١٠)" -> "عشرة")
        result = result.replace(/\(\s*[\d\u0660-\u0669]+\s*\)/g, '');

        // 1. إزالة أي بقايا للأدوات (Tools)
        result = result.replace(/[a-zA-Z]+\s*\([^)]*\)/g, '');

        // 2. تنظيف Markdown formatting
        result = result.replace(/\*\*([^*]+)\*\*/g, '$1'); // **bold** → bold
        result = result.replace(/\*([^*]+)\*/g, '$1'); // *italic* → italic
        result = result.replace(/_([^_]+)_/g, '$1'); // _underline_ → underline
        result = result.replace(/`([^`]+)`/g, ''); // Remove code blocks completely
        result = result.replace(/^\s*[\*\-]\s+/gm, ''); // * list item → list item
        
        // 3. إزالة الرموز المزعجة للنطق
        result = result.replace(/[*#_~`>]/g, ''); 
        
        // 4. معالجة خاصة للأحرف بين الأقواس (نطقها بدلاً من تجاهلها)
        result = result.replace(/حرف\s*\(\s*([\u0600-\u06FF])\s*\)/g, (m, ch) => {
            const name = letterNamesForTTS[ch] || ch;
            return `حرف ${name}`;
        });
        result = result.replace(/\(\s*([\u0600-\u06FF])\s*\)/g, (m, ch) => {
            const name = letterNamesForTTS[ch] || ch;
            return name;
        });

        // 5. إزالة الأقواس الإنجليزية المتبقية
        result = result.replace(/[(){}[\]]/g, '');

        // 6. ضغط المسافات
        result = result.replace(/\s+/g, ' ').trim();

        return result;
    };

    const speakResponse = async (response) => {
        // 🛑 SECURITY CHECK: If component unmounted, stop immediately
        if (!isMountedRef.current) {
             console.log('🛑 [TTS] Component unmounted, aborting speech.');
             return;
        }

        // 🛑 SECURITY CHECK: If user interrupted, DO NOT start speaking a delayed chunk!
        if (isInterruptedRef.current) {
            console.log('🛑 [INTERRUPT] Blocked speakResponse because user interrupted.');
            return;
        }

        console.log('🔊 [TEACHER-SPEAK] speakResponse called with:', { text: response.text?.substring(0, 100) + (response.text?.length > 100 ? '...' : ''), action: response.action });
        await arabicVoiceService.cancel();
        updateStatus('speaking');

        // 1. Prepare UI Components (Quiz/Board/Emotion)
        if (response.action === 'quiz' && Array.isArray(response.options) && response.options.length > 0) {
            const optionsStr = JSON.stringify(response.options);
            const isDuplicate = lastQuizOptionsRef.current === optionsStr && isSelectionModalVisible;

            if (!isDuplicate) {
                console.log('✨ Quiz Modal Opening (Deferred)', response.options);
                setSelectionOptions(response.options);
                pendingQuizRef.current = true;
                lastQuizOptionsRef.current = optionsStr;
            }
        }

        if (response.emotion) {
            avatarRef.current?.setEmotion(response.emotion);
            if (response.emotion === 'happy') avatarRef.current?.laugh();
        }

        if (response.draw) {
            avatarRef.current?.walkToRight();
            setTimeout(() => {
                const count = response.intent?.count || 1;
                const drawContent = typeof response.draw === 'string' ? response.draw : '';
                whiteboardRef.current?.write(drawContent, {
                    count,
                    duration: drawContent.length > 50 ? 4000 : 2500
                });
            }, 1200);
        }

        // 2. UNIFIED GAPLESS SPEECH 🎤 (Single-Shot Mode)
        // Using "Smart Timer" for Cinema-Style Subtitles (Robust & Fast)
        // 2. UNIFIED GAPLESS SPEECH 🎤 (Single-Shot Mode)
        // Using "Smart Timer" for Cinema-Style Subtitles (Robust & Fast)
        const rawTtsText = (response.voiceText || response.text || "").trim();
        let ttsText = rawTtsText
            .replace(/^\s*<speak>/i, '').replace(/<\/speak>\s*$/i, '')
            .replace(/[*#_~]/g, '')
            // Remove any tool-like calls (even if multi-line)
            .replace(/markLessonComplete\s*\([\s\S]*?\)/gi, '') // 🛠️ تنظيف خاص لأمر إنهاء الدرس
            .replace(/askToWrite|drawOnBoard|showQuiz|markLessonComplete/gi, '')
            .replace(/`[^`]*`/g, '')
            .trim();

        const stillLooksLikeCode = looksLikeCodeForChild(ttsText);
        if (stillLooksLikeCode) {
            console.log('🧼 [TTS-SANITIZER] Detected residual code pattern. Attempting to extract text only.');
            
            // 🛠️ Improved extraction: Keep only Arabic text, numbers, basic punctuation, and emojis.
            // This regex removes English letters, brackets, and code symbols (<, >, {, }, ;).
            let safeText = ttsText.replace(/[A-Za-z<>{}[\];=]+/g, " ").trim();
             
            // Remove double spaces created by cleaning
            safeText = safeText.replace(/\s+/g, ' ').trim();

            // ⚡ CHECK: Is the recovered text substantial?
            // If we have > 5 characters of actual content, we prioritize it over the generic fallback.
            if (safeText.length > 5) {
                ttsText = safeText;
                console.log('🧼 [TTS-SANITIZER] Recovered text:', ttsText);
            } else {
                // Only use generic fail-safe if the text is TRULY unrecoverable garbage.
                console.log('⚠️ [TTS-SANITIZER] Text was unusable. Fallback to generic message.');
                ttsText = 'لَدَيَّ سُؤَالٌ أَوْ نَشَاطٌ لَكَ. انْظُرْ إِلَى الشَّاشَةِ وَاتَّبِعِ التَّعْلِيمَاتِ.';
            }
        }

        // Prepare Subtitles
        const cleanFullText = ttsText
            .replace(/<[^>]+>/g, '')
            .replace(/askToWrite\s*\([\s\S]*?\)/gi, '')
            .replace(/showQuiz\s*\([\s\S]*?\)/gi, '')
            .replace(/drawOnBoard\s*\([\s\S]*?\)/gi, '')
            .replace(/askToWrite|drawOnBoard|showQuiz/gi, '');

        // Granular splitting for Live Mode (word-by-word feel)
        const splitRegex = isLiveModeRef.current ? /(\s+)/ : /([.؟!،,]+\s+)/;
        const rawSubs = cleanFullText.split(splitRegex).filter(s => s.trim().length > 0);
        const subtitles = [];
        let temp = "";

        // Group short segments (Smaller limit for Live Mode)
        const charLimit = isLiveModeRef.current ? 15 : 40;
        rawSubs.forEach(seg => {
            temp += (temp && isLiveModeRef.current ? " " : "") + seg;
            if (temp.length > charLimit || /[.؟!،]/.test(seg)) {
                subtitles.push(temp.trim());
                temp = "";
            }
        });
        if (temp.trim()) subtitles.push(temp.trim());

        try {
            await arabicVoiceService.cancel();

            // Start Cinema Subtitles (Parallel Task)
            const runCinemaSubtitles = async () => {
                // If it's a very short one-liner, just show it
                if (subtitles.length <= 1) {
                    setTranscript(cleanFullText);
                    return;
                }

                let cumulativeText = "";
                for (let i = 0; i < subtitles.length; i++) {
                    // Check status - if we stopped speaking, show ALL and quit
                    if (statusRef.current !== 'speaking') {
                        setTranscript(cleanFullText);
                        break;
                    }

                    const sub = subtitles[i];

                    if (isLiveModeRef.current) {
                        cumulativeText += (cumulativeText ? " " : "") + sub;
                        setTranscript(cumulativeText);
                    } else {
                        setTranscript(sub);
                    }

                    // Optimized for Arabic Chirp3 speed
                    const charSpeed = isLiveModeRef.current ? 45 : 100;
                    const baseDelay = isLiveModeRef.current ? 150 : 400;
                    const duration = baseDelay + (sub.length * charSpeed);

                    if (i < subtitles.length - 1) {
                        await new Promise(r => setTimeout(r, duration));
                    }
                }
                // Final safety: show full text
                setTimeout(() => setTranscript(cleanFullText), 500);
            };
            
            // Only run subtitle animation if there is text
            if (ttsText && ttsText.length > 0) {
                 runCinemaSubtitles();
             } else {
                 setTranscript("");
             }

            console.log('🎬 Executing Unified Gapless Playback (Smart Timer)...');

            const spokenPrepared = prepareTextForTTS(ttsText);
            const spokenText = looksLikeCodeForChild(spokenPrepared)
                ? 'لَدَيَّ سُؤَالٌ أَوْ نَشَاطٌ لَكَ. انْظُرْ إِلَى الشَّاشَةِ وَاتَّبِعِ التَّعْلِيمَاتِ، ثُمَّ اخْتَرِ الْإِجَابَةَ الصَّحِيحَةَ أَوِ اكْتُبِ الْحَرْفَ الْمَطْلُوبَ.'
                : spokenPrepared;

            if (spokenText && spokenText.trim().length > 0) {
                console.log('🔊 [TEACHER-SPEAK] About to speak:', spokenText.substring(0, 150) + (spokenText.length > 150 ? '...' : ''));
                await arabicVoiceService.speak(spokenText, {
                    onPlayStart: () => {
                        console.log('🔊 [TEACHER-SPEAK] Teacher started speaking now!');
                        avatarRef.current?.startTalking();
                    },
                    onVisemeChange: (viseme) => avatarRef.current?.speakVisually(viseme),
                    emotion: response.emotion,
                    preloadedAudio: response.preloadedAudio // ⚡ تمرير الصوت المُحمّل
                });
                console.log('🔊 [TEACHER-SPEAK] Finished speaking');
            } else {
                console.log('⚠️ [TTS] Empty text detected, skipping speech but resetting state.');
                // Simulate a short pause for natural flow even if silent
                await new Promise(r => setTimeout(r, 500));
            }

        } catch (speechError) {
            console.error('❌ Speech Error:', speechError);
            setTranscript(cleanFullText);
            await new Promise(r => setTimeout(r, 500));
        }

        console.log('🔊 [TEACHER-SPEAK] Teacher speech completed, stopping animations');
        avatarRef.current?.speakVisually('silence');
        avatarRef.current?.stopTalking();

        // CRITICAL: Always reset mic state
        if (geminiLiveService) {
            geminiLiveService.isSpeaking = false;
            console.log('🔊 [LIVE-MIC] isSpeaking reset to FALSE after speech completion');
        }

        if (statusRef.current === 'speaking') {
            updateStatus('idle');
            console.log('🔊 [STATUS] Updated to idle after speech');
        }

        // 3. MAGIC PEN DETECTION (Trigger writing modal if keywords detected)
        const magicPenKeywords = ['دورك', 'بقلمك', 'اصبعك', 'إصبعك', 'جرب أن ترسم', 'جرب رسم', 'بيدك', 'شكل الحرف بيدك', 'اكتب', 'ارسم', 'هيا نكتب', 'استخدم أداة الكتابة', 'نافذة الكتابة'];

        // 4. DRAWING DETECTION (Fallback text-to-action)
        // If AI says "I will draw" but forgets the tool, we catch it here.
        const drawingKeywords = ['سأرسم', 'ارسم لك', 'انظر إلى اللوح', 'على السبورة', 'شكل حرف'];
        const fullCleanText = ttsText.replace(/<[^>]+>/g, '');
        const normText = normalize(fullCleanText);
        let shouldTriggerWriting = false;

        // SKIP TRIGGERS if we just finished a task (praise turn)
        if (justFinishedTaskRef.current) {
            console.log('🌈 [DEBOUNCE] Skipping triggers during praise turn for turn protection.');
            justFinishedTaskRef.current = false; // CONSUME THE SHIELD - it's a one-turn protection
        } else {
            // ⚠️ DISABLED: Drawing detection here is redundant and happens too late (after speech).
            // We now rely on onContentReceived (SMART FALLBACK) to trigger drawing immediately.
            // 1. MULTI-DRAWING DETECTION (Teacher Drawing)
            // const drawMatches = [...rawTtsText.matchAll(/drawOnBoard\(item=['"]?([a-zA-Z0-9_\u0600-\u06FF]+)['"]?\)/g)];
            // ... (Code disabled) ...

            // Execute all drawings found
            const allItemsToDraw = []; // Empty prevents late drawing
            let teacherDidDraw = false; // Prevents writing modal logic from thinking teacher just drew here

            allItemsToDraw.forEach((item, index) => {
                let finalItem = item;
                // Mapping if it's a letter name
                // Mapping from English/Phonetic names to Arabic characters
                const nameMap = {
                    'الف': 'أ', 'باء': 'ب', 'تاء': 'ت', 'ثاء': 'ث', 'جيم': 'ج', 'حاء': 'ح', 'خاء': 'خ', 'دال': 'د', 'ذال': 'ذ', 'راء': 'ر', 'زاي': 'ز', 'سين': 'س', 'شين': 'ش', 'صاد': 'ص', 'ضاد': 'ض', 'طاء': 'ط', 'ظاء': 'ظ', 'عين': 'ع', 'غين': 'غ', 'فاء': 'ف', 'قاف': 'ق', 'كاف': 'ك', 'لام': 'ل', 'ميم': 'م', 'نون': 'ن', 'هاء': 'ه', 'واو': 'و', 'ياء': 'ي',
                    // English letter names (used by Gemini)
                    'alif': 'أ', 'alef': 'أ', 'ba': 'ب', 'baa': 'ب', 'ta': 'ت', 'taa': 'ت',
                    'tha': 'ث', 'thaa': 'ث', 'jim': 'ج', 'jeem': 'ج', 'ha': 'ح', 'haa': 'ح',
                    'kha': 'خ', 'khaa': 'خ', 'dal': 'د', 'daal': 'د', 'dhal': 'ذ', 'dhaal': 'ذ',
                    'ra': 'ر', 'raa': 'ر', 'zay': 'ز', 'zayn': 'ز', 'seen': 'س', 'sin': 'س',
                    'sheen': 'ش', 'shin': 'ش', 'sad': 'ص', 'saad': 'ص', 'dad': 'ض', 'daad': 'ض',
                    'tah': 'ط', 'dhah': 'ظ', 'ayn': 'ع', 'ain': 'ع', 'ghayn': 'غ', 'ghain': 'غ',
                    'fa': 'ف', 'faa': 'ف', 'qaf': 'ق', 'qaaf': 'ق', 'kaf': 'ك', 'kaaf': 'ك',
                    'lam': 'ل', 'laam': 'ل', 'meem': 'م', 'mim': 'م', 'noon': 'ن', 'nun': 'ن',
                    'hah': 'ه', 'waw': 'و', 'ya': 'ي', 'yaa': 'ي',
                    // Single letter shortcuts
                    'a': 'أ', 'b': 'ب', 't': 'ت', 'th': 'ث', 'j': 'ج', 'h': 'ح', 'kh': 'خ', 'd': 'د', 'z': 'ز', 'r': 'ر', 's': 'س', 'sh': 'ش', 'S': 'ص', 'D': 'ض', 'T': 'ط', 'Z': 'ظ', 'E': 'ع', 'G': 'غ', 'f': 'ف', 'q': 'ق', 'k': 'ك', 'l': 'ل', 'm': 'م', 'n': 'ن', 'w': 'و', 'y': 'ي'
                };

                // الكلمات الشائعة التي يجب تجاهلها (ليست حروفاً)
                const ignoredWords = ['على', 'علي', 'هذا', 'هذه', 'ذلك', 'تلك', 'من', 'الى', 'في', 'عن', 'ان', 'كان', 'هل', 'ما', 'لا'];
                const cleanItem = normalize(finalItem);
                if (ignoredWords.includes(cleanItem)) {
                    console.log('🎨 [QUEUE-DRAW] Skipping common word:', finalItem);
                    return; // Skip this item
                }

                if (finalItem.startsWith('letter_')) finalItem = finalItem.replace('letter_', '');
                finalItem = nameMap[finalItem.toLowerCase()] || nameMap[finalItem] || finalItem;

                console.log(`🎨 [QUEUE-DRAW] Drawing item ${index + 1}:`, finalItem);

                setTimeout(() => {
                    if (index === 0) avatarRef.current?.walkToBoard();
                    const drawData = aiService.getDrawData(finalItem);
                    whiteboardRef.current?.write(drawData || finalItem, { count: 1, duration: 2500 });
                }, 1200 + (index * 3000));
            });

            /* 
            // 🛑 REMOVED LEGACY LOGIC: This was causing phantom triggers (opening 'أ' randomly).
            // We now rely solely on the strict SMART-FALLBACK in handleResponse.
            
            // 2. Student Writing Intent
            const strongTurnKeywords = ['دورك', 'بقلمك', 'اصبعك', 'إصبعك', 'بيدك', 'جرب', 'حاول', 'استخدم أداة الكتابة', 'نافذة الكتابة'];
            const isStrongTrigger = strongTurnKeywords.some(kw => normText.includes(normalize(kw))) || /askToWrite/i.test(rawTtsText);

            const genericKeywordsLine = ["اكتب", "ارسم", "خطط", "شكل"];
            const isGenericTrigger = genericKeywordsLine.some(kw => {
                const normalizedKw = normalize(kw);
                const regex = new RegExp(`(^|\\s)${normalizedKw}(\\s|\\.|!|\\?|$)`);
                return regex.test(normText);
            });

            const shouldActivateWriting = teacherDidDraw ? isStrongTrigger : (isStrongTrigger || isGenericTrigger);

            if (shouldActivateWriting) {
                // ... logic removed ...
            }
            if (shouldTriggerWriting && !isWritingModalVisible) {
                // setIsWritingModalVisible(true);
            }
            */

             // 5. MAGIC QUIZ DETECTION (Fallback if tool fails but keywords exist)
            const quizKeywords = ['سأختبرك', 'أين الإجابة', 'اختر الإجابة', 'لعبة الخيارات', 'أي واحد منهم', 'سؤال لك'];
            const shouldTriggerQuiz = quizKeywords.some(kw => normText.includes(normalize(kw))) && !isSelectionModalVisible;

            if (shouldTriggerQuiz && !pendingQuizRef.current && selectionOptions.length > 0) {
                console.log('🎯 [TEXT-TRIGGER] Detected quiz intent by keywords.');
                setIsSelectionModalVisible(true);
                return;
            }

            console.log('🔄 Turn complete.');
        }
    };

    const pickImage = async () => {
        try {
            const hasPermission = await requestCameraPermissions();
            if (!hasPermission) {
                Alert.alert("عذراً", "يجب منح صلاحية الكاميرا والوسائط لتتمكني من رفع الصور.");
                return;
            }

            setIsCameraActive(true); // 🟡 Activate Button
            const result = await launchCamera({
                mediaType: 'photo',
                includeBase64: true,
                quality: 0.5,
                saveToPhotos: true,
            });

            if (result.didCancel || result.errorMessage) {
                 setIsCameraActive(false); // ⚪ Reset if cancelled
                 return;
            }

            const asset = result.assets[0];
            if (asset.uri) {
                // Show the image on the whiteboard immediately
                whiteboardRef.current?.showImage(asset.uri);
                
                // Move teacher to the other side so she doesn't block the image
                // AGGRESSIVE POSITIONING: Send multiple pulses to ensure bridge connectivity after Camera resume
                const triggerMovement = () => {
                    if (avatarRef.current) {
                        console.log('🎬 [POST-CAMERA] Position Pulse...');
                        avatarRef.current.walkToRight();
                        avatarRef.current.setEmotion('happy');
                    }
                };
                
                triggerMovement(); // 0ms
                [100, 300, 600, 1000, 1500, 2000, 3000, 5000].forEach(delay => {
                    setTimeout(triggerMovement, delay);
                });
                
                setTranscript("جاري تحليل الصورة إعداد الدرس... 🖼️");
                updateStatus('thinking'); // Show thinking state manually

                try {
                    console.log('📸 [CLASSROOM] Start analyzing captured image (Lesson Mode)...');
                    
                    // 1. Analyze the image to extract curriculum content (Just like creating a lesson)
                    const analysisResult = await curriculumSearchService.analyzeImages([asset.uri], "صورة من الكاميرا");

                    if (analysisResult.success) {
                        console.log('✅ [CLASSROOM] Analysis success. Restarting session with new curriculum context.');
                        
                        // 2. Update References to act as a new Lesson
                        curriculumContentRef.current = analysisResult.content;
                        lessonTitleRef.current = "تبسيط محتوى الصورة"; 
                        lessonTypeRef.current = "تحليل صورة";
                        lessonImagesRef.current = [asset.uri]; 

                        // 3. Restart the Live Session with the new System Prompt (Strict Mode)
                        // We call setupLiveMode which now forces a disconnect first
                        await setupLiveMode(userName, aiService.userProfile.grade);
                        
                        // 4. Ensure teacher is in position after restart
                        const restartPulse = () => {
                            console.log('🎬 [POST-RESTART] Position Pulse...');
                            avatarRef.current?.walkToRight();
                            avatarRef.current?.setEmotion('happy');
                        };
                        [1000, 2500, 4500].forEach(delay => setTimeout(restartPulse, delay));
                    } else {
                        console.log('⚠️ [CLASSROOM] Analysis failed, falling back to simple image send.');
                        // Fallback: If analysis fails, just send the image to the current session
                        await geminiLiveService.sendImages([asset.uri], "انظري لهذه الصورة، وهل حلي صحيح؟");
                        updateStatus('listening');
                    }

                } catch (e) {
                    console.error('❌ [CLASSROOM] Error processing image:', e);
                    // Final Fallback
                    await geminiLiveService.sendImages([asset.uri], "اشرحي لي هذه الصورة.");
                    updateStatus('listening');
                }
            }
        } catch (error) {
            console.error("ImagePicker Error:", error);
            Alert.alert("خطأ", "حدث خطأ أثناء فتح الكاميرا");
        } finally {
            setIsCameraActive(false); // ⚪ Reset button state
        }
    };

    // Confetti State
    const [showConfetti, setShowConfetti] = useState(false);
    const confettiAnim = useRef(new Animated.Value(0)).current;

    const handleWritingSuccess = async () => {
        // Block auto-listeners immediately
        updateStatus('thinking');

        setIsWritingModalVisible(false);
        pendingWritingRef.current = false; // CRITICAL: Reset the pending flag immediately!

        // Shield the NEXT turn (the praise turn) from re-triggering the writing modal.
        // This is consumed and reset in speakResponse.
        justFinishedTaskRef.current = true;

        // KILL VOICE to prevent self-echo of the congratulations message
        await arabicVoiceService.cancel();
        // Wait a bit to ensure system acknowledges cancellation
        await new Promise(r => setTimeout(r, 500));

        avatarRef.current?.setEmotion('happy');
        avatarRef.current?.laugh();

        setShowConfetti(true);
        Animated.sequence([
            Animated.timing(confettiAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.delay(2000),
            Animated.timing(confettiAnim, { toValue: 0, duration: 1000, useNativeDriver: true })
        ]).start(() => setShowConfetti(false));

        // Let Gemini Live know about success
        setTimeout(() => {
            geminiLiveService.sendText("✅ لقد نجح الطفل في كتابة الحرف بشكل صحيح! احتفلي به!");
        }, 800);
    };

    const handleWritingFailure = async () => {
        updateStatus('thinking');
        setIsWritingModalVisible(false);
        pendingWritingRef.current = false; // Reset flag on failure too

        // Notify Gemini Live of failure
        await arabicVoiceService.cancel();
        avatarRef.current?.setEmotion('sad');

        setTimeout(() => {
            geminiLiveService.sendText("❌ لقد حاول الطفل الكتابة ولكن لم ينجح (الرسم غير واضح أو خاطئ). شجعيه وحاولي معه مرة أخرى.");
        }, 800);
    };

    const renderConfetti = () => {
        if (!showConfetti) return null;

        const particles = Array.from({ length: 20 }).map((_, i) => ({
            id: i,
            left: Math.random() * width,
            top: Math.random() * height * 0.5,
            scale: Math.random() * 0.8 + 0.5,
            delay: Math.random() * 500
        }));

        return (
            <View style={styles.confettiContainer} pointerEvents="none">
                {particles.map((p) => (
                    <Animated.Text
                        key={p.id}
                        style={{
                            position: 'absolute',
                            left: p.left,
                            top: p.top,
                            fontSize: 30,
                            transform: [
                                {
                                    scale: confettiAnim.interpolate({
                                        inputRange: [0, 0.5, 1],
                                        outputRange: [0, p.scale * 1.5, p.scale]
                                    })
                                },
                                {
                                    translateY: confettiAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 300 + Math.random() * 200]
                                    })
                                },
                                {
                                    rotate: confettiAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0deg', `${Math.random() * 360}deg`]
                                    })
                                }
                            ],
                            opacity: confettiAnim.interpolate({
                                inputRange: [0, 0.2, 0.8, 1],
                                outputRange: [0, 1, 1, 0]
                            })
                        }}
                    >
                        {['⭐', '✨', '🌟', '🎉'][p.id % 4]}
                    </Animated.Text>
                ))}
            </View>
        );
    };

    const handleSendText = async () => {
        if (!inputText.trim()) return;

        const textToSend = inputText;
        setInputText('');
        setIsKeyboardOpen(false);

        setTranscript(`أنت: ${textToSend}`);
        geminiLiveService.sendText(textToSend);
    };

    // ⚡ Memoized WebView Props to prevent audio kill on re-render
    const handleWebViewMessage = useCallback((event) => {
        console.log('🔊 [WEBVIEW]:', event.nativeEvent.data);
    }, []);

    const webViewSource = useMemo(() => ({ html: LIVE_AUDIO_HTML }), []);

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

                {/* Top Header */}
                <View style={styles.header}>
                    {/* Left: Speak Button (Oval) */}
                    <View style={styles.speakButton}>
                        <Text style={styles.speakButtonText}>
                            {status === 'speaking' ? 'اسْتَمِعْ لِمُعَلِّمَتِكَ' : 'تَحَدَّثْ'}
                        </Text>
                    </View>

                    {/* Right: Back Button (Circle) */}
                    <BouncyButton onPress={() => {
                        console.log('🔙 [UI] Classroom Back Button Pressed');
                        navigation.goBack();
                    }} style={styles.backButton}>
                        <Text style={styles.backButtonText}>←</Text>
                    </BouncyButton>
                </View>

                <View style={styles.fullScreenLayer}>
                    <Teacher3D ref={avatarRef} />
                </View>

                <View style={styles.boardOverlay}>
                    <ChalkboardWhiteboard ref={whiteboardRef} />
                </View>

                {/* Premium Transcript Box with Gold Corners */}
                <View style={styles.transcriptContainer}>
                    {/* Corner Decorations */}
                    <View style={[styles.cornerDecor, styles.cornerTopLeft]} />
                    <View style={[styles.cornerDecor, styles.cornerTopRight]} />
                    <View style={[styles.cornerDecor, styles.cornerBottomLeft]} />
                    <View style={[styles.cornerDecor, styles.cornerBottomRight]} />

                    <ScrollView
                        ref={transcriptScrollRef}
                        onContentSizeChange={() => transcriptScrollRef.current?.scrollToEnd({ animated: true })}
                        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 10 }}
                        showsVerticalScrollIndicator={false}
                    >
                        <Text style={styles.transcriptText}>{transcript || "..."}</Text>
                    </ScrollView>
                </View>

                {/* Glassmorphic Bottom Bar */}
                <View style={styles.bottomBar}>
                    
                    {/* 1. Writing Button (Pencil) */}
                    <View style={isWritingModalVisible ? styles.micContainerSmall : { width: 55, height: 55, justifyContent: 'center', alignItems: 'center' }}>
                        <BouncyButton
                            onPress={() => {
                                if (status === 'speaking') {
                                    // ⏸️ تأجيل الفتح حتى تنتهي المعلمة
                                    console.log('⏸️ [MODAL] Waiting for teacher to finish speaking...');
                                    return;
                                }
                                setIsWritingModalVisible(true);
                            }}
                            disabled={status === 'thinking'}
                            style={isWritingModalVisible ? styles.goldenMicButton : styles.glassButton}
                        >
                            <Text style={isWritingModalVisible ? { fontSize: 32 } : styles.emojiIcon}>✏️</Text>
                        </BouncyButton>
                    </View>

                    {/* 2. Message Button (Keyboard) */}
                    <View style={isKeyboardOpen ? styles.micContainerSmall : { width: 55, height: 55, justifyContent: 'center', alignItems: 'center' }}>
                        <BouncyButton
                            onPress={() => {
                                if (status === 'speaking') {
                                    console.log('⏸️ [MODAL] Waiting for teacher to finish speaking...');
                                    return;
                                }
                                setIsKeyboardOpen(true);
                            }}
                            disabled={status === 'thinking'}
                            style={isKeyboardOpen ? styles.goldenMicButton : styles.glassButton}
                        >
                            <Text style={isKeyboardOpen ? { fontSize: 32 } : styles.emojiIcon}>⌨️</Text>
                        </BouncyButton>
                    </View>

                    {/* 3. Speaker Button (Dynamic Size) */}
                    {/* Active when Teacher Speaks */}
                    <View style={status === 'speaking' ? styles.micContainerSmall : { width: 55, height: 55, justifyContent: 'center', alignItems: 'center' }}>
                         <BouncyButton
                            onPress={toggleMute} 
                            style={[
                                status === 'speaking' ? styles.goldenMicButton : styles.glassButton,
                                isMuted && { backgroundColor: 'rgba(255, 69, 0, 0.4)' }
                            ]}
                        >
                            <Ionicons 
                                name={isMuted ? "volume-mute" : "volume-high"} 
                                size={status === 'speaking' ? 40 : 28} 
                                color="#FFF" 
                            />
                        </BouncyButton>
                    </View>

                    {/* 4. Mic Button (Dynamic Size) */}
                    {/* Active when User Speaks or Ready */}
                    <View style={status !== 'speaking' ? styles.micContainerSmall : { width: 55, height: 55, justifyContent: 'center', alignItems: 'center' }}> 
                         <BouncyButton
                            soundName={null}
                            onPress={toggleMicOnly} // Exclusive Mic Control
                            disabled={status === 'thinking'}
                            style={[
                                status !== 'speaking' ? styles.goldenMicButton : styles.glassButton,
                                status === 'listening' && styles.micActivePulse,
                            ]}
                        >
                            {status === 'thinking' ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <Ionicons 
                                    name={isMicActive ? "mic" : "mic-off"} // Visual feedback
                                    size={status !== 'speaking' ? 40 : 28} 
                                    color="#FFF" 
                                    style={styles.neonIcon} 
                                />
                            )}
                        </BouncyButton>
                    </View>

                    {/* 5. Camera Button */}
                    <View style={isCameraActive ? styles.micContainerSmall : { width: 55, height: 55, justifyContent: 'center', alignItems: 'center' }}>
                         <BouncyButton
                            onPress={pickImage}
                            disabled={status === 'thinking'}
                            style={isCameraActive ? styles.goldenMicButton : styles.glassButton}
                        >
                            <Text style={isCameraActive ? { fontSize: 32 } : styles.emojiIcon}>📷</Text>
                        </BouncyButton>
                    </View>
                </View>

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={isKeyboardOpen}
                    onRequestClose={() => setIsKeyboardOpen(false)}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={styles.keyboardModalWrapper}
                    >
                        <View style={styles.keyboardContainer}>
                            <View style={styles.keyboardHeader}>
                                <Text style={styles.keyboardTitle}>اكتب رسالتك للمعلمة</Text>
                                <BouncyButton onPress={() => setIsKeyboardOpen(false)} style={styles.closeButton}>
                                    <Text style={styles.closeButtonText}>✕</Text>
                                </BouncyButton>
                            </View>

                            <TextInput
                                style={styles.textInput}
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder="اكتب هنا..."
                                placeholderTextColor="#999"
                                multiline
                            />

                            <BouncyButton
                                onPress={handleSendText}
                                style={styles.sendButton}
                            >
                                <Text style={styles.sendButtonText}>إرسال 📤</Text>
                            </BouncyButton>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

                <HandwritingModal
                    visible={isWritingModalVisible}
                    letter={writingLetter}
                    onClose={() => setIsWritingModalVisible(false)}
                    onSuccess={handleWritingSuccess}
                    onFailure={handleWritingFailure}
                />

                {renderSelectionModal()}

                <BackgroundMusic volume={0.002} playing={true} />
                {renderConfetti()}

                {/* Hidden Audio Bridge for Live Mode */}
                {/* Hidden Audio Bridge for Live Mode */}
                {/* Audio Bridge - Hidden */}
                {/* Audio Bridge - Hidden */}
                <WebView
                    ref={liveAudioBridgeRef}
                    originWhitelist={['*']}
                    source={webViewSource}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    allowsInlineMediaPlayback={true}
                    mediaPlaybackRequiresUserAction={false}
                    onMessage={handleWebViewMessage}
                    style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
                />

            </SafeAreaView >
        </View >
    );
};

const styles = StyleSheet.create({
    confettiContainer: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 200, elevation: 200,
        justifyContent: 'center', alignItems: 'center'
    },
    container: { 
        flex: 1, 
        backgroundColor: '#1A1A1A' // Dark background
    },
    safeArea: { flex: 1 },
    
    // === TOP HEADER ===
    header: {
        position: 'absolute',
        top: 40, left: 20, right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 50
    },
    speakButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // ❄️ ثلجي شفاف
        borderWidth: 2,
        borderColor: '#FFFFFF', // ⚪ أبيض
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        // ✨ نيون أبيض
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 10
    },
    speakButtonText: {
        color: '#FFFFFF', // ⚪ أبيض
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium'
    },
    backButton: {
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // ❄️ ثلجي شفاف
        borderWidth: 2,
        borderColor: '#FFFFFF', // ⚪ أبيض
        alignItems: 'center', 
        justifyContent: 'center',
        // ✨ نيون أبيض
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 10
    },
    backButtonText: { 
        fontSize: 26, 
        color: '#FFFFFF', // ⚪ أبيض
        fontWeight: 'bold' 
    },

    // === LAYERS ===
    fullScreenLayer: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        zIndex: 0 // ⬇️ إعادة الطبقة للخلف ليظهر النص (لأن الخلفية والمعلمة طبقة واحدة)
    },
    boardOverlay: {
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: width * 0.48, 
        height: width * 0.65, // زيادة الارتفاع (كان 0.58) لتغطية الأسفل تماماً
        zIndex: 5,
        borderRadius: 8
    },

    // === PREMIUM TRANSCRIPT BOX ===
    transcriptContainer: {
        position: 'absolute',
        bottom: 140,
        alignSelf: 'center',
        width: '90%',
        height: 95,
        backgroundColor: 'rgba(120, 130, 140, 0.6)', // 🌫️ رمادي أغمق قليلاً (تباين أفضل)
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFFFFF', // ⚪ أبيض
        paddingVertical: 16,
        paddingHorizontal: 24,
        zIndex: 40,
        // ✨ نيون أبيض مشع
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 15
        // overflow removed to show text properly
    },
    transcriptText: {
        fontSize: 18,
        color: '#FFFFFF', // ⚪ أبيض
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
        lineHeight: 28,
        fontWeight: 'bold',
        // ✨ شعاع سماوي فاتح قوي
        textShadowColor: 'rgba(135, 206, 235, 1)', // 💙 سماوي فاتح كامل
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15 // شعاع أقوى
    },
    // Corner Decorations - MUCH BIGGER
    cornerDecor: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#FFFFFF', // ⚪ أبيض
        borderWidth: 0
    },
    cornerTopLeft: {
        top: -4, left: -4,
        borderTopWidth: 5, // Much thicker
        borderLeftWidth: 5
    },
    cornerTopRight: {
        top: -4, right: -4,
        borderTopWidth: 5,
        borderRightWidth: 5
    },
    cornerBottomLeft: {
        bottom: -4, left: -4,
        borderBottomWidth: 5,
        borderLeftWidth: 5
    },
    cornerBottomRight: {
        bottom: -4, right: -4,
        borderBottomWidth: 5,
        borderRightWidth: 5
    },

    // === GLASSMORPHIC BOTTOM BAR ===
    bottomBar: {
        position: 'absolute',
        bottom: 30, 
        alignSelf: 'center',
        width: '94%',
        height: 90,
        backgroundColor: 'rgba(30, 30, 30, 0.5)', // Slightly darker for contrast
        borderRadius: 45,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly', // Evenly space 5 items
        paddingHorizontal: 2,
        zIndex: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8
    },
    
    // Transparent Circles for Emojis & Icons
    glassButton: {
        width: 55, height: 55, borderRadius: 27.5, // Slightly smaller to fit 5
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center', 
        alignItems: 'center',
    },
    emojiIcon: { 
        fontSize: 28, 
        textAlign: 'center'
    },

    // === GOLDEN MIC (UPDATED FOR 5-BUTTON LAYOUT) ===
    micContainerSmall: {
        width: 75, height: 75,
        justifyContent: 'center', alignItems: 'center',
        marginTop: 0,
        zIndex: 60
    },
    goldenMicButton: {
        width: 70, height: 70, borderRadius: 35, // Highlithed but fits in row
        // TRUE TRANSPARENT GLASS GOLD:
        backgroundColor: 'rgba(255, 215, 0, 0.25)', 
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.6)', 
        justifyContent: 'center', 
        alignItems: 'center',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10, 
        elevation: 10
    },
    neonIcon: {
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2
    },
    micActivePulse: {
        backgroundColor: 'rgba(255, 215, 0, 0.4)', 
        transform: [{ scale: 1.1 }],
        shadowColor: '#FFA500',
        shadowRadius: 15
    },
    micGlow: {
        position: 'absolute',
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: 'rgba(255, 223, 0, 0.1)',
        zIndex: -1
    },

    // === MODALS ===
    keyboardModalWrapper: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.6)'
    },
    keyboardContainer: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 20,
        minHeight: 300
    },
    keyboardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15
    },
    keyboardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    closeButton: { padding: 5 },
    closeButtonText: { fontSize: 20, color: '#999' },
    textInput: {
        backgroundColor: '#F5F5F5',
        borderRadius: 15,
        padding: 15,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 15,
        color: '#333'
    },
    sendButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 15,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center'
    },
    sendButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold'
    },
    
    // === SELECTION MODAL ===
    selectionOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
    },
    selectionContainer: {
        width: '85%',
        backgroundColor: '#FFF',
        borderRadius: 25,
        padding: 25,
        alignItems: 'center',
        ...theme.shadows.lg,
        elevation: 100
    },
    selectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginBottom: 20,
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium'
    },
    optionsWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 15
    },
    optionCard: {
        backgroundColor: '#E3F2FD',
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#BBDEFB',
        minWidth: 100,
        alignItems: 'center',
        margin: 5
    },
    optionText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1565C0'
    }
});

export default ClassroomScreen;
