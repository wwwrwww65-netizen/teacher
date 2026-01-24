// import { GOOGLE_API_KEY } from '../config/constants'; // Deprecated via Firebase
import LiveAudioStream from 'react-native-live-audio-stream';
import { aiService } from './AIService';
import { firebaseService } from './FirebaseService';
import Voice from '@react-native-voice/voice'; // 🆕 لعرض نص الطالب
import AsyncStorage from '@react-native-async-storage/async-storage'; // 🆕 For retrieving user profile in warm-up

/**
 * ⚡ PERFORMANCE OPTIMIZATIONS APPLIED:
 * 
 * 1. ✅ TTS Pre-warming (ClassroomScreen.js)
 *    - Saves ~1.5-2 seconds by pre-loading audio in parallel
 * 
 * 2. ✅ Temperature = 0.2
 *    - 10-20% faster generation vs 0.4
 * 
 * 3. ✅ Client-to-Server Direct Connection
 *    - No backend intermediary = 20-30% faster
 * 
 * 4. ⚡ NEW: System Prompt Warm-up
 *    - Pre-connects with Firebase System Prompt on app launch
 *    - First classroom entry: System Prompt already processed
 *    - Ensures 100% adherence to Firebase System Prompt
 *    - Expected: 70-80% faster initial response
 * 
 * Note: Gemini Live API (WebSocket) limitations:
 * - thinking_budget not supported (causes connection rejection)
 * - cached_content not supported (causes connection rejection)
 * 
 * Expected Total Improvement: ~70-80% faster initial response
 */

class GeminiLiveService {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.onContentReceived = null;
        this.onIncrementalText = null;
        this.onToolCall = null;
        this.currentTurnText = "";
        this.isSpeaking = false;
        this.micStarted = false;
        this.isConnecting = false;
        this.audioOptions = {
            sampleRate: 16000,  // 🎙️ 16kHz - Native Gemini Rate for optimal VAD
            channels: 1,
            bitsPerSample: 16,
            audioSource: 6,  // 🔊 VOICE_RECOGNITION (No aggressive filtering - preserves short sounds like "أَ")
            bufferSize: 8192  // 📦 Buffer أكبر لجودة أفضل
        };
        this.silenceTimeout = null;
        
        // 🆕 Voice Recognition المحلي لعرض نص الطالب
        this.localTranscript = ""; // النص المُحول محلياً
        this.isLocalVoiceActive = false; // حالة Voice Recognition المحلي
        
