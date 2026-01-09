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
import Tts from 'react-native-tts'; // Import TTS for event listeners
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

const ClassroomScreen = ({ navigation, route }) => {
    const avatarRef = useRef(null);
    const whiteboardRef = useRef(null);

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

    // Handwriting Modal State
    const [isWritingModalVisible, setIsWritingModalVisible] = useState(false);
    const isWritingModalRef = useRef(false);
    const [writingLetter, setWritingLetter] = useState('أ');

    // Sync Ref with State
    useEffect(() => { isWritingModalRef.current = isWritingModalVisible; }, [isWritingModalVisible]);

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
                }
            }
        };

        const voiceListener = { onFinish: handleFinish };
        arabicVoiceService.addListener(voiceListener);
        const ttsSub = Tts.addEventListener('tts-finish', handleFinish);
        const ttsCancel = Tts.addEventListener('tts-cancel', handleFinish);

        return () => {
            arabicVoiceService.removeListener(voiceListener);
            ttsSub.remove();
            ttsCancel.remove();
        };
    }, []);

    // --- Interactive Selection Choice Logic ---
    const [isSelectionModalVisible, setIsSelectionModalVisible] = useState(false);
    const isSelectionModalVisibleRef = useRef(false);
    const [selectionOptions, setSelectionOptions] = useState([]);
    const [correctAnswer, setCorrectAnswer] = useState(null);

    // Sync Ref with State
    useEffect(() => { isSelectionModalVisibleRef.current = isSelectionModalVisible; }, [isSelectionModalVisible]);

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

                    // 🔧 FALLBACK: Detect tool calls written as text and execute them
                    // drawOnBoard detection
                    const drawMatch = cleanText.match(/`?drawOnBoard\s*\(\s*item\s*=\s*['"]?([^'")\s]+)['"]?\s*\)`?/i);
                    if (drawMatch && drawMatch[1]) {
                        console.log('🎨 [FALLBACK] Detected drawOnBoard as text, executing:', drawMatch[1]);
                        const item = drawMatch[1];
                        const drawData = aiService.getDrawData(item);
                        avatarRef.current?.walkToBoard();
                        setTimeout(() => {
                            whiteboardRef.current?.write(drawData || item, { count: 1, duration: 3000 });
                        }, 1200);
                    }

                    // showQuiz detection
                    const quizMatch = cleanText.match(/`?showQuiz\s*\(\s*question\s*=\s*['"]([^'"]+)['"]\s*,\s*options\s*=\s*\[([^\]]+)\]\s*,\s*answer\s*=\s*['"]([^'"]+)['"]\s*\)`?/i);
                    if (quizMatch) {
                        console.log('🎯 [FALLBACK] Detected showQuiz as text, executing...');
                        const question = quizMatch[1];
                        const optionsStr = quizMatch[2];
                        const answer = quizMatch[3];
                        const options = optionsStr.split(',').map(o => o.replace(/['"]/g, '').trim());

                        setSelectionOptions(options);
                        setCorrectAnswer(answer);
                        pendingQuizRef.current = true;
                    }

                    // askToWrite detection
                    const writeMatch = cleanText.match(/`?askToWrite\s*\(\s*letter\s*=\s*['"]?([^'")\s]+)['"]?\s*\)`?/i);
                    if (writeMatch && writeMatch[1]) {
                        console.log('✍️ [FALLBACK] Detected askToWrite as text, executing:', writeMatch[1]);
                        setWritingLetter(writeMatch[1]);
                        pendingWritingRef.current = true;
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
                        if (!isWritingModalRef.current && !pendingWritingRef.current && !pendingQuizRef.current) {
                            geminiLiveService.resumeMic();
                        } else {
                            console.log('🔇 [LIVE-HYBRID] Keeping mic paused for pending modal');
                        }
                    }, 400);
                }
            };

            geminiLiveService.onToolCall = (name, args) => {
                console.log('🛠️ Gemini Live Action:', name, args);

                if (name === 'showQuiz') {
                    console.log('🎯 [LIVE] Quiz pending - will show after speech finishes.');
                    setSelectionOptions(args.options);
                    setCorrectAnswer(args.answer);
                    pendingQuizRef.current = true; // Use pending ref to sync with end of speech
                }

                if (name === 'drawOnBoard') {
                    const item = args.item;
                    const drawData = aiService.getDrawData(item);
                    avatarRef.current?.walkToBoard();
                    setTimeout(() => {
                        whiteboardRef.current?.write(drawData || item, { count: 1, duration: 3000 });
                    }, 1200);
                }

                if (name === 'askToWrite') {
                    console.log('✍️ [LIVE] Asking to write:', args.letter);
                    setWritingLetter(args.letter);
                    setIsWritingModalVisible(true);
                    pendingWritingRef.current = true; // Use pending ref if audio is playing, though modal opens immediately here
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

                aiService.setUserProfile(name, grade, userData.interests);

                // Force set verification status in AI Service (we need to add this method or property setter)
                aiService.userProfile.gradeVerified = isVerified;

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
        } else if (response.action !== 'practice_writing') {
            whiteboardRef.current?.clear();
        }

        // 2. UNIFIED GAPLESS SPEECH 🎤 (Single-Shot Mode)
        // Using "Smart Timer" for Cinema-Style Subtitles (Robust & Fast)
        // 2. UNIFIED GAPLESS SPEECH 🎤 (Single-Shot Mode)
        // Using "Smart Timer" for Cinema-Style Subtitles (Robust & Fast)
        const rawTtsText = (response.voiceText || response.text || "").trim(); // Keep raw for logic
        let ttsText = rawTtsText
            .replace(/^\s*<speak>/i, '').replace(/<\/speak>\s*$/i, '')
            .replace(/[*#_~]/g, '') // Strip all markdown formatting symbols
            .replace(/[\[\`]?\w+\(.*?\)[\]\`\.]?/g, '') // Remove function calls from speech
            .replace(/askToWrite|drawOnBoard|showQuiz/g, '')
            .trim();

        // Prepare Subtitles
        const cleanFullText = ttsText
            .replace(/<[^>]+>/g, '')  // Remove SSML tags
            .replace(/[\[\`]?\w+\(.*?\)[\]\`\.]?/g, '') // Remove function calls like [askToWrite(...)]
            .replace(/askToWrite|drawOnBoard|showQuiz/g, ''); // Remove stray function names

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

            // Just speak the clean text (google handles pauses naturally)
            // No marks needed for audio, simpler request
            await arabicVoiceService.speak(ttsText, {
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
            // 1. MULTI-DRAWING DETECTION (Teacher Drawing)
            // Extract all matches of drawOnBoard(item='...')
            const drawMatches = [...rawTtsText.matchAll(/drawOnBoard\(item=['"]?([a-zA-Z0-9_\u0600-\u06FF]+)['"]?\)/g)];
            const textDrawMatches = [];

            // Also check for natural language drawing intents if no code matches or in addition
            const extendedKeywords = [...drawingKeywords, 'سأقوم برسم', 'انظر للسبورة', 'لنبدا برسم', 'لنرسم', 'برسم', 'سأكتب', 'لنكتب'];
            if (extendedKeywords.some(kw => normText.includes(normalize(kw))) && drawMatches.length === 0) {
                const letterMatch = normText.match(/حرف\s+[\("']?([\u0600-\u06FF]+)[\)"']?/);
                if (letterMatch && letterMatch[1]) {
                    textDrawMatches.push(letterMatch[1]);
                }
            }

            // Execute all drawings found
            const allItemsToDraw = [...drawMatches.map(m => m[1]), ...textDrawMatches];
            let teacherDidDraw = allItemsToDraw.length > 0;

            allItemsToDraw.forEach((item, index) => {
                let finalItem = item;
                // Mapping if it's a letter name
                // Mapping from English/Phonetic names to Arabic characters
                const nameMap = {
                    'الف': 'أ', 'باء': 'ب', 'تاء': 'ت', 'ثاء': 'ث', 'جيم': 'ج', 'حاء': 'ح', 'خاء': 'خ', 'دال': 'د', 'ذال': 'ذ', 'راء': 'ر', 'زاي': 'ز', 'سين': 'س', 'شين': 'ش', 'صاد': 'ص', 'ضاد': 'ض', 'طاء': 'ط', 'ظاء': 'ظ', 'عين': 'ع', 'غين': 'غ', 'فاء': 'ف', 'قاف': 'ق', 'كاف': 'ك', 'لام': 'ل', 'ميم': 'م', 'نون': 'ن', 'هاء': 'ه', 'واو': 'و', 'ياء': 'ي',
                    // English placeholders
                    'a': 'أ', 'b': 'ب', 't': 'ت', 'th': 'ث', 'j': 'ج', 'h': 'ح', 'kh': 'خ', 'd': 'د', 'z': 'ز', 'r': 'ر', 's': 'س', 'sh': 'ش', 'S': 'ص', 'D': 'ض', 'T': 'ط', 'Z': 'ظ', 'E': 'ع', 'G': 'غ', 'f': 'ف', 'q': 'ق', 'k': 'ك', 'l': 'ل', 'm': 'م', 'n': 'ن', 'w': 'و', 'y': 'ي'
                };
                if (finalItem.startsWith('letter_')) finalItem = finalItem.replace('letter_', '');
                finalItem = nameMap[finalItem] || finalItem;

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
                    if (codeMatch && codeMatch[1]) {
                        setWritingLetter(codeMatch[1]);
                    } else {
                        const letterMatch = fullCleanText.match(/حرف\s+([\u0600-\u06FF]+)/);
                        if (letterMatch && letterMatch[1]) {
                            let extracted = letterMatch[1];
                            if (extracted === 'ألف') extracted = 'أ';
                            if (extracted === 'باء') extracted = 'ب';
                            setWritingLetter(extracted.charAt(0));
                        }
                    }
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
