import React, { useRef, useState, useEffect } from 'react';
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

const ClassroomScreen = ({ navigation, route }) => {
    const avatarRef = useRef(null);
    const whiteboardRef = useRef(null);
    const currentTargetLetterRef = useRef(null);

    const [status, setStatus] = useState('initializing');
    const statusRef = useRef('initializing');
    const [transcript, setTranscript] = useState('');
    const [isMicActive, setIsMicActive] = useState(false);
    const [userName, setUserName] = useState('يا بطل');
    const transcriptScrollRef = useRef(null);
    const [isLiveMode, setIsLiveMode] = useState(true);
    const isLiveModeRef = useRef(true);
    const liveAudioBridgeRef = useRef(null);
    const justFinishedTaskRef = useRef(false); // New: preventing praise re-triggers

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

    const [drawingIntent, setDrawingIntent] = useState(null);
    const lastQuizOptionsRef = useRef(null);
    const pendingQuizRef = useRef(false);
    const pendingWritingRef = useRef(false);

    // --- Unified Speech Events ---
    useEffect(() => {
        const handleFinish = () => {
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



    const setupLiveMode = async () => {
        updateStatus('thinking');
        isLiveModeRef.current = true; // LOCK IMMEDIATELY

        try {
            // KILL OLD VOICE COMPLETELY
            await arabicVoiceService.cancel();
            try {
                await Voice.stop();
                Voice.removeAllListeners(); // IMPORTANT: Wipe old system listeners
                await Voice.destroy();
            } catch (e) { }

            // 🧠 بدء جلسة جديدة في الذاكرة
            aiService.startNewSession();

            await geminiLiveService.connect(userName, aiService.userProfile.grade);

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
                console.log('🚀 [LIVE-HYBRID] Full Text Ready. Starting Sync-Speech.');
                setTranscript("");

                try {
                    geminiLiveService.pauseMic();
                    await new Promise(r => setTimeout(r, 200));
                    let cleanText = text.trim();
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
                                    lastSmartQuizContextRef.current = { text: effectiveText };
                                }
                            }
                        } else {
                            lastSmartQuizContextRef.current = { text: effectiveText };
                        }
                    }

                    // 🔧 FALLBACK: Detect tool calls written as text and execute them
                    // drawOnBoard detection
                    const drawMatch = cleanText.match(/`?drawOnBoard\s*\(\s*item\s*=\s*['"]?([^'")\s]+)['"]?\s*\)`?/i);
                    if (drawMatch && drawMatch[1]) {
                        console.log('🎨 [FALLBACK] Detected drawOnBoard as text, executing:', drawMatch[1]);
                        fallbackDrawTriggered = true;
                        let item = drawMatch[1];

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
                        const drawData = aiService.getDrawData(finalItem);
                        avatarRef.current?.walkToBoard();
                        setTimeout(() => {
                            whiteboardRef.current?.write(drawData || finalItem, { count: 1, duration: 3000 });
                        }, 1200);
                    }

                    // 🎨 SMART FALLBACK: Detect natural language drawing intents
                    // عندما يقول النموذج "رسمته لك على السبورة" بدون استخدام الأداة
                    if (!drawMatch && !skipSmartTriggersThisTurn) {
                        const normalizedText = normalize(cleanText);
                        const drawKeywords = [
                            'رسمت', 'سارسم', 'ارسم لك', 'على السبوره', 'على اللوح', 'انظر للسبوره', 'شكل الحرف',
                            'انظر الى', 'هذا هو حرف', 'حرف ال', 'اللوحة', 'السبورة'
                        ];
                        // Also normalize input text aggressively to catching matching substrings
                        const hasDrawIntent = drawKeywords.some(kw => normalizedText.includes(normalize(kw)));

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

                            // 2. إذا لم نجد كائناً، نبحث عن اسم الحرف
                            if (!foundLetter) {
                                for (const [name, letter] of Object.entries(letterNameMap)) {
                                    if (normalizedText.includes(normalize(name))) {
                                        foundLetter = letter;
                                        console.log('🎨 [SMART-FALLBACK] Found letter name:', name, '->', letter);
                                        break;
                                    }
                                }
                            }

                            // 3. البحث عن أي نص بين أقواس () أو علامات تنصيص ""
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
                                const drawData = aiService.getDrawData(foundLetter);
                                avatarRef.current?.walkToBoard();
                                setTimeout(() => {
                                    whiteboardRef.current?.write(drawData || foundLetter, { count: 1, duration: 3000 });
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
                        const hasWriteIntent =
                            normalizedText.includes('اكتب') ||
                            normalizedText.includes('اكتبي') ||
                            normalizedText.includes('حاول ان تكتب') ||
                            normalizedText.includes('حاول أن تكتب') ||
                            normalizedText.includes('جرب ان تكتب') ||
                            normalizedText.includes('جرب أن تكتب') ||
                            normalizedText.includes('نتدرب على كتابة') ||
                            normalizedText.includes('نتدرّب على كتابة');

                        const hasLetterMention =
                            normalizedText.includes('حرف') ||
                            /\(([^)]+)\)/.test(cleanText);

                        if (hasWriteIntent && hasLetterMention) {
                            const writeParenMatch = normalizedText.match(/حرف[^\(]{0,24}\(([^)]+)\)/) || normalizedText.match(/\(([^)]+)\)/);
                            const requested = writeParenMatch?.[1] || null;
                            const requestedChar = resolveArabicLetter(requested);
                            const effectiveLetter = currentTargetLetterRef.current || requestedChar || 'أ';
                            console.log('✍️ [SMART-FALLBACK] askToWrite intent detected:', { requested, effectiveLetter });
                            fallbackWriteTriggered = true;
                            setWritingLetter(effectiveLetter);
                            pendingWritingRef.current = true;
                        }
                    }

                    // showQuiz detection
                    const quizMatch = cleanText.match(/`?showQuiz\s*\(\s*question\s*=\s*['"]([^'"]+)['"]\s*,\s*options\s*=\s*\[([^\]]+)\]\s*,\s*answer\s*=\s*['"]([^'"]+)['"]\s*\)`?/i);
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
                    }

                    // askToWrite detection
                    const writeMatch =
                        cleanText.match(/`?askToWrite\s*\(\s*letter\s*=\s*['"]?([^'")\s]+)['"]?\s*\)`?/i) ||
                        cleanText.match(/askToWrite\s*\(\s*\{\s*letter\s*:\s*['"]([^'"]+)['"]\s*\}\s*\)/i);
                    if (writeMatch && writeMatch[1]) {
                        const requestedLetter = writeMatch[1];
                        const requestedChar = resolveArabicLetter(requestedLetter);
                        const effectiveLetter = currentTargetLetterRef.current || requestedChar || 'أ';
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

                    // نطق النص مع تفعيل التزامن "كلمة بكلمة"
                    await speakResponse({
                        text: cleanText,
                        voiceText: cleanText,
                        action: 'speaking',
                        emotion: 'happy'
                    });
                } catch (e) {
                    console.error('❌ [LIVE-HYBRID] Error:', e);
                } finally {
                    // Only resume if we aren't about to open a modal (Writing/Quiz)
                    setTimeout(() => {
                        // Check ALL modal states (Writing & Quiz) + Pending flags
                        if (!isWritingModalRef.current && !pendingWritingRef.current &&
                            !pendingQuizRef.current && !isSelectionModalVisibleRef.current) {
                            geminiLiveService.resumeMic();
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
                    avatarRef.current?.walkToBoard();
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

                    geminiLiveService.sendText(`✅ لقد اختار الطفل الإجابة الصحيحة وهي "${option}". احتفلي به!`);
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

                        geminiLiveService.sendText(`❌ لقد أخطأ الطفل مرتين متتاليتين في الاختبار بالإجابة "${option}". من فضلك اشرحي له الدرس مجدداً وارسمي له على السبورة ليفهم.`);
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
            console.log('✍️ Writing Modal Open: Pausing Voice Listening...');
            if (isLiveModeRef.current && geminiLiveService) {
                geminiLiveService.pauseMic();
            }
            arabicVoiceService.cancel(); // Stop any active listening
            updateStatus('idle');
            setIsMicActive(false);
        } else {
            console.log('✍️ Writing Modal Closed: Resuming check...');
            if (isLiveModeRef.current && geminiLiveService && !isMutedRef.current && statusRef.current === 'idle') {
                geminiLiveService.resumeMic();
            }
        }
    }, [isWritingModalVisible, isLiveMode]);

    // 🆕 QUIZ MODAL MIC CONTROL (Same logic as writing)
    useEffect(() => {
        if (isSelectionModalVisible) {
            console.log('🎯 Quiz Modal Open: Pausing Voice Listening...');
            if (isLiveModeRef.current && geminiLiveService) {
                geminiLiveService.pauseMic();
            }
            arabicVoiceService.cancel();
            updateStatus('idle');
            setIsMicActive(false);
        } else {
            console.log('🎯 Quiz Modal Closed: Resuming check...');
            // Only resume if Writing Modal is NOT open (to avoid conflict)
            if (!isWritingModalRef.current && isLiveModeRef.current && geminiLiveService && !isMutedRef.current && statusRef.current === 'idle') {
                geminiLiveService.resumeMic();
            }
        }
    }, [isSelectionModalVisible, isLiveMode]);

    useEffect(() => {
        initializeClassroom();
        return () => {
            arabicVoiceService.stop();
            geminiLiveService.disconnect();
        };
    }, []);

    const toggleMute = () => {
        const newMuteState = !isMuted;
        setIsMuted(newMuteState);

        if (newMuteState) {
            console.log('🔇 Muting Gemini Live Mic...');
            geminiLiveService.pauseMic();
            setIsMicActive(false);
        } else {
            console.log('🎤 Unmuting Gemini Live Mic...');
            geminiLiveService.resumeMic();
            setIsMicActive(true);
        }
    };

    const requestPermissions = async () => {
        if (Platform.OS === 'android') {
            try {
                const grants = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                ]);
            } catch (err) {
                console.warn(err);
            }
        }
    };

    const initializeClassroom = async () => {
        global.gemini = geminiLiveService;
        await requestPermissions();
        let name = 'بَطَل'; // Default

        try {
            const userDataStr = await AsyncStorage.getItem('userProfile');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                console.log('📂 Loaded User Profile (Raw):', userData);

                // 1. Sanitize Name immediately
                if (userData.name) {
                    // eslint-disable-next-line no-misleading-character-class
                    name = userData.name.replace(/[^\u0621-\u064A\u064B-\u065F\u0671-\u06D3\u06F0-\u06F9a-zA-Z\s]/g, '').trim();
                }

                // 2. Resolve Grade
                const grade = userData.grade || 'KG1';

                // 3. Update AI Service with verification status
                // We assume if a grade exists in storage and is not default KG1 (or if we explicitly saved it), it's verified.
                // Better: Check a boolean flag if we saved it.
                const isVerified = userData.gradeVerified || (grade !== 'KG1');

                // 3. Update AI Service with FULL profile
                aiService.setUserProfile({
                    ...userData, // Load everything (lastLesson, sessions, etc)
                    name: name,
                    grade: grade,
                    gradeVerified: isVerified
                });

                console.log('✅ AI Service Profile Sync:', aiService.userProfile);

                // 4. Save back cleaned version if changed
                if (name !== userData.name) {
                    console.log('🧹 Cleaned name on load:', userData.name, '->', name);
                    AsyncStorage.setItem('userProfile', JSON.stringify({ ...userData, name, gradeVerified: isVerified }));
                }
            }
        } catch (e) { console.log('No user profile found', e); }

        setUserName(name);
        await arabicVoiceService.initialize();

        // Launch Gemini Live immediately
        console.log('🚀 Launching Gemini Live...');
        setupLiveMode();
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
        return /[A-Za-z{}[\];=<>]|["'`]{2,}|showQuiz|drawOnBoard|askToWrite|function|return|optionsCount|fallbackAnswer|options\s*:|question\s*:|answer\s*:/i.test(base);
    };

    const prepareTextForTTS = (text) => {
        if (!text) return '';
        let result = text;
        result = result.replace(/حرف\s*\(\s*([\u0600-\u06FF])\s*\)/g, (m, ch) => {
            const name = letterNamesForTTS[ch] || ch;
            return `حرف ${name}`;
        });
        result = result.replace(/\(\s*([\u0600-\u06FF])\s*\)/g, (m, ch) => {
            const name = letterNamesForTTS[ch] || ch;
            return name;
        });
        return result;
    };

    const speakResponse = async (response) => {
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
            avatarRef.current?.walkToBoard();
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
            .replace(/askToWrite\s*\([\s\S]*?\)/gi, '')
            .replace(/showQuiz\s*\([\s\S]*?\)/gi, '')
            .replace(/drawOnBoard\s*\([\s\S]*?\)/gi, '')
            .replace(/askToWrite|drawOnBoard|showQuiz/gi, '')
            .replace(/`[^`]*`/g, '')
            .trim();

        const stillLooksLikeCode = looksLikeCodeForChild(ttsText);
        if (stillLooksLikeCode) {
            console.log('🧼 [TTS-SANITIZER] Detected residual code pattern in TTS text. Replacing with safe narration.');
            ttsText = 'لَدَيَّ سُؤَالٌ أَوْ نَشَاطٌ لَكَ. انْظُرْ إِلَى الشَّاشَةِ وَاتَّبِعِ التَّعْلِيمَاتِ، ثُمَّ اخْتَرِ الْإِجَابَةَ الصَّحِيحَةَ أَوِ اكْتُبِ الْحَرْفَ الْمَطْلُوبَ.';
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
                    const charSpeed = isLiveModeRef.current ? 60 : 105;
                    const baseDelay = isLiveModeRef.current ? 200 : 500;
                    const duration = baseDelay + (sub.length * charSpeed);

                    if (i < subtitles.length - 1) {
                        await new Promise(r => setTimeout(r, duration));
                    }
                }
                // Final safety: show full text
                setTranscript(cleanFullText);
            };
            runCinemaSubtitles();

            console.log('🎬 Executing Unified Gapless Playback (Smart Timer)...');

            const spokenPrepared = prepareTextForTTS(ttsText);
            const spokenText = looksLikeCodeForChild(spokenPrepared)
                ? 'لَدَيَّ سُؤَالٌ أَوْ نَشَاطٌ لَكَ. انْظُرْ إِلَى الشَّاشَةِ وَاتَّبِعِ التَّعْلِيمَاتِ، ثُمَّ اخْتَرِ الْإِجَابَةَ الصَّحِيحَةَ أَوِ اكْتُبِ الْحَرْفَ الْمَطْلُوبَ.'
                : spokenPrepared;

            await arabicVoiceService.speak(spokenText, {
                onPlayStart: () => avatarRef.current?.startTalking(),
                onVisemeChange: (viseme) => avatarRef.current?.speakVisually(viseme),
                emotion: response.emotion
            });

        } catch (speechError) {
            console.error('❌ Speech Error:', speechError);
            setTranscript(cleanFullText);
            await new Promise(r => setTimeout(r, 2000));
        }

        avatarRef.current?.speakVisually('silence');
        avatarRef.current?.stopTalking();

        if (statusRef.current === 'speaking') {
            updateStatus('idle');
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
                if (response.action !== 'practice_writing' && response.action !== 'quiz' && !response.draw) {
                    shouldTriggerWriting = true;
                    pendingWritingRef.current = true;

                    const codeMatch = rawTtsText.match(/letter=['"]?([a-zA-Z0-9_\u0600-\u06FF]+)['"]?/);
                    let effectiveLetter = null;

                    if (codeMatch && codeMatch[1]) {
                        const fromCode = resolveArabicLetter(codeMatch[1]) || codeMatch[1].charAt(0);
                        effectiveLetter = fromCode;
                    } else {
                        const letterMatch = fullCleanText.match(/حرف\s*\(?\s*([\u0600-\u06FF]+)\s*\)?/);
                        if (letterMatch && letterMatch[1]) {
                            let extracted = letterMatch[1];
                            if (extracted === 'ألف') extracted = 'أ';
                            if (extracted === 'باء') extracted = 'ب';
                            const fromText = resolveArabicLetter(extracted) || extracted.charAt(0);
                            effectiveLetter = fromText;
                        }
                    }

                    if (!effectiveLetter) effectiveLetter = currentTargetLetterRef.current || 'أ';
                    setWritingLetter(effectiveLetter);
                }
            }

            if (shouldTriggerWriting && !isWritingModalVisible) {
                setIsWritingModalVisible(true);
                return;
            }

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
            const result = await launchCamera({
                mediaType: 'photo',
                includeBase64: true,
                quality: 0.5,
                saveToPhotos: true,
            });

            if (result.didCancel || result.errorMessage) return;

            const asset = result.assets[0];
            if (asset.uri) {
                whiteboardRef.current?.showImage(asset.uri);
                setTranscript("جاري تحليل الصورة... 🖼️");
                await processUserMessage("انظري لهذه الصورة، هل حلي صحيح؟", asset.base64);
            }
        } catch (error) {
            console.error("ImagePicker Error:", error);
            Alert.alert("خطأ", "حدث خطأ أثناء فتح المعرض");
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

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

                <View style={styles.header}>
                    <BouncyButton onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>←</Text>
                    </BouncyButton>



                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>
                            {status === 'listening' ? '🎤 أستمع' :
                                status === 'speaking' ? '🗣️ تَتَحَدَّثْ' :
                                    status === 'thinking' ? '🤔 أُفَكِّرْ...' :
                                        '😊 جَاهِزَة'}
                        </Text>
                    </View>
                </View>

                <View style={styles.fullScreenLayer}>
                    <Teacher3D ref={avatarRef} />
                </View>

                <View style={styles.boardOverlay}>
                    <ChalkboardWhiteboard ref={whiteboardRef} />
                </View>

                <View style={styles.transcriptContainer}>
                    <ScrollView
                        ref={transcriptScrollRef}
                        onContentSizeChange={() => transcriptScrollRef.current?.scrollToEnd({ animated: true })}
                        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                    >
                        <Text style={styles.transcriptText}>{transcript}</Text>
                    </ScrollView>
                </View>

                <View style={styles.controls}>
                    <BouncyButton
                        onPress={pickImage}
                        disabled={status === 'thinking'}
                        style={[styles.controlButton, { backgroundColor: '#E0F7FA' }]}
                    >
                        <Text style={styles.controlIcon}>📷</Text>
                    </BouncyButton>

                    <BouncyButton
                        soundName={null}
                        onPress={toggleMute}
                        disabled={status === 'thinking'}
                        style={[
                            styles.micButton,
                            isMuted && { backgroundColor: '#B0BEC5', borderColor: '#CFD8DC' },
                            isMicActive && !isMuted && styles.micButtonActive,
                            status === 'thinking' && styles.micButtonThinking,
                            status === 'speaking' && !isMuted && styles.micButtonInterrupt
                        ]}
                    >
                        {status === 'thinking' ? (
                            <ActivityIndicator color="white" size="large" />
                        ) : isMuted ? (
                            <Text style={styles.micIcon}>🔇</Text>
                        ) : status === 'speaking' ? (
                            <Text style={styles.micIcon}>✋</Text>
                        ) : (
                            <Text style={styles.micIcon}>{isMicActive ? '👂' : '🎤'}</Text>
                        )}
                    </BouncyButton>

                    <BouncyButton
                        onPress={() => {
                            setIsWritingModalVisible(true);
                        }}
                        disabled={status === 'thinking'}
                        style={[styles.controlButton, { backgroundColor: '#F3E5F5' }]}
                    >
                        <Text style={styles.controlIcon}>✏️</Text>
                    </BouncyButton>

                    <BouncyButton
                        onPress={() => setIsKeyboardOpen(true)}
                        disabled={status === 'thinking'}
                        style={[styles.controlButton, { backgroundColor: '#E1BEE7' }]}
                    >
                        <Text style={styles.controlIcon}>⌨️</Text>
                    </BouncyButton>

                    <BouncyButton
                        onPress={async () => {
                            const mockResponse = {
                                text: "انظر، سأرسم لك دائرة جميلة!",
                                action: 'explain_board',
                                draw: "M 150, 75 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0",
                                emotion: 'happy'
                            };
                            await speakResponse(mockResponse);
                        }}
                        disabled={status === 'speaking' || status === 'thinking'}
                        style={[styles.controlButton, { backgroundColor: '#FFF3E0' }]}
                    >
                        <Text style={styles.controlIcon}>🎨</Text>
                    </BouncyButton>
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
                                autoFocus
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
                <WebView
                    ref={liveAudioBridgeRef}
                    originWhitelist={['*']}
                    source={{ html: LIVE_AUDIO_HTML }}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    allowsInlineMediaPlayback={true}
                    mediaPlaybackRequiresUserAction={false}
                    onMessage={(event) => console.log('🔊 [WEBVIEW]:', event.nativeEvent.data)}
                    style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
                />

            </SafeAreaView >
        </View >
    );
};

const styles = StyleSheet.create({
    confettiContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 200,
        elevation: 200,
        justifyContent: 'center',
        alignItems: 'center'
    },
    container: { flex: 1, backgroundColor: 'white' },
    safeArea: { flex: 1 },
    header: {
        position: 'absolute',
        top: 30, left: 0, right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        zIndex: 50
    },
    backButton: {
        width: 45, height: 45, borderRadius: 22.5,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center', justifyContent: 'center'
    },
    backButtonText: { fontSize: 24, color: 'white', fontWeight: 'bold' },
    statusBadge: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 15, paddingVertical: 8,
        borderRadius: 20, justifyContent: 'center'
    },
    statusText: { color: 'white', fontWeight: 'bold' },

    fullScreenLayer: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        zIndex: 0,
    },

    boardOverlay: {
        position: 'absolute',
        top: '22%',
        left: '10%',

        width: width * 0.35,
        height: width * 0.35,
        zIndex: 5,
        backgroundColor: 'rgba(30, 58, 47, 0.0)',

        borderRadius: 8,
        elevation: 0
    },

    transcriptContainer: {
        position: 'absolute',
        bottom: '18%',
        alignSelf: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20, paddingVertical: 12,
        borderRadius: 25,
        width: '90%',
        alignItems: 'center', justifyContent: 'center',
        ...theme.shadows.md,
        zIndex: 40,
        elevation: 5,
        borderWidth: 2, borderColor: '#F0F0F0',
        minHeight: 50,
        maxHeight: 85 // سطرين كحد أقصى (Padding + LineHeight)
    },
    transcriptText: {
        fontSize: 16, color: '#2D3436', textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
        lineHeight: 28,
        fontWeight: 'bold',
        flexWrap: 'wrap'
    },

    controls: {
        position: 'absolute',
        bottom: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        gap: 15,
        zIndex: 50
    },
    micButton: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center', alignItems: 'center',
        ...theme.shadows.lg,
        borderWidth: 4, borderColor: 'white'
    },
    micButtonActive: {
        backgroundColor: '#F44336',
        transform: [{ scale: 1.1 }]
    },
    micButtonThinking: {
        backgroundColor: '#FF9800',
    },
    micButtonInterrupt: {
        backgroundColor: '#D32F2F',
    },
    micIcon: { fontSize: 32, color: 'white' },

    controlButton: {
        width: 50, height: 50, borderRadius: 25,
        justifyContent: 'center', alignItems: 'center',
        ...theme.shadows.md,
        backgroundColor: 'white'
    },
    controlIcon: { fontSize: 24 },

    keyboardModalWrapper: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    keyboardContainer: {
        backgroundColor: 'white',
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
    closeButton: {
        padding: 5
    },
    closeButtonText: {
        fontSize: 20,
        color: '#999'
    },
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
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    },
    debugBadge: {
        position: 'absolute',
        top: -30,
        alignSelf: 'center',
        backgroundColor: 'rgba(255, 235, 59, 0.9)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        zIndex: 100
    },
    debugText: {
        fontSize: 12,
        color: '#000',
        fontWeight: 'bold'
    },
    // NEW SELECTION STYLES
    selectionOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
    },
    selectionContainer: {
        width: '85%',
        backgroundColor: 'white',
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
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
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
