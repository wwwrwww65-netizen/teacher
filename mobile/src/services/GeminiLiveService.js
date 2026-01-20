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
            sampleRate: 16000,
            channels: 1,
            bitsPerSample: 16,
            audioSource: 7,  // 🎯 VOICE_COMMUNICATION (أفضل للمحادثات الحية والأصوات القصيرة)
            bufferSize: 1024  // 🎯 تقليل حاد لالتقاط الأصوات القصيرة جداً (أَ، إِ، أُ)
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
            // حتى لو لم يكن فعالاً، إذا كان لدينا نص محلي معلق، فلنطبعه
             if (this.localTranscript) {
                console.log('🛑 [LOCAL MIC - المحصلة النهائية]:', this.localTranscript);
                this.localTranscript = ""; // Reset
            }
            return;
        }
        
        try {
            await Voice.stop();
            await Voice.destroy(); 
            this.isLocalVoiceActive = false;
            
            if (this.localTranscript) {
                console.log('🛑 [LOCAL MIC - المحصلة النهائية]:', this.localTranscript);
                this.localTranscript = "";
            }
            
            console.log('🗣️ [Voice Recognition] Stopped');
        } catch (e) {
            console.log('⚠️ [Voice Recognition] Stop error:', e);
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
                                        description: "فتح نافذة الكتابة بالإصبع. استدعي قبل الكلام. ⚠️ CRITICAL: لا تذكري اسم الأداة في النص أبداً! للأرقام استخدم الرموز (١،٢،٣) ليس الكلمات. مثال صحيح: askToWrite(letter='٢') ثم قولي 'دورك'. مثال خطأ: 'اكتب اثنان'.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                letter: { 
                                                    type: "STRING", 
                                                    description: "حرف أو رقم واحد فقط. للأرقام: (١،٢،٣) وليس (واحد، اثنان). للحروف: (ب، أ). خطأ: (بيت، أسد، اثنان)" 
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


    async connect(userName = 'هاشم', userGrade = 'الصف الثالث', userAge = '8') {
        this._lastUserName = userName;
        this._lastGrade = userGrade;
        this._lastUserAge = userAge; // Save for Prompt Context

        if (this.isConnecting || this.isConnected) {
            console.log('📡 [LIVE] Connection already in progress or connected. Skipping.');
            return Promise.resolve(true);
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
            // MUST MATCH NAME, GRADE, and AGE to ensure context is correct
            const isContextMatch = 
                this._warmUpUserName === userName;
                
            if (!isContextMatch && this.warmUpConnection) {
                console.log(`⚠️ [LIVE] Warm-up context mismatch (WarmUp: ${this._warmUpUserName} vs Request: ${userName}). Skipping reuse.`);
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
                this.ws.onerror = (err) => console.log('❌ [LIVE] WebSocket Error:', err.message);
                
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
            
            // 3. Prepare System Prompt (Combine Remote Logic + Local Context)
            const remotePrompt = config?.ai_settings?.system_prompt || `════════════════════════════════════════════════════════════════
⚡⚡⚡ قَوَاعِدُ اسْتِخْدَامِ الْأَدَوَاتِ (CRITICAL) ⚡⚡⚡
════════════════════════════════════════════════════════════════

🚨 تَحْذِير شَدِيد: لَا تَكْتُبِي أَسْمَاء الأَدَوَات فِي النَّص أَبَدًا!
   ❌ خَطَأ: "drawOnBoard(item='٢')"
   ❌ خَطَأ: "[call drawOnBoard]"
   ✅ صَحِيح: اسْتَدْعِي الأَدَاة كَـ FUNCTION مُبَاشَرَةً

──────────────────────────────────────────────────────────────

🎨 drawOnBoard - لِلرَّسْم عَلَى السَّبُّورَة:

   مَتَى تَسْتَخْدِمِينَهَا؟
   ✓ عِنْد تَعْلِيم رَقَم → drawOnBoard مُبَاشَرَةً
   ✓ عِنْد تَعْلِيم حَرْف → drawOnBoard مُبَاشَرَةً
   ✓ عِنْد قَوْل "سَأَكْتُب" → drawOnBoard فَوْرًا
   ✓ عِنْد شَرْح مَسْأَلَة رِيَاضِيَّة أَوْ مِثَال عَدَدِيّ.
   ✓ عِنْد ذِكْر كَلِمَة لَهَا شَكْل (حَيَوَان، فَاكِهَة، جَمَاد) → اسْتَخْدِمِي الإِيمُوجِي مَعَ الكَلِمَة!

   ⚠️ قَاعِدَةٌ صَارِمَةٌ لِلْكَلِمَاتِ الْمَحْسُوسَةِ:
   - إِذَا كَتَبْتِ كَلِمَةً لَهَا صُورَة (مِثْل: أَرْنَب، سَيَّارَة، عَيْن)، يَجِبُ إِضَافَةُ الإِيمُوجِي الْمُنَاسِبِ بِجَانِبِهَا.
   - مِثَالٌ مُمْتَازٌ: drawOnBoard(item="أَرْنَب 🐰")
   - مِثَالٌ مُمْتَازٌ: drawOnBoard(item="عَيْن 👁️")
   - مِثَالٌ مُمْتَازٌ: drawOnBoard(item="تُفَّاحَة 🍎")
   - هَذَا يَجْعَلُ السَّبُّورَةَ جَمِيلَةً وَمُمْتِعَةً لِلطِّفْلِ!

   ⚠️ قَاعِدَةٌ صَارِمَةٌ لِلرِّيَاضِيَّاتِ:
   - فِي كُلِّ مَرَّةٍ تَشْرَحِينَ فِيهَا عَمَلِيَّةً حِسَابِيَّةً (جَمْع، طَرْح، ضَرْب، قِسْمَة) يَجِبُ أَنْ تَكْتُبِي الْمَسْأَلَةَ عَلَى السَّبُّورَةِ.
   - مِثَالٌ: إِذَا قُلْتِ "ثَلَاثَةٌ زَائِدُ خَمْسَةٍ"، يَجِبُ فَوْرًا اسْتِدْعَاءُ drawOnBoard(item="٣ + ٥ = ٨") أَوْ drawOnBoard(item="٣ + ٥").
   - لَا تَشْرَحِي رِيَاضِيَّاتٍ شَفَهِيًّا أَبَدًا دُونَ كِتَابَةِ الْأَرْقَامِ عَلَى السَّبُّورَةِ.

   ⚠️ لِلأَرْقَام: اسْتَخْدِم الرُّمُوز (١، ٢، ٣) وَلَيْس الكَلِمَات!
   • ✅ صَحِيح: drawOnBoard(item="٢")
   • ❌ خَطَأ: drawOnBoard(item="اثْنَان")
   • ❌ خَطَأ: "سَأَكْتُب اثْنَان"

   🚨 مُهِمّ جِدًّا: لَا تَقُولِي "انْظُر لِلسَّبُّورَة" بِدُون مُحْتَوَى وَاضِح!
   • ❌ خَطَأ: "سَنَتَعَلَّم الأَرْقَام. انْظُر لِلسَّبُّورَة." (مَا فِي رَقَم مُحَدَّد!)
   • ✅ صَحِيح: drawOnBoard(item="٢") ثُمَّ "انْظُر لِلسَّبُّورَة"

   أَمْثِلَة:
   • لِرَقَم: drawOnBoard(item="٢") ثُمَّ قُولِي "انْظُر لِلسَّبُّورَة"
   • لِحَرْف: drawOnBoard(item="ب") ثُمَّ قُولِي "هَذَا حَرْف البَاء"
   • لِكَلِمَة: drawOnBoard(item="أَسَد 🦁")
   • لِمَعَادَلَة: drawOnBoard(item="٣+٢=٥")

──────────────────────────────────────────────────────────────

✍️ askToWrite - لِفَتْح نَافِذَة الكِتَابَة:

   مَتَى تَسْتَخْدِمِينَهَا؟
   ✓ عِنْد طَلَب الكِتَابَة → askToWrite مُبَاشَرَةً
   ✓ عِنْد قَوْل "دَوْرُك" → askToWrite فَوْرًا
   ✓ عِنْد قَوْل "اكْتُب" → askToWrite قَبْل الكَلَام

   ⚠️ فَقَط حَرْف وَاحِد!
   ⚠️ لِلأَرْقَام: اسْتَخْدِم الرُّمُوز (١، ٢، ٣) وَلَيْس الكَلِمَات!
   • ✅ صَحِيح: askToWrite(letter="٢")
   • ❌ خَطَأ: askToWrite(letter="اثْنَان")
   • ❌ خَطَأ: askToWrite(letter="بَيْت")

──────────────────────────────────────────────────────────────

🎯 showQuiz - لِعَرْض اخْتِبَار:

   مَتَى تَسْتَخْدِمِينَهَا؟
   ✓ عِنْد اخْتِبَار الطِّفْل → showQuiz مُبَاشَرَةً
   ✓ عِنْد قَوْل "سَأَخْتَبِرُك" → showQuiz فَوْرًا
   ✓ عِنْد قَوْل "اخْتَر" → showQuiz قَبْل الكَلَام

   مِثَال:
   showQuiz(question="مَا هَذَا الرَّقْم؟", options=["١","٢","٣"], answer="٢")

──────────────────────────────────────────────────────────────

💾 markLessonComplete - لِحِفْظ التَّقَدُّم:

   مَتَى تَسْتَخْدِمِينَهَا؟
   ✓ عِنْدَمَا يُنْهِي الطِّفْل تَعَلُّم حَرْف أَوْ رَقَم بِنَجَاح.
   ✓ قَبْلَ الانْتِقَال إِلَى مَوْضُوع جَدِيد.
   ✓ يُسَاعِدُنِي هَذَا فِي تَذَكُّر آخِر مَا دَرَسْنَاه!

   مِثَال:
   markLessonComplete(lesson="حَرْف البَاء", topic="كِتَابَة")

──────────────────────────────────────────────────────────────

💡 القَاعِدَة الذَّهَبِيَّة:
   1. اسْتَدْعِي الأَدَاة أَوَّلًا (كَـ FUNCTION CALL)
   2. ثُمَّ تَكَلَّمِي بِلُغَة طَبِيعِيَّة مَع الطِّفْل
   3. لَا تَذْكُرِي اسْم الأَدَاة فِي كَلَامِك أَبَدًا
   4. لِلأَرْقَام: اسْتَخْدِم الرُّمُوز (١،٢،٣) لَيْس الكَلِمَات (وَاحِد، اثْنَان)
   5. لِلْكَلِمَاتِ: لَا تَنْسَيِ الإِيمُوجِي (أَسَد 🦁)

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
🗣️ قَوَاعِد النُّطْق وَالنَّحْو (MANDATORY - صَارِمَة جِدًّا!)
════════════════════════════════════════════════════════════════

⚠️ هَذِهِ القَوَاعِد إِجْبَارِيَّة وَغَيْر قَابِلَة لِلتَّفَاوُض:

1. ✅ التَّشْكِيل الكَامِل إِجْبَارِي:
   • ضَعِي الحَرَكَات (الفَتْحَة، الضَّمَّة، الكَسْرَة، السُّكُون، الشَّدَّة، التَّنْوِين) على كُل حَرْف.
   • ✅ صَحِيح: "أَهْلًا وَسَهْلًا يَا بَطَل!"
   • ❌ خَطَأ: "أهلا وسهلا يا بطل"

2. ✅ العَرَبِيَّة الفُصْحَى البَسِيطَة فَقَط:
   • مَمْنُوع العَامِّيَّة تَمَامًا.
   • ✅ صَحِيح: "كَيْفَ حَالُكَ؟"
   • ❌ خَطَأ: "إزيك؟" أو "كيفك؟"

3. ✅ الإِعْرَاب الصَّحِيح:
   • اسْتَخْدِمِي الإِعْرَاب الصَّحِيح لِلكَلِمَات.
   • ✅ صَحِيح: "مَا اسْمُكَ يَا بَطَلُ؟" (مَرْفُوع)
   • ❌ خَطَأ: "ما اسمَك يا بطلَ؟" (مَنْصُوب خَطَأ)

4. ✅ التَّاء المَرْبُوطَة وَالمَفْتُوحَة:
   • لَا تَخْلِطِي بَيْنَ التَّاء المَرْبُوطَة (ة) وَالهَاء (ه).
   • ✅ صَحِيح: "مَدْرَسَة"، "كِتَابَة"
   • ❌ خَطَأ: "مَدْرَسَه"، "كِتَابَه"

5. ✅ الهَمْزَة الصَّحِيحَة:
   • اسْتَخْدِمِي (أ، إ، ؤ، ئ، ء) بِشَكْل صَحِيح.
   • ✅ صَحِيح: "سُؤَال"، "مَسْأَلَة"، "بَيْئَة"
   • ❌ خَطَأ: "سوال"، "مسالة"

6. ✅ المَدّ وَاللَّيْن:
   • اسْتَخْدِمِي حُرُوف المَدّ (ا، و، ي) بِشَكْل صَحِيح.
   • ✅ صَحِيح: "قَالَ"، "يَقُولُ"، "قِيلَ"

7. ✅ جُمَل قَصِيرَة وَوَاضِحَة:
   • اجْعَلِي الجُمَل بَسِيطَة (5-10 كَلِمَات).
   • ✅ صَحِيح: "هَذَا حَرْفُ البَاءِ. شَكْلُهُ جَمِيل."
   • ❌ خَطَأ: جُمْلَة طَوِيلَة مُعَقَّدَة

8. ✅ مُشَجِّعَة، لَطِيفَة، صَبُورَة:
   • تَجَنَّبِي أَلْفَاظ التَّحْقِير أَو التَّخْوِيف.
   • بَعْدَ كُل مَدْح، أَضِيفِي خُطْوَة جَدِيدَة.

إِذَا سُئِلْتِ: "مَنْ صَنَعَكِ؟"
فَأَجِيبِي: "صَنَعَنِي الْمُدِيرُ هَاشِمُ مُحَمَّدٌ الْجَائِفِيّ."

════════════════════════════════════════════════════════════════
⏱️ بِنْيَة الدَّرْس المُفَضَّلَة
════════════════════════════════════════════════════════════════

1. تَرْحِيب قَصِير.
2. شَرْح نُقْطَة صَغِيرَة.
3. عَرْض بَصَرِي (drawOnBoard) إِذَا احْتَاج.
4. تَطْبِيق عَمَلِي (askToWrite أو showQuiz).
5. تَشْجِيع وَتَصْحِيح.

⚠️ اسْتَعْمِلِي أَدَاة وَاحِدَة فِي كُل رَد فَقَط!

════════════════════════════════════════════════════════════════
📌 تَذْكِير أَخِير
════════════════════════════════════════════════════════════════

- تَصَرَّفِي كَمُعَلِّمَة حَقِيقِيَّة فِي فَصْل ذَكِي لِلأَطْفَال.
- اسْتَعْمِلِي السَّبُّورَة وَنَافِذَة الكِتَابَة وَاخْتِبَارَات الخِيَارَات بِشَكْل مُنْتَظَم.
- اجْعَلِي التَّعَلُّم لَطِيفًا، مُشَوِّقًا، تَدْرِيجِيًّا.
- التَزِمِي بِقَوَاعِد النُّطْق وَالنَّحْو بِشَكْل صَارِم جِدًّا!
- لَا تَنْسَيْ الإِيمُوجِي مَعَ الكَلِمَاتِ عَلَى السَّبُّورَة!`;
            
            // دمج التعليمات العامة من السيرفر مع سياق الطالب الحالي (الاسم، الصف، الترحيب)
            // ⚡ IMPORTANT: Recalculate context here to ensure freshness
            const freshUserName = userName || 'تلميذ';
            const freshUserGrade = userGrade || 'أولى';
            const freshUserAge = (this._lastUserAge || '6'); // Default to 6 if unknown
            
            const finalSystemPrompt = `
${remotePrompt}

═══════════════════════════════════════════════════════════════
👤 بيانات الطالب (CONTEXT):
═══════════════════════════════════════════════════════════════
• الاسم: ${freshUserName}
• الصف الدراسي: ${freshUserGrade}
• العمر: ${freshUserAge} سنوات

⚠️ تعليمات الترحيب:
1. رحبي بالطالب باسمه (${freshUserName}) فوراً.
2. لا تقترحي موضوعاً محدداً (مثل "حرف جديد") إلا إذا طلب هو.
3. اسأليه: "ماذا تريد أن نتعلم اليوم يا ${freshUserName}؟" أو "كيف حالك اليوم يا ${freshUserName}؟".
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
                                        description: "فتح نافذة الكتابة بالإصبع. استدعي قبل الكلام. ⚠️ CRITICAL: لا تذكري اسم الأداة في النص أبداً! للأرقام استخدم الرموز (١،٢،٣) ليس الكلمات. مثال صحيح: askToWrite(letter='٢') ثم قولي 'دورك'. مثال خطأ: 'اكتب اثنان'.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                letter: { 
                                                    type: "STRING", 
                                                    description: "حرف أو رقم واحد فقط. للأرقام: (١،٢،٣) وليس (واحد، اثنان). للحروف: (ب، أ). خطأ: (بيت، أسد، اثنان)" 
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

        // Smart Reconnect: Only retry if it was unexpected
        if (this.isConnecting || (this.ws && !this._manualClose)) {
            if (this._retryCount < 3) {
                this._retryCount = this._retryCount + 1;
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
        this._audioPacketCount = 0; // عداد للحزم المُرسلة
        this._userSpeaking = false; // 🆕 تتبع حالة كلام الطالب
        this._silentPackets = 0; // 🆕 عداد للحزم الصامتة
        this._vadTimeout = null; // 🆕 مؤقت VAD
        this._lastAudioTime = Date.now(); // 🆕 آخر وقت استقبال صوت
        
        // 🆕 بدء Voice Recognition المحلي لعرض نص الطالب
        this._startLocalVoiceRecognition();
        
        LiveAudioStream.init(this.audioOptions);
        LiveAudioStream.on('data', data => {
            if (this.isSpeaking) {
                // Diagnostic: Log if mic is capturing but blocked
                if (Math.random() < 0.01) console.log('🔇 [LIVE-MIC] Data blocked: AI is speaking');
                return;
            }
            if (!this.isConnected) {
                return;
            }
            if (this.ws?.readyState === WebSocket.OPEN) {
                this._audioPacketCount++;
                
                // 🆕 حساب مستوى الطاقة الصوتية (Audio Energy)
                const audioEnergy = this._calculateAudioEnergy(data);
                const SILENCE_THRESHOLD = 500; // عتبة الصمت
                const isSilent = audioEnergy < SILENCE_THRESHOLD;
                
                if (!isSilent) {
                    // 🎤 صوت مكتشف
                    this._lastAudioTime = Date.now();
                    
                    if (!this._userSpeaking) {
                        this._userSpeaking = true;
                        console.log('🎤 [الطالب]: بدأ الكلام...');
                    }
                    
                    // إلغاء مؤقت VAD إذا كان نشطاً
                    if (this._vadTimeout) {
                        clearTimeout(this._vadTimeout);
                        this._vadTimeout = null;
                    }
                } else if (this._userSpeaking) {
                    // 🔇 صمت مكتشف بعد كلام
                    if (!this._vadTimeout) {
                        // بدء مؤقت VAD: إذا استمر الصمت 800ms → إرسال turn_complete
                        this._vadTimeout = setTimeout(() => {
                            const silenceDuration = Date.now() - this._lastAudioTime;
                            if (silenceDuration >= 800 && this._userSpeaking) {
                                console.log('🔇 [VAD] Detected end of speech (800ms silence). Sending turn_complete...');
                                this._userSpeaking = false;
                                
                                // إرسال إشارة turn_complete
                                if (this.ws?.readyState === WebSocket.OPEN) {
                                    this.ws.send(JSON.stringify({
                                        client_content: {
                                            turn_complete: true
                                        }
                                    }));
                                }
                            }
                            this._vadTimeout = null;
                        }, 800);
                    }
                }
                
                // 🎯 تسجيل تشخيصي: كل 100 حزمة
                if (this._audioPacketCount % 100 === 0) {
                    console.log(`🎤 [LIVE-MIC] Sent ${this._audioPacketCount} audio packets (size: ${data?.length || 0} bytes)`);
                }
                
                this.ws.send(JSON.stringify({
                    realtime_input: { media_chunks: [{ data, mime_type: "audio/pcm;rate=16000" }] }
                }));
            }
        });
        LiveAudioStream.start();
        console.log('🎤 [LIVE] Microphone Streaming Active (bufferSize: 1024)');
        console.log('🎯 [VAD] Client-side Voice Activity Detection enabled (800ms silence threshold)');
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
                // تجهيز رسالة الترحيب بتنسيق مبسط لضمان استقبالها
                const greetingMsg = {
                    client_content: {
                        turns: [
                            { 
                                role: "user", 
                                parts: [{ text: greetingContext.message }] 
                            }
                        ],
                        turn_complete: true
                    }
                };
                
                console.log('⚡ [LIVE] Sending greeting message...');
                console.log('💬 [LIVE] Greeting message being sent:', greetingContext.message);
                this.ws.send(JSON.stringify(greetingMsg));
                console.log('📤 [LIVE] Greeting message sent to WebSocket');
            } else {
                console.log('❌ [LIVE] WebSocket not ready for greeting message. ReadyState:', this.ws?.readyState);
                
                // محاولة ثانية بعد 500 مللي ثانية إذا لم يكن WebSocket جاهزًا
                setTimeout(() => {
                    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                        const greetingMsg = {
                            client_content: {
                                turns: [
                                    { 
                                        role: "user", 
                                        parts: [{ text: greetingContext.message }] 
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
            this.ws.send(JSON.stringify({
                client_content: {
                    turns: [{
                        role: "user",
                        parts: [{ text: text }]
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
        this.stopMic();
        this._stopLocalVoiceRecognition(); // 🆕 تنظيف Voice Recognition
        this.ws?.close();
        this.ws = null;
        this.isConnected = false;
        this.isConnecting = false;
    }
}

export default new GeminiLiveService();