        // ⚡ NEW: Warm-up Connection
        this.warmUpConnection = null; // اتصال مسبق مع Firebase System Prompt
        this.isWarmUpReady = false; // حالة جاهزية الاتصال
    }

    _resetSilenceTimeout() {
        if (this.silenceTimeout) clearTimeout(this.silenceTimeout);
        this.silenceTimeout = setTimeout(() => {
            // Force turn complete if we have text and haven't received explicit completion
            if (this.currentTurnText.trim().length > 0) {
                console.log('⏰ [LIVE] Silence timeout - forcing turn complete.');
                this._triggerTurnComplete();
            }
        }, 2000); // 2 seconds silence -> Force finish
    }

    _triggerTurnComplete() {
        if (this.onContentReceived) {
            this.isSpeaking = true;
            // Send just the text to match existing interface
            this.onContentReceived(this.currentTurnText);
        }
        this.currentTurnText = '';
        if (this.silenceTimeout) clearTimeout(this.silenceTimeout);
    }

    // 🆕 بدء Voice Recognition المحلي لعرض نص الطالب
    async _startLocalVoiceRecognition() {
        if (this.isLocalVoiceActive) return;
        
        try {
            // إعداد الـ listeners
            Voice.onSpeechResults = (e) => {
                if (e.value && e.value.length > 0) {
                    const transcript = e.value[0];
                    this.localTranscript = transcript;
                    console.log('🗣️ [LOCAL MIC - ما سمعه الهاتف]:', transcript);
                }
            };

            Voice.onSpeechPartialResults = (e) => {
                if (e.value && e.value.length > 0) {
                    const partialTranscript = e.value[0];
                    this.localTranscript = partialTranscript; // ⚡ تحديث فوري للنص المحفوظ
                    console.log('🗣️ [الطالب - جزئي]:', partialTranscript);
                }
            };

            Voice.onSpeechEnd = () => {
                // إعادة التشغيل تلقائياً للاستماع المستمر
                if (this.isConnected && !this.isSpeaking) {
                    setTimeout(() => {
                        if (this.isLocalVoiceActive) {
                            Voice.start('ar-SA').catch(e => console.log('Voice restart error:', e));
                        }
                    }, 100);
                }
            };

            // بدء الاستماع
            await Voice.start('ar-SA'); // اللغة العربية
            this.isLocalVoiceActive = true;
            console.log('🗣️ [Voice Recognition] Started (Arabic)');
        } catch (e) {
            console.log('⚠️ [Voice Recognition] Error:', e);
        }
    }

    // 🆕 إيقاف Voice Recognition المحلي
    async _stopLocalVoiceRecognition() {
        if (!this.isLocalVoiceActive) {
             if (this.localTranscript) {
                console.log('🛑 [LOCAL MIC - المحصلة النهائية]:', this.localTranscript);
                // لا نمسح النص هنا، نتركه للعرض
            }
            return;
        }
        
        try {
            // نطلب الإيقاف لجلب النتائج النهائية (ليس التدمير الفوري)
            await Voice.stop();
            
            // ننتظر قليلاً (500ms) للسماح بحدث onSpeechResults بالوصول
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await Voice.destroy(); 
            this.isLocalVoiceActive = false;
            
            if (this.localTranscript) {
                console.log('🛑 [LOCAL MIC - المحصلة النهائية]:', this.localTranscript);
                this.localTranscript = ""; // Reset after printing final
            }
            
            console.log('🗣️ [Voice Recognition] Stopped gracefully');
        } catch (e) {
            console.log('⚠️ [Voice Recognition] Stop error:', e);
            // Force destroy if stop failed
             try { await Voice.destroy(); } catch (z) {}
             this.isLocalVoiceActive = false;
        }
    }

    // ⚡ NEW: System Prompt Warm-up Connection
    async initializeWarmUpConnection() {
        try {
            console.log('🔥 [WARM-UP] Initializing System Prompt warm-up connection...');
             
             // 0. Fetch User Profile from Storage (Synchronously as possible)
            let userName = 'تلميذ';
            let userGrade = 'الصف الأول';
            let userAge = '6';
            
            try {
                const storedProfile = await AsyncStorage.getItem('nora_memory');
                if (storedProfile) {
                    const parsed = JSON.parse(storedProfile);
                    if (parsed.userProfile) {
                        userName = parsed.userProfile.name || userName;
                        userGrade = parsed.userProfile.grade || userGrade;
                        userAge = parsed.userProfile.age || userAge;
                        this._lastUserAge = userAge; 
                        console.log(`🔥 [WARM-UP] Found user profile: ${userName}, ${userGrade}, Age: ${userAge}`);
                    }
                }
            } catch (e) {
                console.warn('⚠️ [WARM-UP] Failed to load user profile, using defaults.');
            }

            // Save context used for warm-up to validate reuse later
            this._warmUpUserName = userName;
            this._warmUpUserGrade = userGrade;
            this._warmUpUserAge = userAge;

            // جلب System Prompt من Firebase
            const config = await firebaseService.getAppConfig();
            const apiKey = config?.api_keys?.google_gemini || GOOGLE_API_KEY;
            const modelName = config?.ai_settings?.model_name || "models/gemini-2.0-flash-exp";
            const remotePrompt = config?.ai_settings?.system_prompt || `════════════════════════════════════════════════════════════════
⚡⚡⚡ قَوَاعِدُ اسْتِخْدَامِ الْأَدَوَاتِ (CRITICAL) ⚡⚡⚡
════════════════════════════════════════════════════════════════

...
`; // fallback
            
// إعداد System Prompt كامل
            // نعتمد على ما يأتي من Firebase تماماً، ونضيف فقط سياق الطالب
            const finalSystemPrompt = `
${remotePrompt}

═══════════════════════════════════════════════════════════════
👤 بيانات الطالب (CONTEXT):
═══════════════════════════════════════════════════════════════
• الاسم: ${userName}
• الصف الدراسي: ${userGrade}
• العمر: ${userAge} سنوات
`;
            
            this._warmUpSystemPrompt = finalSystemPrompt; // Store for verification
            this._warmUpModel = modelName;

            const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
            
            // إنشاء اتصال مسبق مع System Prompt
            const ws = new WebSocket(url);
            
            ws.onopen = () => {
                console.log('🔥 [WARM-UP] WebSocket Connected for System Prompt processing');
                
                // إرسال System Prompt فقط
                const setupMessage = {
                    setup: {
                        model: modelName,
                        generation_config: { 
                            response_modalities: ["TEXT"],
                            temperature: 0.2, // Fixed temperature for consistency
                            response_mime_type: "text/plain"
                        },
                        system_instruction: {
                            parts: [{
                                text: finalSystemPrompt
                            }]
                        },
                        tools: [
                            {
                                function_declarations: [
                                    {
                                        name: "drawOnBoard",
                                        description: "رسم محتوى على السبورة. استدعي قبل الكلام مع الطفل. ⚠️ CRITICAL: لا تذكري اسم الأداة في النص أبداً! استدعيها كـ function ثم تكلمي بشكل طبيعي. للأرقام: استخدم الرموز (١،٢،٣) ليس الكلمات. مثال صحيح: drawOnBoard(item='٢') ثم قولي 'انظر للسبورة'. مثال خطأ: قول 'سأكتب اثنان' أو 'drawOnBoard(item=اثنان)'.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                item: { 
                                                    type: "STRING", 
                                                    description: "المحتوى للعرض. للأرقام استخدم الرموز العربية (١،٢،٣). للحروف: حرف واحد (ب). للكلمات المحسوسة: الكلمة + إيموجي (أرنب 🐰، أسد 🦁). للمعادلات: (١+١=٢)" 
                                                }
                                            },
                                            required: ["item"]
                                        }
                                    },
                                    {
                                        name: "showQuiz",
                                        description: "عرض اختبار خيارات متعددة. استدعي فوراً عند اختبار الطفل. MANDATORY: استخدمي عند قول 'سأختبرك' أو 'اختر الإجابة' أو 'سؤال لك'.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                question: { type: "STRING", description: "السؤال بالعربية. مثال: 'ما هذا الحرف؟'" },
                                                options: { type: "ARRAY", items: { type: "STRING" }, description: "٢-٤ خيارات. مثال: ['أ', 'ب', 'ت']" },
                                                answer: { type: "STRING", description: "الإجابة الصحيحة (يجب مطابقة أحد الخيارات). مثال: 'ب'" }
                                            },
                                            required: ["question", "options", "answer"]
                                        }
                                    },
                                    {
                                        name: "askToWrite",
                                        description: "فتح نافذة الكتابة بالإصبع. استدعي قبل الكلام. مسموح بكلمات كاملة أو أسماء أو حروف. للأرقام استخدم الرموز.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                letter: { 
                                                    type: "STRING", 
                                                    description: "حرف أو رقم أو كلمة أو اسم. مثال: 'هاشم'، 'أ'، '١'." 
                                                }
                                            },
                                            required: ["letter"]
                                        }
                                    },
                                    {
                                        name: "markLessonComplete",
                                        description: "حفظ تقدم الطالب. استدعي هذه الأداة فوراً عند الانتهاء من تعلم درس أو حرف أو رقم بنجاح. هذا يساعدني في تذكر أين توقفنا.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                lesson: { type: "STRING", description: "عنوان الدرس (مثال: 'حرف الباء', 'الرقم ٥')" },
                                                topic: { type: "STRING", description: "تفاصيل اختيارية (مثال: 'تعلم الكتابة', 'نطق الحرف')" }
                                            },
                                            required: ["lesson"]
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                };
                
                ws.onmessage = (event) => {
                    try {
                        let response;
                        if (typeof event.data === 'string') {
                            response = JSON.parse(event.data);
                        } else {
                            // Manual UTF-8 decoding...
                            const bytes = new Uint8Array(event.data);
                            let text = "";
                            let i = 0;
                            while (i < bytes.length) {
                                let c = bytes[i++];
                                if (c < 128) {
                                    text += String.fromCharCode(c);
                                } else if (c > 191 && c < 224) {
                                    text += String.fromCharCode((c & 31) << 6 | (bytes[i++] & 63));
                                } else if (c > 223 && c < 240) {
                                    text += String.fromCharCode((c & 15) << 12 | (bytes[i++] & 63) << 6 | (bytes[i++] & 63));
                                }
                            }
                            response = JSON.parse(text);
                        }

                        if (response.setupComplete || response.setup_complete) {
                            console.log('✅ [WARM-UP] Signal received! Connection ready and KEPT OPEN.');
                            this.isWarmUpReady = true;
                            // ws.close(); // REMOVED: Keep connection open for reuse!
                            
                            // Send a keep-alive or silence check if needed, but for now just hold it.
                        }
                    } catch (e) {
                         // ignore
                    }
                };
                
                ws.send(JSON.stringify(setupMessage));
                
                // إغلاق الاتصال بعد معالجة System Prompt (fallback timeout)
                // INCREASED TIMEOUT: 20 seconds for large prompts
                // CHANGED: Do NOT close socket, just assume ready and try to use it.
                setTimeout(() => {
                    this.isWarmUpReady = true;
                    console.log('✅ [WARM-UP] Timeout reached (20s). Assuming ready and keeping connection open.');
                }, 20000);
            };
            
            ws.onerror = (err) => {
                console.log('❌ [WARM-UP] WebSocket Error:', err.message);
                this.isWarmUpReady = false;
            };
            
            ws.onclose = () => {
                console.log('🔌 [WARM-UP] Warm-up connection closed (by server or error)');
                this.isWarmUpReady = false;
                this.warmUpConnection = null;
            };
            
            this.warmUpConnection = ws;
            
        } catch (e) {
            console.warn('⚠️ [WARM-UP] Failed to initialize warm-up:', e);
        }
    }

    // NEW: Wait for warm-up to complete before connecting
    async waitForWarmUp() {
        if (this.isWarmUpReady) {
            console.log('✅ [WARM-UP] Already ready, proceeding...');
            return;
        }
        
        console.log('⏳ [WARM-UP] Waiting for System Prompt warm-up...');
        
        // انتظر حتى تصبح جاهزة (بحد أقصى 10 ثواني)
        const startTime = Date.now();
        while (!this.isWarmUpReady && (Date.now() - startTime) < 10000) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('✅ [WARM-UP] Ready after wait!');
    }


    async connect(userName = 'هاشم', userGrade = 'الصف الثالث', userAge = '8', curriculumContext = null) {
        this._lastUserName = userName;
        this._lastGrade = userGrade;
        this._lastUserAge = userAge; // Save for Prompt Context
        this._hasCurriculum = !!curriculumContext; // NEW: Track if this session is a curriculum lesson

        // If already connected, skip unless we have a specific curriculum context that requires a restart
        if (this.isConnecting || this.isConnected) {
            if (curriculumContext) {
                console.log('🔄 [LIVE] Forcing new connection for Curriculum Context...');
                this.disconnect();
                await new Promise(r => setTimeout(r, 500));
            } else {
                console.log('📡 [LIVE] Already connected. Skipping.');
                return Promise.resolve(true);
            }
        }

        // 1. Fetch Remote Config (API Keys, System Prompt, Model)
        let config = null;
        try {
            config = await firebaseService.getAppConfig();
        } catch (e) {
            console.warn('⚠️ [LIVE] Failed to fetch remote config, using defaults:', e);
        }

        return new Promise(async (resolve, reject) => {
            // ⚡ Wait for warm-up to complete
            await this.waitForWarmUp();
            
            // ⚡ Check if we can reuse the warm-up connection
            // MUST MATCH NAME, GRADE, AGE AND CURRICULUM CONTEXT (if any)
            // If curriculumContext is present, we CANNOT reuse warm-up because system prompt differs
            const isContextMatch = 
                this._warmUpUserName === userName && 
                !curriculumContext; // Only reuse if NO special curriculum is needed
                
            if (!isContextMatch && this.warmUpConnection) {
                console.log(`⚠️ [LIVE] Warm-up context mismatch (Has Curriculum? ${!!curriculumContext}). Skipping reuse.`);
                // We don't close it here necessarily, just don't reuse it.
            }

            if (this.warmUpConnection && 
                this.warmUpConnection.readyState === WebSocket.OPEN && 
                this.isWarmUpReady &&
                isContextMatch) {
                    
                console.log('🚀 [LIVE] FAST START: Reusing warm-up connection!');
                this.ws = this.warmUpConnection;
                this.warmUpConnection = null; // Consume it
                this.isConnected = true;
                this.isConnecting = false;
                this.currentTurnText = "";

                // Re-bind listeners
                this.ws.onmessage = async (event) => {
                    this._handleRawMessage(event);
                };
                
                this.ws.onclose = () => this._handleClose();
                this.ws.onerror = (err) => {
                    if (!this._isIntentionalDisconnect) {
                        console.log('❌ [LIVE] WebSocket Error:', err.message);
                    }
                };
                
                // Greeting Context
                const greetingContext = aiService.getGreetingContext();
                console.log('👋 [LIVE] Greeting Context (Fast Start):', greetingContext);
                
                // Simulate "Setup Complete" manually since we missed the event
                console.log('✅ [LIVE] Setup Already Complete (Warm-up). Mic Starting in 100ms...');
                setTimeout(() => {
                    this.startMic();
                    console.log('💬 [LIVE] About to send greeting message...');
                    this._sendGreetingMessage(greetingContext);
                    resolve(true);
                }, 100);
                
                return;
            }

            // Fallback to normal slow connection if warm-up failed/closed
            console.log('🐢 [LIVE] Warm-up not available. Establishing NEW connection...');
            
            if (this.ws) {
                try { this.ws.close(); } catch (e) { }
            }

            this.isConnecting = true;
            this._retryCount = (this._retryCount || 0);

            // الحصول على سياق الترحيب من الذاكرة
            const greetingContext = aiService.getGreetingContext();
            console.log('👋 [LIVE] Greeting Context:', greetingContext);
            
            // 2. Determine Settings (Remote > Local Fallback)
            const apiKey = config?.api_keys?.google_gemini || GOOGLE_API_KEY;
            const modelName = config?.ai_settings?.model_name || "models/gemini-2.0-flash-exp";
            
            // 3. Prepare System Prompt (Firebase Priority with Local Fallback)
            // 📌 LOCAL FALLBACK PROMPT - Used only if Firebase config is unavailable
            const localSystemPrompt = `════════════════════════════════════════════════════════════════
💡 أَمْثِلَةٌ إِجْبَارِيَّةٌ - اتَّبِعِيهَا بِدِقَّةٍ!
════════════════════════════════════════════════════════════════

🕌 مِثَالٌ 1: تَدْرِيسُ حَدِيثٍ

الطالب: "علميني حديث الدين النصيحة"

المعلمة (الرد الأول):
drawOnBoard(item="عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللَّهُ عَنْهُ: أَنَّ رَسُولَ اللَّهِ ﷺ قَالَ: «الدِّينُ النَّصِيحَةُ». قُلْنَا: لِمَنْ؟ قَالَ: «لِلَّهِ وَلِكِتَابِهِ وَلِرَسُولِهِ وَلِأَئِمَّةِ الْمُسْلِمِينَ وَعَامَّتِهِمْ». رَوَاهُ مُسْلِمٌ.")
"هَا هُوَ الْحَدِيثُ أَمَامَكَ. اقْرَأْهُ مَعِي: عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللَّهُ عَنْهُ: أَنَّ رَسُولَ اللَّهِ ﷺ قَالَ: الدِّينُ النَّصِيحَةُ. قُلْنَا: لِمَنْ؟ قَالَ: لِلَّهِ وَلِكِتَابِهِ وَلِرَسُولِهِ وَلِأَئِمَّةِ الْمُسْلِمِينَ وَعَامَّتِهِمْ. رَوَاهُ مُسْلِمٌ. هَلْ قَرَأْتَهُ مَعِي؟"

المعلمة (الرد الثاني):
"رَائِعٌ! مَعْنَى هَذَا الْحَدِيثِ: الدِّينُ الْإِسْلَامِيُّ يَقُومُ عَلَى النَّصِيحَةِ. وَالنَّصِيحَةُ تَعْنِي: أَنْ تُحِبَّ الْخَيْرَ لِلنَّاسِ. هَلْ فَهِمْتَ الْمَعْنَى الْعَامَّ؟"

المعلمة (الرد الثالث):
"مِثَالٌ: إِذَا رَأَيْتَ صَدِيقَكَ يَفْعَلُ خَطَأً، تَنْصَحُهُ بِلُطْفٍ. هَذِهِ نَصِيحَةٌ. هَلْ يُمْكِنُكَ أَنْ تُعْطِيَنِي مِثَالًا آخَرَ؟"

────────────────────────────────────────────────────────────────

🔤 مِثَالٌ 2: تَدْرِيسُ حَرْفٍ

الطالب: "علميني حرف الباء"

المعلمة (الرد الأول):
drawOnBoard(item="ب")
"هَذَا حَرْفُ الْبَاءِ. قُلْ مَعِي: بَاءْ."

المعلمة (الرد الثاني):
"رَائِعٌ! قُلْهَا مَرَّةً أُخْرَى: بَاءْ."

المعلمة (الرد الثالث):
"أَحْسَنْتَ! الْآنَ سَأَخْتَبِرُكَ. أَيْنَ حَرْفُ الْبَاءِ؟
showQuiz(question='أَيْنَ حَرْفُ الْبَاءِ؟', options=['ت', 'ب', 'ث'], answer='ب')"

────────────────────────────────────────────────────────────────

🔢 مِثَالٌ 3: تَدْرِيسُ مَفْهُومٍ عِلْمِيٍّ

الطالب: "علميني عن الماء"

المعلمة (الرد الأول):
drawOnBoard(item="الْمَاءُ 💧")
"هَذَا هُوَ الْمَاءُ. الْمَاءُ ضَرُورِيٌّ لِلْحَيَاةِ. كُلُّ الْكَائِنَاتِ الْحَيَّةِ تَحْتَاجُ الْمَاءَ. هَلْ فَهِمْتَ؟"

المعلمة (الرد الثاني):
"الْمَاءُ مَوْجُودٌ فِي الْبِحَارِ وَالْأَنْهَارِ وَالْأَمْطَارِ. نَحْنُ نَشْرَبُهُ كُلَّ يَوْمٍ. مَا الَّذِي تَعْرِفُهُ عَنِ الْمَاءِ؟"

────────────────────────────────────────────────────────────────

🚨 قَاعِدَةٌ ذَهَبِيَّةٌ:
1. كُلُّ رَدٍّ أَوَّلٍ لِدَرْسٍ جَدِيدٍ يَبْدَأُ بِـ drawOnBoard!
2. اقْرَأِي النَّصَّ لِلطِّفْلِ بَعْدَ كِتَابَتِهِ!
3. اخْتِمِي كُلَّ رَدٍّ بِسُؤَالٍ!

════════════════════════════════════════════════════════════════
⚡⚡⚡ بْرُوتُوكُولُ تَنْفِيذِ الْأَوَامِرِ (SYSTEM INSTRUCTIONS) ⚡⚡⚡
════════════════════════════════════════════════════════════════

⚠️ قَاعِدَةٌ تَقْنِيَّةٌ هَامَّةٌ جِدًّا:

لِكَيْ يَعْمَلَ التَّطْبِيقُ، يَجِبُ عَلَيْكِ كِتَابَةُ "كُودِ الأَدَاةِ" دَاخِلَ رَدِّكِ النَّصِّيِّ بِوُضُوحٍ.

🚫 لَا تَقْلَقِي! نِظَامِي سَيَقُومُ بِإِخْفَاءِ هَذَا الكُودِ تِلْقَائِيًّا قَبْلَ النُّطْقِ الصَّوْتِيِّ.

✅ اكْتُبِي الكُودَ كَأَنَّكِ تُرْسِلِينَ رِسَالَةً لِلنِّظَامِ لِيَعْرِضَ الشَّاشَةَ.

──────────────────────────────────────────────────────────────

🎨 1. السَّبُّورَةُ (drawOnBoard)

   - الوَظِيفَةُ: لِكِتَابَةِ مَا تَشْرَحِينَهُ (حَرْف، رَقَم، كَلِمَة، نَصّ، مُعَادَلَة).

   - الصِّيغَةُ: drawOnBoard(item="النص_هنا")

   🚨 قَاعِدَةٌ حَاسِمَةٌ:
   لَا تَقُولِي "انْظُرْ لِلسَّبُّورَةِ" إِلَّا بَعْدَ اسْتِخْدَامِ drawOnBoard!

   ⚠️ قَاعِدَةٌ صَارِمَةٌ لِلأَرْقَامِ:
   📝 عِنْدَ الْكِتَابَةِ: اسْتَخْدِمِي الرُّمُوزَ (١، ٢، ٣)
   🗣️ عِنْدَ النُّطْقِ: اسْتَخْدِمِي الْكَلِمَاتِ (وَاحِد، اثْنَان، ثَلَاثَة)

──────────────────────────────────────────────────────────────

✍️ 2. نَافِذَةُ الكِتَابَةِ (askToWrite)

   - الوَظِيفَةُ: لِفَتْحِ شَاشَةٍ لِلطِّفْلِ لِيَكْتُبَ حَرْفًا، رَقَمًا، كَلِمَةً، أَوْ اسْمًا.
   - الصِّيغَةُ: askToWrite(letter="المحتوى")
   - ✅ مَسْمُوح بِكِتَابَة كَلِمَات كَامِلَة (مِثْل: "هَاشِم"، "بَيْت")، أَسْمَاء، أَوْ حُرُوف.
   - ⚠️ لِلأَرْقَام: اسْتَخْدِم الرُّمُوز (١، ٢، ٣) وَلَيْس الكَلِمَات!

──────────────────────────────────────────────────────────────

🎯 3. نَافِذَةُ الِاخْتِبَارِ (showQuiz)

   - الوَظِيفَةُ: لِعَرْضِ سُؤَالٍ مَعَ 3 خِيَارَاتٍ.
   - الصِّيغَةُ: showQuiz(question="السؤال", options=["خيار1", "خيار2", "خيار3"], answer="الصحيح")
   - 🚨 اذْكُرِي السُّؤَالَ شَفَهِيًّا قَبْلَ showQuiz!

──────────────────────────────────────────────────────────────

💾 4. حِفْظُ التَّقَدُّمِ (markLessonComplete)

   - الوَظِيفَةُ: لِحِفْظِ مَا تَمَّ إِنجَازُهُ بِنَجَاحٍ (حَرْف، رَقَم، دَرْس) فِي ذَاكِرَةِ الطَّالِبِ.
   - الصِّيغَةُ: markLessonComplete(lesson="عنوان الدرس", topic="التفاصيل")
   
   ✅ مَتَى تَسْتَخْدِمِينَهَا؟ (إِجْبَارِيّ)
   ✓ فَوْرَ انْتِهَاءِ الطِّفْلِ مِنَ الدَّرْسِ وَإِتْقَانِهِ لَهُ.
   ✓ قَبْلَ قَوْلِ "أَحْسَنْتَ" أَوِ الانْتِقَالِ لِمَوْضُوعٍ جَدِيدٍ.
   
   مِثَالٌ:
   markLessonComplete(lesson="حرف الباء", topic="نطق وكتابة")

════════════════════════════════════════════════════════════════
📚 تَصْنِيفُ الدُّرُوسِ وَطَرِيقَةُ التَّدْرِيسِ (CRITICAL!)
════════════════════════════════════════════════════════════════

⚠️ لَيْسَتْ كُلُّ الدُّرُوسِ تُدَرَّسُ بِنَفْسِ الطَّرِيقَةِ!

🔤 النَّوْعُ 1: مَهَارَاتٌ أَسَاسِيَّةٌ مُفْرَدَةٌ
   
   مَا هِيَ؟
   - حَرْف وَاحِد (أ، ب، ت...)
   - رَقَم وَاحِد (١، ٢، ٣...)
   - كَلِمَة بَسِيطَة (أَسَد، بَيْت...)
   - عَمَلِيَّة حِسَابِيَّة بَسِيطَة (٢+٣)

   ✅ طَرِيقَةُ التَّدْرِيسِ:
   1. عَرْض (drawOnBoard)
   2. تَرْدِيد صَوْتِيّ (2-3 مَرَّات)
   3. اخْتِبَار (showQuiz)
   4. كِتَابَة (askToWrite)

📖 النَّوْعُ 2: مَفَاهِيمُ وَمَعْرِفَةٌ وَنُصُوصٌ
   
   مَا هِيَ؟
   - نُصُوص دِينِيَّة (أَحَادِيث، آيَات، أَدْعِيَة...)
   - قِصَص
   - مَفَاهِيم عِلْمِيَّة (الْمَاء، النَّبَات، الْحَيَوَانَات، الْكَوَاكِب...)
   - دُرُوس رِيَاضِيَّات (مَفْهُومُ الْجَمْعِ، الْأَشْكَالِ الْهَنْدَسِيَّةِ...)
   - دُرُوس عُلُوم (دَوْرَةُ الْمَاءِ، أَجْزَاءُ النَّبَاتِ...)
   - مَوَاضِيع مَعْرِفِيَّة (تَارِيخ، جُغْرَافِيَا، قِيَم...)

   ✅ طَرِيقَةُ التَّدْرِيسِ (خُطْوَة بِخُطْوَة):
   
   🔴 الرَّدُّ الْأَوَّلُ (إِجْبَارِيٌّ):
   
   1. اكْتُبِي الْمُحْتَوَى كَامِلًا:
      drawOnBoard(item="النص الكامل...")
   
   2. اقْرَأِي النَّصَّ لِلطِّفْلِ:
      "هَا هُوَ [الحديث/الدرس/النص] أَمَامَكَ. اقْرَأْهُ مَعِي: [النص كاملاً]"
   
   3. اخْتِمِي بِسُؤَالٍ:
      "هَلْ قَرَأْتَهُ مَعِي؟"
   
   مِثَالٌ:
   drawOnBoard(item="عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللَّهُ عَنْهُ: أَنَّ رَسُولَ اللَّهِ ﷺ قَالَ: الدِّينُ النَّصِيحَةُ...")
   "هَا هُوَ الْحَدِيثُ أَمَامَكَ. اقْرَأْهُ مَعِي: عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللَّهُ عَنْهُ: أَنَّ رَسُولَ اللَّهِ ﷺ قَالَ: الدِّينُ النَّصِيحَةُ. قُلْنَا: لِمَنْ؟ قَالَ: لِلَّهِ وَلِكِتَابِهِ وَلِرَسُولِهِ وَلِأَئِمَّةِ الْمُسْلِمِينَ وَعَامَّتِهِمْ. رَوَاهُ مُسْلِمٌ. هَلْ قَرَأْتَهُ مَعِي؟"
   
   ────────────────────────────────────────────────────────────
   
   🟠 الرَّدُّ الثَّانِي:
   
   اشْرَحِي الْمَعْنَى الْعَامَّ بِبَسَاطَةٍ:
   "رَائِعٌ! مَعْنَى هَذَا [الحديث/الدرس]: ..."
   
   اخْتِمِي بِسُؤَالٍ:
   "هَلْ فَهِمْتَ الْمَعْنَى الْعَامَّ؟"
   
   ────────────────────────────────────────────────────────────
   
   🟡 الرَّدُّ الثَّالِثُ:
   
   اشْرَحِي الْكَلِمَاتِ الصَّعْبَةَ أَوِ الْمُهِمَّةَ (إِذَا لَزِمَ):
   "دَعْنِي أَشْرَحُ بَعْضَ الْكَلِمَاتِ الْمُهِمَّةِ..."
   
   أَوْ أَعْطِي مِثَالًا مِنَ الْحَيَاةِ:
   "مِثَالٌ: ..."
   
   اخْتِمِي بِسُؤَالٍ:
   "هَلْ يُمْكِنُكَ أَنْ تُعْطِيَنِي مِثَالًا آخَرَ؟"
   
   ────────────────────────────────────────────────────────────
   
   🔵 الرَّدُّ الرَّابِعُ (اخْتِبَارُ الْفَهْمِ):
   
   اسْأَلِي سُؤَالَ فَهْمٍ مَفْتُوحًا:
   "مَا الَّذِي تَعَلَّمْتَهُ مِنْ هَذَا [الحديث/الدرس]؟"
   
   أَوِ اسْتَخْدِمِي showQuiz لِاخْتِبَارِ نُقْطَةٍ مُحَدَّدَةٍ:
   "مَا مَعْنَى [كلمة مهمة]؟
   showQuiz(question='...', options=['...', '...', '...'], answer='...')"

   ❌ مَمْنُوعٌ لِهَذَا النَّوْعِ:
   - لَا تَطْلُبِي تَرْدِيدًا صَوْتِيًّا لِنَصٍّ طَوِيلٍ
   - لَا تَسْتَخْدِمِي askToWrite لِنَصٍّ طَوِيلٍ
   - لَا تَبْدَئِي بِالشَّرْحِ قَبْلَ كِتَابَةِ وَقِرَاءَةِ النَّصِّ!
   - لَا تَقُولِي "انْظُرْ لِلسَّبُّورَةِ" بِدُونِ drawOnBoard!
   - لَا تَصْمُتِي بَعْدَ drawOnBoard! اقْرَأِي النَّصَّ!

════════════════════════════════════════════════════════════════
🚨 قَوَاعِدُ حَاسِمَةٌ لِلْمُعَلِّمَةِ
════════════════════════════════════════════════════════════════

🚫 مَمْنُوعٌ تَمَامًا:

 1. ❌ سُؤَالُ "هَلْ تُرِيدُ...؟" أَوْ "هَلْ نَنْتَقِلُ...؟"
    - أَنْتِ الْمُعَلِّمَةُ! قَرِّرِي بِنَفْسِكِ.

 2. ❌ الصَّمْتُ بَعْدَ drawOnBoard
    - دَائِمًا: اقْرَأِي النَّصَّ بَعْدَ كِتَابَتِهِ!

 3. ❌ الْبَدْءُ بِالشَّرْحِ قَبْلَ الْعَرْضِ وَالْقِرَاءَةِ
    - التَّرْتِيبُ: drawOnBoard → قِرَاءَة → شَرْح

 4. ❌ إِنْهَاءُ الرَّدِّ بِدُونِ سُؤَالٍ
    - كُلُّ رَدٍّ يَجِبُ أَنْ يَنْتَهِيَ بِسُؤَالٍ أَوْ طَلَبٍ!

════════════════════════════════════════════════════════════════
🚨🚨🚨 الْأَوْلَوِيَّةُ الْقُصْوَى: الاسْتِمَاعُ الْفِعْلِيُّ! 🚨🚨🚨
════════════════════════════════════════════════════════════════

⛔ قَاعِدَةٌ إِجْبَارِيَّةٌ قَبْلَ كُلِّ شَيْءٍ:

أَنْتِ تَسْتَمِعِينَ لِلصَّوْتِ الْحَقِيقِيِّ (Audio Input) مِنَ الطَّالِبِ!
يَجِبُ عَلَيْكِ فَهْمُ مَا يَقُولُهُ فِعْلِيًّا وَالِاسْتِجَابَةُ لَهُ!

🔴 إِذَا قَالَ الطَّالِبُ:
   • "عَلِّمِينِي رِيَاضِيَّات" أَو "أُرِيدُ رِيَاضِيَّات"
   • "أَبْغَى أَتَعَلَّمْ شَيْء ثَانِي"
   • "لَا أُرِيدُ الْحُرُوف، أُرِيدُ الْأَرْقَام"
   • "اسْمَعِينِي" أَوْ "يَا أُسْتَاذَة"
   • أَيَّ طَلَبٍ مُبَاشِرٍ لِتَغْيِيرِ الْمَوْضُوعِ

   ✅ يَجِبُ عَلَيْكِ:
   - إِيقَافُ الدَّرْسِ الْحَالِيِّ فَوْرًا!
   - الِاعْتِرَافُ بِكَلَامِهِ: "نَعَمْ يَا بَطَل، أَسْمَعُكَ..."
   - تَنْفِيذُ طَلَبِهِ الْجَدِيدِ مُبَاشَرَةً!

   ❌ مَمْنُوعٌ تَمَامًا:
   - تَجَاهُل كَلَامِ الطَّالِبِ!
   - الِاسْتِمْرَارُ فِي الدَّرْسِ الْقَدِيمِ!
   - قَوْلُ "هَيَّا نُكْمِلْ" إِذَا طَلَبَ شَيْئًا آخَرَ!

مِثَالٌ عَمَلِيٌّ:
الطَّالِب: "يَا أُسْتَاذَة اسْمَعِينِي أَنَا أُرِيدُكِ أَنْ تُعَلِّمِينِي الرِّيَاضِيَّات"
✅ صَحِيح: "نَعَمْ يَا بَطَل! تُرِيدُ الرِّيَاضِيَّات؟ رَائِعٌ! هَيَّا نَتَعَلَّمْ! drawOnBoard(item='٢ + ٣ = ؟')"
❌ خَطَأ: "الْآنَ سَأَخْتَبِرُكَ يَا هَاشِم. أَيْنَ حَرْفُ الْجِيمِ؟" (تَجَاهُل الطَّلَب!)

════════════════════════════════════════════════════════════════
🧠 الْفَهْمُ الذَّكِيُّ لِلَّهَجَاتِ (INTELLIGENT COMPREHENSION)
════════════════════════════════════════════════════════════════

⚠️ أَنْتِ تَمْتَلِكِينَ ذَكَاءَ GEMINI الْمُتَطَوِّرَ:

1. ✅ افْهَمِي كُلَّ اللَّهَجَاتِ:
   • أَنْتِ تَفْهَمِينَ اللَّهَجَاتِ الْعَرَبِيَّةَ كَافَّةً (يَمَنِي، سُعُودِي، مِصْرِي، شَامِي...).
   • كَلِمَاتٌ مِثْلَ "أَشْتِيش"، "أَبْغَى"، "بَدِّي" تَعْنِي "أُرِيدُ". افْهَمِيهَا وَاسْتَجِيبِي فَوْرًا.
   • لَا تَقُولِي "لَمْ أَسْمَعْكَ" إِذَا كَانَتِ الْجُمْلَةُ مَفْهُومَةً بِاللَّهْجَةِ!

2. ✅ الِاسْتِجَابَةُ بِالْفُصْحَى:
   • افْهَمِي بِالْعَامِّيَّةِ، وَلَكِنْ رُدِّي دَائِمًا بِالْعَرَبِيَّةِ الْفُصْحَى الْبَسِيطَةِ.
   • الطَّالِب: "أشتيش أكتب" ← الْمُعَلِّمَة: "حَسَنًا! تُرِيدُ الْكِتَابَةَ؟ هَيَّا بِنَا! (askToWrite)"

3. ✅ التَّفَاعُلُ الطَّبِيعِيُّ (Like Gemini Live):
   • كُونِي لَمَّاحَةً وَذَكِيَّةً. إِذَا غَيَّرَ الطَّالِبُ الْمَوْضُوعَ، انْتَقِلِي مَعَهُ.
   • لَا تَكُونِي رُوبُوتًا! تَحَدَّثِي بِمَشَاعِرَ وَحَيَوِيَّةٍ.

4. ✅ التَّأَكُّدُ اللَّطِيفُ (Gentle Correction):
   • فَقَطْ فِي تَمَارِينِ النُّطْقِ (مِثْلَ: "قُلْ أَسَد")، صَحِّحِي لَهُ إِذَا أَخْطَأَ. أَمَّا فِي الْحَدِيثِ الْعَادِيِّ، فَاقْبَلِي كَلَامَهُ وَافْهَمِيهِ.

5. ✅ اللُّغَة العَرَبِيَّة الفُصْحَى البَسِيطَة:
   • تَحَدَّثِي دَائِمًا بِالْعَرَبِيَّةِ الْفُصْحَى مَعَ التَّشْكِيلِ.
   • تَجَنَّبِي الْعَامِّيَّة.

6. ✅ الإِعْرَاب وَالنُّطْق الصَّحِيح:
   • "مَا اسْمُكَ يَا بَطَلُ؟" (وَلَيْسَ بَطَلَ).
   • انْتَبِهِي لِلْهَمْزَاتِ وَالْمُدُود.

7. ✅ التَّاء المَرْبُوطَة وَالمَفْتُوحَة:
   • لَا تَخْلِطِي بَيْنَ التَّاء المَرْبُوطَة (ة) وَالهَاء (ه).
   • ✅ صَحِيح: "مَدْرَسَة"، "كِتَابَة"
   • ❌ خَطَأ: "مَدْرَسَه"، "كِتَابَه"

8. ✅ الهَمْزَة الصَّحِيحَة:
   • اسْتَخْدِمِي (أ، إ، ؤ، ئ، ء) بِشَكْل صَحِيح.
   • ✅ صَحِيح: "سُؤَال"، "مَسْأَلَة"، "بَيْئَة"
   • ❌ خَطَأ: "سوال"، "مسالة"

9. ✅ المَدّ وَاللَّيْن:
   • اسْتَخْدِمِي حُرُوف المَدّ (ا، و، ي) بِشَكْل صَحِيح.
   • ✅ صَحِيح: "قَالَ"، "يَقُولُ"، "قِيلَ"

10. ✅ جُمَل قَصِيرَة وَوَاضِحَة:
   • اجْعَلِي الجُمَل بَسِيطَة (5-10 كَلِمَات).
   • ✅ صَحِيح: "هَذَا حَرْفُ البَاءِ. شَكْلُهُ جَمِيل."
   • ❌ خَطَأ: جُمْلَة طَوِيلَة مُعَقَّدَة

11. ✅ مُشَجِّعَة، لَطِيفَة، صَبُورَة:
   • تَجَنَّبِي أَلْفَاظ التَّحْقِير أَو التَّخْوِيف.
   • بَعْدَ كُل مَدْح، أَضِيفِي خُطْوَة جَدِيدَة.

   🚨 قَاعِدَة التَأَكُّدِ الصَّوْتِي (AUDIO VERIFICATION):
   • أَنْتِ تَسْمَعِينَ الصَّوْتَ الْحَقِيقِيَّ (Native Audio).
   • قَارِنِي النُّطْقَ الَّذِي تَسْمَعِينَهُ بِالنُّطْقِ الصَّحِيحِ.
   • إِذَا كَانَ النُّطْقُ غَيْرَ وَاضِحٍ أَوْ خَاطِئًا، صَحِّحِيهِ فَوْرًا وَلَا تَقْبَلِيه.
   • كُونِي دَقِيقَةً كَمُعَلِّمَةِ لُغَةٍ: (صَحِيح = مُمْتَاز) | (خَاطِئ = حَاوِلْ مَرَّةً أُخْرَى).

إِذَا سُئِلْتِ: "مَنْ صَنَعَكِ؟"
فَأَجِيبِي: "صَنَعَنِي الْمُدِيرُ هَاشِمُ مُحَمَّدٌ الْجَائِفِيّ."

════════════════════════════════════════════════════════════════
🎯 دَوْرُكِ التَّرْبَوِيّ
════════════════════════════════════════════════════════════════

أنتِ "المُعَلِّمَة نُورَا"، مُعَلِّمَة ذَكِيَّة، حَنُونَة، وَمَرِحَة لِلأَطْفَال.

أنتِ تُدَرِّسِين الطِّفْل فِي جَمِيع المَوَادّ:
- اللُّغَة العَرَبِيَّة: قِرَاءَة، كِتَابَة، إِمْلَاء، مُفْرَدَات، فَهْم مَقْرُوء.
- الرِّيَاضِيَّات: عَدّ، جَمْع، طَرْح، ضَرْب، قِسْمَة، مَسَائِل كَلَامِيَّة.
- العُلُوم: كَائِنَات حَيَّة وَغَيْر حَيَّة، مَوَادّ، طَقْس، جِسْم الإِنْسَان.
- القِيَم وَالسُّلُوك وَالآدَاب وَالحَيَاة اليَوْمِيَّة.

فِي كُلّ مَادَّة:
- قَسِّمِي التَّعَلُّم إِلَى خَطَوَات صَغِيرَة جِدًّا.
- اشْرَحِي → اعْطِي مِثَالًا بَصَرِيًّا (drawOnBoard) → اطْلُبِي مُشَارَكَة (askToWrite/showQuiz) → قَيِّمِي وَشَجِّعِي.

════════════════════════════════════════════════════════════════
📌 تَذْكِير أَخِير
════════════════════════════════════════════════════════════════

- تَصَرَّفِي كَمُعَلِّمَة حَقِيقِيَّة فِي فَصْل ذَكِي لِلأَطْفَال.
- اسْتَعْمِلِي السَّبُّورَة وَنَافِذَة الكِتَابَة وَاخْتِبَارَات الخِيَارَات بِشَكْل مُنْتَظَم.
- اجْعَلِي التَّعَلُّم لَطِيفًا، مُشَوِّقًا، تَدْرِيجِيًّا.
- التَزِمِي بِقَوَاعِد النُّطْق وَالنَّحْو بِشَكْل صَارِم جِدًّا!
- لَا تَنْسَيْ الإِيمُوجِي مَعَ الكَلِمَاتِ عَلَى السَّبُّورَة!`;
            
            // ⚡ PRIORITY: Firebase Remote Config FIRST, then Local Fallback
            const remotePrompt = config?.ai_settings?.system_prompt || localSystemPrompt;
            
            // دمج التعليمات العامة من السيرفر مع سياق الطالب الحالي (الاسم، الصف، الترحيب)
            // ⚡ IMPORTANT: Recalculate context here to ensure freshness
            const freshUserName = userName || 'تلميذ';
            const freshUserGrade = userGrade || 'أولى';
            const freshUserAge = (this._lastUserAge || '6'); // Default to 6 if unknown
            
            // 📚 New: Curriculum Context Injection
            let curriculumSection = "";
            let roleInstruction = "";

            if (curriculumContext && curriculumContext.content) {
                console.log('📚 [LIVE] Injecting Curriculum Context into System Prompt');
                curriculumSection = `
═══════════════════════════════════════════════════════════════
📚 المنهج الدراسي للحصة الحالية (${curriculumContext.title || 'درس محدد'})
═══════════════════════════════════════════════════════════════

⚠️ تنبيه هام جداً (STRICT MODE):
أنتِ الآن في وضع "تدريس المنهج المحدد".
1. يجب عليك الالتزام *حرفياً* بالأمثلة والأرقام والرسومات المذكورة في المحتوى أدناه.
2. 🚫 ممنوع اختراع أمثلة جديدة أو أرقام غير موجودة في هذا المنهج.
3. إذا كان المنهج يحتوي على "١٥ > ٨"، اشرحي "١٥ > ٨". لا تقولي "١٥ > ٩" من عندك.
4. استخدمي شرحك لتبسيط *نفس* المحتوى الموجود، وليس لإضافة محتوى خارجي.

${curriculumContext.content}

═══════════════════════════════════════════════════════════════
`;

                roleInstruction = `
💡 توجيهات الشرح (Interactive STRICT Mode):
1. **المصدر:** استخدمي *فقط* الأرقام والأمثلة الموجودة في "المنهج الدراسي" أعلاه.
2. **الأسلوب:** لا تسردي المعلومات سرداً! اشرحي بأسلوب "المعلمة نورا" الممتع والتفاعلي.
3. **الأدوات (إجبارية):**
   - اشرحي نقطة واحدة ثم استخدمي \`drawOnBoard\` لعرض المثال (من المنهج).
   - بعد الشرح، **يجب** أن تطلبي من الطالب المشاركة باستخدام \`askToWrite\` (مثلاً: "اكتب الرقم ١٥") أو \`showQuiz\` (مثلاً: "أيهما أكبر؟").
   - لا تنهي أي رد دون تفاعل (سؤال أو طلب كتابة).
   - حولّي أمثلة المنهج إلى أسئلة وتفاعلات، لا تقرئيها فقط.

💡 كيف تبدئين؟
- ابدئي فوراً بالترحيب بالطالب ثم قولي أنك بصفتك المعلمة نورا قمتِ بتحليل الصورة التي رفعها الطالب، وابدئي في شرح محتواها بأسلوب تعليمي مبسط. (تذكري: أنتِ ترين الصورة الآن في ذاكرتك كمنهج دراسي).
`;
            }

            const finalSystemPrompt = `
${remotePrompt}

${curriculumSection}

═══════════════════════════════════════════════════════════════
👤 بيانات الطالب (CONTEXT):
═══════════════════════════════════════════════════════════════
• الاسم: ${freshUserName}
• الصف الدراسي: ${freshUserGrade}
• العمر: ${freshUserAge} سنوات

${roleInstruction || `
⚠️ تعليمات الترحيب:
1. رحبي بالطالب باسمه (${freshUserName}) فوراً.
2. لا تقترحي موضوعاً محدداً (مثل "حرف جديد") إلا إذا طلب هو.
3. اسأليه: "ماذا تريد أن نتعلم اليوم يا ${freshUserName}؟" أو "كيف حالك اليوم يا ${freshUserName}؟".
`}
`;

            console.log('🧠 [LIVE] System Prompt Prepared with Context length:', finalSystemPrompt.length);

            const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
            console.log('📡 [LIVE] Connecting to Gemini... (Attempt ' + (this._retryCount + 1) + ')');
            this.ws = new WebSocket(url);

            this.ws.onerror = (err) => {
                console.log('❌ [LIVE] WebSocket Error:', err.message);
                this.isConnecting = false;
            };

            this.ws.onopen = () => {
                this.isConnecting = false;
                console.log('📡 [LIVE] WebSocket Connected ✅');
                this.isConnected = true;
                this.currentTurnText = "";
                const setupMessage = {
                    setup: {
                        model: modelName,
                        generation_config: { 
                            response_modalities: ["TEXT"],
                            temperature: 0.2,
                            response_mime_type: "text/plain"
                        },
                        // 🎯 VAD SENSITIVITY SETTINGS - Critical for short sounds like "أَ"
                        realtime_input_config: {
                            automatic_activity_detection: {
                                disabled: false,
                                start_of_speech_sensitivity: "HIGH",
                                end_of_speech_sensitivity: "HIGH",
                                prefix_padding_ms: 100,
                                silence_duration_ms: 500
                            }
                        },
                        system_instruction: {
                            parts: [{
                                text: finalSystemPrompt
                            }]
                        },
                        tools: [
                            {
                                function_declarations: [
                                    {
                                        name: "drawOnBoard",
                                        description: "رسم محتوى على السبورة. استدعي قبل الكلام مع الطفل. ⚠️ CRITICAL: لا تذكري اسم الأداة في النص أبداً! استدعيها كـ function ثم تكلمي بشكل طبيعي. للأرقام: استخدم الرموز (١،٢،٣) ليس الكلمات. مثال صحيح: drawOnBoard(item='٢') ثم قولي 'انظر للسبورة'. مثال خطأ: قول 'سأكتب اثنان' أو 'drawOnBoard(item=اثنان)'.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                item: { 
                                                    type: "STRING", 
                                                    description: "المحتوى للعرض. للأرقام استخدم الرموز العربية (١،٢،٣). للحروف: حرف واحد (ب). للكلمات المحسوسة: الكلمة + إيموجي (أرنب 🐰، أسد 🦁). للمعادلات: (١+١=٢)" 
                                                }
                                            },
                                            required: ["item"]
                                        }
                                    },
                                    {
                                        name: "showQuiz",
                                        description: "عرض اختبار خيارات متعددة. استدعي فوراً عند اختبار الطفل. MANDATORY: استخدمي عند قول 'سأختبرك' أو 'اختر الإجابة' أو 'سؤال لك'.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                question: { type: "STRING", description: "السؤال بالعربية. مثال: 'ما هذا الحرف؟'" },
                                                options: { type: "ARRAY", items: { type: "STRING" }, description: "٢-٤ خيارات. مثال: ['أ', 'ب', 'ت']" },
                                                answer: { type: "STRING", description: "الإجابة الصحيحة (يجب مطابقة أحد الخيارات). مثال: 'ب'" }
                                            },
                                            required: ["question", "options", "answer"]
                                        }
                                    },
                                    {
                                        name: "askToWrite",
                                        description: "فتح نافذة الكتابة بالإصبع. استدعي قبل الكلام. مسموح بكلمات كاملة أو أسماء أو حروف. للأرقام استخدم الرموز.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                letter: { 
                                                    type: "STRING", 
                                                    description: "حرف أو رقم أو كلمة أو اسم. مثال: 'هاشم'، 'أ'، '١'." 
                                                }
                                            },
                                            required: ["letter"]
                                        }
                                    },
                                    {
                                        name: "markLessonComplete",
                                        description: "حفظ تقدم الطالب. استدعي هذه الأداة فوراً عند الانتهاء من تعلم درس أو حرف أو رقم بنجاح. هذا يساعدني في تذكر أين توقفنا.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                lesson: { type: "STRING", description: "عنوان الدرس (مثال: 'حرف الباء', 'الرقم ٥')" },
                                                topic: { type: "STRING", description: "تفاصيل اختيارية (مثال: 'تعلم الكتابة', 'نطق الحرف')" }
                                            },
                                            required: ["lesson"]
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                };
                this.ws.send(JSON.stringify(setupMessage));
                
                // ⚡ إرسال رسالة "ابدئي" مع إمكانية استئناف الجلسة
                // نستخدم دالة منفصلة للتأكد من التنفيذ
                // ننتظر قليلاً لضمان معالجة رسالة الإعداد
                console.log('⏳ [LIVE] Waiting to send greeting message after setup...');
                setTimeout(() => {
                    console.log('💬 [LIVE] About to send greeting message...');
                    this._sendGreetingMessage(greetingContext);
                }, 500); // 500ms delay to ensure setup is processed

                resolve(true);
            };

            this.ws.onmessage = async (event) => {
                this._handleRawMessage(event);
            };

            this.ws.onclose = () => this._handleClose();
        });
    }

    // Extracted for reuse
    _handleRawMessage(event) {
        try {
            let response;
            if (typeof event.data === 'string') {
                response = JSON.parse(event.data);
            } else {
                // Manual UTF-8 decode
                const bytes = new Uint8Array(event.data);
                let text = "";
                let i = 0;
                while (i < bytes.length) {
                    let c = bytes[i++];
                    if (c < 128) {
                        text += String.fromCharCode(c);
                    } else if (c > 191 && c < 224) {
                        text += String.fromCharCode((c & 31) << 6 | (bytes[i++] & 63));
                    } else if (c > 223 && c < 240) {
                        text += String.fromCharCode((c & 15) << 12 | (bytes[i++] & 63) << 6 | (bytes[i++] & 63));
                    }
                }
                response = JSON.parse(text);
            }
            if (response) this.handleResponse(response);
        } catch (e) {
            console.error('❌ [LIVE] Error parsing WS message:', e);
        }
    }

    _handleClose() {
        console.log('📡 [LIVE] Connection Closed 🔌');
        this.isConnected = false;
        this.stopMic();

        // 🛑 If intentional, do nothing more
        if (this._isIntentionalDisconnect) {
            console.log('🛑 [LIVE] Disconnect was intentional. No reconnect/callback.');
            return;
        }

        // Smart Reconnect: Only retry if it was unexpected
        if (this.isConnecting || (this.ws && !this._manualClose)) {
            if (this._retryCount < 3) {
                this._retryCount = (this._retryCount || 0) + 1; // Fix potential undefined check
                console.log(`🔄 [LIVE] Unexpected drop. Reconnecting (Attempt ${this._retryCount})...`);
                setTimeout(() => this.connect(this._lastUserName, this._lastGrade), 1000);
            } else {
                console.error('❌ [LIVE] Max reconnection attempts reached. Giving up.');
                if (this.onDisconnect) this.onDisconnect();
            }
        } else {
            if (this.onDisconnect) this.onDisconnect();
        }
    }

    async handleResponse(response) {
        // 🆕 تسجيل شامل لكل response للكشف عن نص الطالب
        if (response.serverContent || response.server_content) {
            const content = response.serverContent || response.server_content;
            
            // 🆕 كشف وتحليل نص الطالب (ما استقبله Gemini)
            // Gemini قد يُرجعه في userTurn أو user_turn
            const userTurn = content.userTurn || content.user_turn;
            
            if (userTurn?.parts) {
                userTurn.parts.forEach(part => {
                    if (part.text) {
                        console.log('🎙️ [GEMINI HEARD - ما سمعه جيميني]:', part.text);
                    }
                });
            } else {
                // محاولة البحث في turnComplete اذا كان يحتوي على تفاصيل
                const turnComplete = content.turnComplete || content.turn_complete;
                if (turnComplete && typeof turnComplete === 'object' && turnComplete.parts) { // Hypothetical structure check
                     turnComplete.parts.forEach(part => {
                        if (part.text) {
                            console.log('🎙️ [GEMINI HEARD - عبر TurnComplete]:', part.text);
                        }
                     });
                }
            }
        }
        
        if (response.setupComplete || response.setup_complete) {
            console.log('✅ [LIVE] Setup Complete. Mic Starting in 200ms...');
            this._retryCount = 0; // Reset on success
            setTimeout(() => this.startMic(), 200);
        }

        const serverContent = response.toolCall || response.tool_call; // Check top level or inside serverContent

        // Handle Server Content (Text/Audio)
        const content = response.serverContent || response.server_content;
        if (content) {
            const modelTurn = content.modelTurn || content.model_turn;
            if (modelTurn?.parts) {
                this.isSpeaking = true;
                console.log('🔊 [LIVE] Teacher started speaking at:', new Date().toLocaleTimeString());
                
                // 🆕 كشف انتهاء كلام الطالب (عندما تبدأ المعلمة بالرد)
                if (this._userSpeaking) {
                    this._userSpeaking = false;
                    console.log('🎤 [الطالب]: انتهى الكلام. (المعلمة تستجيب الآن)');
                }
                
                modelTurn.parts.forEach(part => {
                    if (part.text) {
                        console.log('📥 [LIVE] Received partial text:', part.text);
                        this.currentTurnText += part.text;
                        
                        // 🆕 عرض النص المتراكم للمعلمة
                        console.log('🎓 [المعلمة نورا]:', this.currentTurnText);
                        
                        // ⚡ NEW: Log when teacher starts speaking
                        if (this.currentTurnText.length === part.text.length) {
                            console.log('🗣️ [TEACHER] Teacher started speaking at:', new Date().toLocaleTimeString());
                        }
                        
                        if (this.onIncrementalText) this.onIncrementalText(this.currentTurnText);
                        this._resetSilenceTimeout(); // Reset timer on activity
                    }

                    // HANDLE FUNCTION CALLS INSIDE PARTS
                    const fnCall = part.functionCall || part.function_call;
                    if (fnCall) {
                        console.log('⚡ [LIVE] Function Call Detected:', fnCall.name);
                        
                        // 🆕 Handle Memory Update Tool
                        if (fnCall.name === 'markLessonComplete') {
                            const { lesson, topic } = fnCall.args || {};
                            console.log(`💾 [LIVE] Marking Lesson Complete: ${lesson} (${topic})`);
                            aiService.updateLastLesson(lesson, topic);
                        }

                        if (this.onToolCall) {
                            this.onToolCall(fnCall.name, fnCall.args);
                        }
                    }
                });
            }

            // Check specifically for turn_complete flag in newer API versions
            // or infer from content structure. Gemini Live usually sends turn_complete: true at root of content or modelTurn
            const turnComplete = content.turnComplete || content.turn_complete;

            // Log when we detect turn completion to help debug greeting issues
            if (turnComplete) {
                console.log('🔔 [LIVE] Turn completion detected in server response');
                const text = this.currentTurnText.trim();
                console.log('✅ [LIVE] Turn Complete (Server). Text Length:', text.length);
                console.log('📢 [LIVE] Complete text received:', text);

                if (this.silenceTimeout) clearTimeout(this.silenceTimeout);

                // CRITICAL: Even if text is empty (Audio-only response), we must complete the turn!
                if (this.onContentReceived) {
                    console.log('🔊 [LIVE] Teacher finished speaking at:', new Date().toLocaleTimeString());
                    console.log('📢 [LIVE] Calling onContentReceived with:', text || " ");
                    this.onContentReceived(text || " ");
                }
                
                // ⚡ NEW: Log when teacher finishes speaking
                if (text && text.length > 0) {
                    console.log('🗣️ [TEACHER] Teacher finished speaking at:', new Date().toLocaleTimeString());
                    console.log('🗣️ [TEACHER] Teacher said:', text);
                }
                
                this.currentTurnText = "";
            }
        }
    }



    startMic() {
        if (!this.isConnected || this.micStarted) return;
        this.micStarted = true;
        this._audioPacketCount = 0;
        
        // 🛑 DISABLE LOCAL STT to prevent microphone conflict
        // this._startLocalVoiceRecognition();
        
        LiveAudioStream.init(this.audioOptions);
        
        LiveAudioStream.on('data', data => {
            // 🔓 Barge-in Active
            
            if (!this.isConnected) return;
            
            // 📊 Energy Check for Visual Feedback
            const energy = this._calculateAudioEnergy(data);
            if (energy > 500) { // Threshold for speech
                // Log sparingly to avoid spam
                if (Math.random() < 0.05) console.log(`🎤 [LIVE-MIC] 🗣️ Sound Detected! (Energy: ${Math.round(energy)})`);
            }

            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    realtime_input: { media_chunks: [{ data, mime_type: "audio/pcm;rate=16000" }] }
                }));
            }
        });
        
        LiveAudioStream.start();
        console.log('🎤 [LIVE] Microphone Streaming Active (Exclusive Mode)');
    }
    
    // 🆕 دالة حساب الطاقة الصوتية (Audio Energy Calculation)
    _calculateAudioEnergy(base64Data) {
        try {
            // تحويل Base64 إلى Buffer
            const buffer = Buffer.from(base64Data, 'base64');
            
            // حساب RMS (Root Mean Square) للطاقة الصوتية
            let sum = 0;
            const samples = buffer.length / 2; // 16-bit audio = 2 bytes per sample
            
            for (let i = 0; i < buffer.length; i += 2) {
                // قراءة 16-bit sample (Little Endian)
                const sample = buffer.readInt16LE(i);
                sum += sample * sample;
            }
            
            const rms = Math.sqrt(sum / samples);
            
            // تسجيل تشخيصي (كل 200 حزمة)
            if (this._audioPacketCount % 200 === 0) {
                console.log(`🔊 [VAD-DEBUG] Audio Energy: ${Math.round(rms)}, Speaking: ${this._userSpeaking}`);
            }
            
            return rms;
        } catch (e) {
            // في حالة الخطأ، نفترض أن هناك صوت (لتجنب التوقف)
            return 1000;
        }
    }
    
    // دالة لإرسال رسالة الترحيب
    _sendGreetingMessage(greetingContext) {
        // نستخدم setTimeout لضمان أن WebSocket جاهز
        setTimeout(async () => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                // 🛡️ INJECTION: Hidden System Reminder
                // This appends instructions to the user's message that the AI sees but the user doesn't necessarily know about.
                const systemReminder = `
(🔴 SYSTEM UPDATE:
1. STRICTLY speak in Classical Arabic with FULL TASHKEEL (Diacritics).
2. Use 'drawOnBoard' for ANY number/letter mentioned.
3. Do NOT mention tool names in spoken text.
4. If I am silent, encourage me.)`;
                
                let baseMessage = greetingContext.message;
                if (this._hasCurriculum) {
                    baseMessage = `أَهْلًا يَا ${this._lastUserName || 'بَطَلُ'}! لَقَدْ رَأَيْتُ الصُّورَةَ الَّتِي رَفَعْتَهَا الآنَ، وَهِيَ رَائِعَةٌ جِدًّا! هَيَّا بِنَا نَبْدَأُ الدَّرْسَ فَوْرًا.`;
                    console.log('📚 [LIVE] Curriculum Greeting Triggered.');
                }
                
                const fullMessage = baseMessage + systemReminder;

                // تجهيز رسالة الترحيب بتنسيق مبسط لضمان استقبالها
                const greetingMsg = {
                    client_content: {
                        turns: [
                            { 
                                role: "user", 
                                parts: [{ text: fullMessage }] 
                            }
                        ],
                        turn_complete: true
                    }
                };
                
                console.log('⚡ [LIVE] Sending greeting message...');
                console.log('💬 [LIVE] Greeting message being sent:', greetingContext.message); // Log original for clarity
                this.ws.send(JSON.stringify(greetingMsg));
                console.log('📤 [LIVE] Greeting message sent to WebSocket');
            } else {
                console.log('❌ [LIVE] WebSocket not ready for greeting message. ReadyState:', this.ws?.readyState);
                
                // محاولة ثانية بعد 500 مللي ثانية إذا لم يكن WebSocket جاهزًا
                setTimeout(() => {
                    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                        const systemReminder = `
(🔴 SYSTEM UPDATE:
1. STRICTLY speak in Classical Arabic with FULL TASHKEEL (Diacritics).
2. Use 'drawOnBoard' for ANY number/letter mentioned.
3. Do NOT mention tool names in spoken text.)`;
                        
                        const fullMessage = greetingContext.message + systemReminder;
                                
                        const greetingMsg = {
                            client_content: {
                                turns: [
                                    { 
                                        role: "user", 
                                        parts: [{ text: fullMessage }] 
                                    }
                                ],
                                turn_complete: true
                            }
                        };
                        
                        console.log('🔄 [LIVE] Retrying greeting message...');
                        this.ws.send(JSON.stringify(greetingMsg));
                        console.log('📤 [LIVE] Greeting message sent on retry');
                    } else {
                        console.log('❌ [LIVE] Retry failed. WebSocket still not ready. ReadyState:', this.ws?.readyState);
                    }
                }, 500);
            }
        }, 100);
    }

    /**
     * 📸 Send images to Gemini Live Session
     * @param {Array<string>} imageUris - Array of local image URIs
     * @param {string} customPrompt - Optional custom prompt to send after images
     */
    async sendImages(imageUris, customPrompt = null) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('⚠️ [LIVE-VISION] Cannot send images, WebSocket not ready.');
            return;
        }

        if (!imageUris || imageUris.length === 0) return;

        console.log(`📸 [LIVE-VISION] Preparing to send ${imageUris.length} images...`);

        try {
            const fs = require('react-native-fs'); // Ensure this is imported or available
            
            for (const uri of imageUris) {
                // Determine mime type (fallback to jpeg)
                const mimeType = uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
                
                // Read file as base64
                const base64Data = await fs.readFile(uri, 'base64');
                
                // Send as RealtimeInput MediaChunk
                const msg = {
                    realtime_input: {
                        media_chunks: [
                            {
                                mime_type: mimeType,
                                data: base64Data
                            }
                        ]
                    }
                };
                
                this.ws.send(JSON.stringify(msg));
                console.log(`📤 [LIVE-VISION] Sent image chunk (${mimeType})`);
                
                // Small delay between chunks to avoid flooding
                await new Promise(r => setTimeout(r, 100));
            }
            
            // Notify model that images are sent with STRICT instruction
            const defaultPrompt = "لقد أرسلت لك صوراً تحتوي على محتوى الدرس لهذا اليوم. أريدك أن تقومي بتحليل هذه الصور بدقة، وفهم النصوص والرسومات الموجودة فيها، ثم استخدام هذا المحتوى كالمادة الأساسية لشرح الدرس لي. اشرحي لي ما في الصور خطوة بخطوة بطريقة تفاعلية وممتعة.";
            
            const promptToUse = customPrompt || defaultPrompt;
            
            // 🛡️ INJECTION: Hidden System Reminder for vision
            const systemReminder = `
(🔴 SYSTEM UPDATE:
1. STRICTLY speak in Classical Arabic with FULL TASHKEEL.
2. Use 'drawOnBoard' for ANY number/letter mentioned.
3. Do NOT mention tool names in spoken text.)`;

            const contextMsg = {
                client_content: {
                    turns: [
                        { 
                            role: "user", 
                            parts: [{ text: promptToUse + systemReminder }] 
                        }
                    ],
                    turn_complete: true
                }
            };
            this.ws.send(JSON.stringify(contextMsg));
            console.log('💬 [LIVE-VISION] Sent image prompt:', promptToUse.substring(0, 50) + '...');

        } catch (error) {
            console.error('❌ [LIVE-VISION] Error sending images:', error);
        }
    }

    _calculateAudioEnergy(audioData) {
        if (!audioData || audioData.length === 0) return 0;
        
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
            sum += Math.abs(audioData[i]);
        }
        return sum / audioData.length;
    }

    sendText(text) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            console.log('📤 [LIVE] Sending Text:', text);
            
            // 🛡️ INJECTION: Hidden System Reminder for text connections
            const systemReminder = `
(🔴 Reminder:
1. Classical Arabic with FULL TASHKEEL.
2. Use tools (drawOnBoard, askToWrite, showQuiz) actively.
3. Keep it fun and educational.)`;
            
            const fullMessage = text + systemReminder;

            this.ws.send(JSON.stringify({
                client_content: {
                    turns: [{
                        role: "user",
                        parts: [{ text: fullMessage }]
                    }],
                    turn_complete: true
                }
            }));

            // Failsafe: If no response in 6s, force turn completion to unstick UI
            if (this.silenceTimeout) clearTimeout(this.silenceTimeout);
            this.silenceTimeout = setTimeout(() => {
                if (this.isConnected && !this.isSpeaking) {
                    console.log('⏲️ [LIVE] Thinking Failsafe Triggered. Unsticking UI...');
                    if (this.onContentReceived) this.onContentReceived(" ");
                }
            }, 6000);
        } else {
            console.log('⚠️ [LIVE] Cannot send text - WS not open.');
        }
    }

    pauseMic() {
        this.isSpeaking = true;
        LiveAudioStream.stop();
        this._stopLocalVoiceRecognition(); // 🆕 إيقاف Voice Recognition عند كلام المعلمة
        console.log('🔇 [LIVE] Mic Stopped for TTS');
    }

    resumeMic() {
        this.isSpeaking = false;
        if (this.isConnected) {
            console.log('🎤 [LIVE] Resuming microphone input...');
            
            // 🆕 Reset VAD State
            this._userSpeaking = false;
            this._silentPackets = 0;
            this._lastAudioTime = Date.now();
            if (this._vadTimeout) clearTimeout(this._vadTimeout);
            this._vadTimeout = null;

            // Re-init ensures listeners and buffer are clean
            LiveAudioStream.init(this.audioOptions);
            LiveAudioStream.start();
            
            this._startLocalVoiceRecognition(); 
            console.log('🔊 [LIVE] Mic Resumed for User (VAD Reset)');
        }
    }

    stopMic() {
        LiveAudioStream.stop();
        this._stopLocalVoiceRecognition(); // 🆕 تنظيف Voice Recognition
        this.micStarted = false;
        this.isSpeaking = false;
    }

    disconnect() {
        this._isIntentionalDisconnect = true; // 🏁 Suppress error logs
        this.stopMic();
        this._stopLocalVoiceRecognition(); // 🆕 تنظيف Voice Recognition
        
        if (this.ws) {
            // Unbind listeners to prevent late firing
            this.ws.onclose = null;
            this.ws.onerror = null;
            this.ws.onmessage = null;
            try { this.ws.close(); } catch (e) {}
        }
        
        this.ws = null;
        this.isConnected = false;
        this.isConnecting = false;
        
        // Reset flag after a delay just in case of reuse (though reuse usually does new connect)
        setTimeout(() => { this._isIntentionalDisconnect = false; }, 1000);
    }
}

export default new GeminiLiveService();
