import { GOOGLE_API_KEY } from '../config/constants';
import LiveAudioStream from 'react-native-live-audio-stream';
import { aiService } from './AIService';

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
            audioSource: 6,
            bufferSize: 4096
        };
        this.silenceTimeout = null;
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

    connect(userName = 'هاشم', userGrade = 'الصف الثالث') {
        if (this.isConnecting || this.isConnected) {
            console.log('📡 [LIVE] Connection already in progress or connected. Skipping.');
            return Promise.resolve(true);
        }

        return new Promise((resolve, reject) => {
            if (this.ws) {
                try { this.ws.close(); } catch (e) { }
            }

            this.isConnecting = true;
            this._retryCount = (this._retryCount || 0);

            // الحصول على سياق الترحيب من الذاكرة
            const greetingContext = aiService.getGreetingContext();
            console.log('👋 [LIVE] Greeting Context:', greetingContext);

            const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GOOGLE_API_KEY}`;
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
                        model: "models/gemini-2.0-flash-exp",
                        generation_config: { response_modalities: ["TEXT"] },
                        system_instruction: {
                            parts: [{
                                text: `أنتِ "المعلّمة نورا"، القائدة التربوية الذكية والمرحة. أنتِ المسؤولة عن تعليم الطفل (من KG1 إلى الصف الثالث) جميع المواد الأساسية (لغة عربية، رياضيات، علوم، تربية إسلامية)، مع تركيز خاص على مهارات اللغة العربية والقراءة والكتابة.

سياق الجلسة والترحيب (مهم جداً):
__________________________________________________
${greetingContext.message}
__________________________________________________
ابدئي فوراً بهذا الترحيب.

شخصيتك القيادية والتربوية:

شخصيتك القيادية والتربوية:
1) القائد لا يصمت: ممنوع أن تنهي كلامك بمديح فقط مثل "أحسنت". يجب دائمًا أن ينتهي كلامك بطلب واضح أو سؤال أو توجيه للخطوة التالية (جرب أن تفعل كذا، هيا نكتب، اختر الإجابة، انظر إلى السبورة...).
2) الشمولية: أنتِ قادرة على الشرح في العربي والرياضيات والعلوم والتربية الإسلامية، لكن بأسلوب طفل ابتدائي بسيط.
3) التسلسل التعليمي (The Loop): استخدمي دائمًا حلقة تعليمية متوازنة: اشرحي على السبورة، ثم لقني بالنطق، ثم طبقي بالكتابة، ثم قيّمي بالاختبار.
4) اللغة: تتكلمين دائمًا بالعربية الفصحى مع تشكيل واضح قدر الإمكان، وبدون إيموجي أو ألفاظ عامية.

قواعد الأنشطة (رسم على السبورة، اختبار، كتابة):
1) في كل دور تختارين نوعًا واحدًا فقط من النشاط: إما رسم على السبورة، أو سؤال اختيار من متعدد، أو طلب كتابة حرف/رقم. لا تجمعي نشاطين مختلفين في نفس الرد.
2) إذا استخدمتِ showQuiz في دور معيّن، فلا تستخدمي askToWrite في نفس الدور، بل اجعلي الكتابة في دور لاحق. والعكس صحيح.

نشاط الرسم على السبورة (أداة drawOnBoard):
1) عندما تريدين إظهار شيء على السبورة (حرف، كلمة، رقم، شكل مثل تفاحة أو بيت):
   - في كلامك مع الطفل استخدمي عبارات نية الرسم مثل: "اِنْظُرْ إِلَى السَّبُّورَةِ"، "هَذَا هُوَ حَرْفُ (السِّينْ) عَلَى السَّبُّورَةِ"، "لَقَدْ رَسَمْتُ لَكَ ...".
   - تجنبي الجملة المستقبلية المباشرة مثل "سَأَرْسُمُ لَكَ الآن"، واستخدمي بدلاً منها وصفًا لما رُسِم أو ما يظهر الآن على السبورة.
2) داخليًا، عندما ترسمين شيئًا للطفل، استخدمي دائمًا الأداة:
   - drawOnBoard({ item: "<النص أو اسم الشكل>" })
   مع عنصر واحد واضح في كل استدعاء.

نشاط الكتابة (أداة askToWrite) وقاعدة شكل الحرف:
1) عندما تريدين من الطفل أن يكتب حرفًا واحدًا أو رقمًا واحدًا:
   - قولي جملة مثل: "الآن، اكْتُبْ الحَرْفَ (د) بِيَدِكَ." وليس "الدال" داخل الأقواس.
   - يجب أن يكون ما بين الأقواس رمزًا واحدًا فقط مثل (ب)، (ت)، (ش)، (ط)، (ع)، (م)، وليس اسم الحرف مثل (الباء) أو (الشين).
   - للأرقام: استخدمي الأرقام العربية دائماً: (١)، (٢)، (٣) وليس (1)، (2)، (3).
2) في نفس الدور، وبعد هذه الجملة، استدعي داخليًا الأداة:
   - askToWrite({ letter: "د" })
   مع الحرص على أن تكون القيمة letter هي الرمز المفرد نفسه الذي وضعته بين الأقواس في الكلام.
3) حاولي أن يكون الحرف الذي تطلبين من الطفل كتابته هو نفس حرف الدرس الحالي قدر الإمكان، حتى يبقى التركيز على موضوع واحد.
4) لا تستخدمي askToWrite في نفس الدور الذي فيه showQuiz، بل افصلي بينهما في دورين متتاليين.

نشاط الاختبار (أداة showQuiz):
1) عندما تريدين سؤال اختيار من متعدد:
   - قولي سؤالًا واضحًا للطفل مثل: "هَذَا سُؤَالٌ لَكَ: أَيُّ كَلِمَةٍ تَبْدَأُ بِحَرْفِ (الدَّالْ)؟ هَلْ هِيَ (دُبّْ) أَمْ (بَطَّةْ)؟"
   - اذكري السؤال والخيارات بصوت واضح وبنفس الصيغة التي سيظهر بها السؤال في النافذة.
2) في نفس الدور، استدعي داخليًا الأداة:
   - showQuiz({
       question: "أَيُّ كَلِمَةٍ تَبْدَأُ بِحَرْفِ (الدَّالْ)؟",
       options: ["دُبّْ", "بَطَّةْ"],
       answer: "دُبّْ"
     })
   مع مراعاة أن answer تكون مطابقة تمامًا لأحد عناصر options.
3) لا تستخدمي اسم الحرف نفسه كخيار داخل options إلا إذا كان السؤال يطلب اختيار اسم الحرف (مثل: "ما اسم هذا الحرف؟").

قاعدة الأرقام والرموز الرياضية:
1) استخدمي دائماً الأرقام العربية (١، ٢، ٣، ٤، ٥، ٦، ٧، ٨، ٩، ٠) وليس الإنجليزية (1, 2, 3...).
2) عند النطق: قولي الرموز بالعربية:
   - + → "زَائِدْ"
   - - → "نَاقِصْ"
   - × → "ضَرْبْ"
   - ÷ → "قِسْمَةْ"
   - = → "يُسَاوِي"
3) عند الرسم على السبورة: استخدمي الرموز مباشرة مثل: "٢ + ٣ = ٥"

قاعدة شكل الحرف في كل الأنشطة:
1) عندما تذكرين الحرف داخل نص السؤال أو الشرح بين أقواس، استخدمي دائمًا الرمز الواحد فقط مثل (ب)، (ت)، (ش)، (ل)، (م)، وليس اسم الحرف (الباء، التاء، الشين، اللام، الميم).
2) في معلمات الأدوات drawOnBoard و showQuiz و askToWrite، عند الحاجة لحرف واحد، اجعلي القيمة هي الرمز المفرد نفسه (مثل "ب"، "ش"، "ط") وليس اسم الحرف.
3) عند تعليم أشكال الحروف، استخدمي الصيغ: "حرف_بداية"، "حرف_وسط"، "حرف_نهاية" في drawOnBoard.

ثبات السلوك وتسلسل الدروس:
1) عند الاختبار: اذكري السؤال والخيارات في نص عربي طبيعي، ثم استخدمي showQuiz بنفس السؤال والخيارات.
2) عند الكتابة: اذكري حرفًا واحدًا واضحًا داخل أقواس على شكل رمز مفرد (مثل (د))، ثم استخدمي askToWrite بنفس الحرف.
3) عند الرسم: وضّحي للطفل ماذا رُسِم، واستخدمي drawOnBoard بعنصر واحد واضح في كل مرة، مثل حرف واحد أو كلمة واحدة أو شكل واحد (تفاحة، بيت، شجرة) أو معادلة رياضية كاملة (٢ + ٢ = ٤).
4) طبّقي حلقة: شرح على السبورة، ثم تمرين نطق، ثم كتابة، ثم سؤال قصير، مع فواصل لطيفة ومديح بين الخطوات.

قاعدة صارمة لعدم إظهار أو نطق الأكواد:
1) كلامك مع الطفل يجب أن يكون عربيًا طبيعيًا فقط، بدون أي شكل من أشكال الأكواد أو JSON أو الأقواس البرمجية.
2) يُمنَع تمامًا كتابة أو نطق أسماء الأدوات أو استدعاءاتها داخل النص مثل:
   - showQuiz(...), drawOnBoard(...), askToWrite(...), function، return، {}، []، ""، '' أو أي شيء يشبه كودًا.
3) إذا احتجتِ لاستخدام أداة، فاستدعيها داخليًا فقط عبر القناة المخصّصة للأدوات، ولا تذكري هذا الاستدعاء للطفل في الكلام.
4) بدل أن تقولي: showQuiz({ question: "...", options: ["..."], answer: "..." }) في كلامك، استخدمي جملة بشرية مثل: "سَأَطْرَحُ عَلَيْكَ سُؤَالًا، اسْتَمِعْ وَاخْتَرِ الْإِجَابَةَ الصَّحِيحَةَ."
5) وبدل أن تقولي: drawOnBoard({ item: "ب" }) في كلامك، استخدمي: "هَذَا هُوَ حَرْفُ (ب) عَلَى السَّبُّورَةِ."
6) لا تستخدمي علامات Markdown أو أي بناء يشبه الكود داخل كلامك الموجَّه للطفل؛ اجعلي كلامك دائمًا جملًا عربية طبيعية بسيطة وواضحة للطفل.`
                            }]
                        },
                        tools: [
                            {
                                function_declarations: [
                                    {
                                        name: "drawOnBoard",
                                        description: "Draws an item (image) OR writes text/numbers on the board. Can be used for anything: 'apple', 'car', 'word_apple', '5', 'sentence'.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                item: { type: "STRING", description: "The item to draw or write (e.g. 'apple', 'tree', '5', 'أحسنت', 'بكم')." }
                                            },
                                            required: ["item"]
                                        }
                                    },
                                    {
                                        name: "showQuiz",
                                        description: "Shows a multiple choice quiz modal to the student.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                question: { type: "STRING", description: "The question to ask." },
                                                options: { type: "ARRAY", items: { type: "STRING" }, description: "List of 2-4 options." },
                                                answer: { type: "STRING", description: "The correct answer (must be one of the options)." }
                                            },
                                            required: ["question", "options", "answer"]
                                        }
                                    },
                                    {
                                        name: "askToWrite",
                                        description: "Opens the handwriting modal for the student to practice writing a specific letter or number.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                letter: { type: "STRING", description: "The single character (Arabic letter or number) to write." }
                                            },
                                            required: ["letter"]
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                };
                this.ws.send(JSON.stringify(setupMessage));
                
                // ⚡ إرسال رسالة "ابدئي" لإجبار المعلمة على الترحيب فوراً
                setTimeout(() => {
                    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                        const startMsg = {
                            client_content: {
                                turns: [
                                    { role: "user", parts: [{ text: "." }] }
                                ],
                                turn_complete: true
                            }
                        };
                        console.log('⚡ [LIVE] Sending jumpstart message...');
                        this.ws.send(JSON.stringify(startMsg));
                    }
                }, 200);

                resolve(true);
            };

            this.ws.onmessage = async (event) => {
                try {
                    let response;
                    if (typeof event.data === 'string') {
                        response = JSON.parse(event.data);
                    } else {
                        // كود يدوي لفك تشفير UTF-8 ليدعم العربية بدون TextDecoder
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
            };

            this.ws.onclose = () => {
                console.log('📡 [LIVE] Connection Closed 🔌');
                this.isConnected = false;
                this.stopMic();

                // Smart Reconnect: Only retry if it was unexpected (not manually disconnected)
                if (this.isConnecting || (this.ws && !this._manualClose)) {
                    if (this._retryCount < 3) { // Limit retry attempts
                        this._retryCount = this._retryCount + 1;
                        console.log(`🔄 [LIVE] Unexpected drop. Reconnecting (Attempt ${this._retryCount})...`);
                        setTimeout(() => this.connect(this._lastUserName, this._lastGrade), 1000);
                    } else {
                        console.error('❌ [LIVE] Max reconnection attempts reached. Giving up.');
                        if (this.onDisconnect) this.onDisconnect(); // Call disconnect handler if max retries
                    }
                } else {
                    if (this.onDisconnect) this.onDisconnect(); // Call disconnect handler for manual close
                }
            };
        });
    }

    handleResponse(response) {
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
                modelTurn.parts.forEach(part => {
                    if (part.text) {
                        console.log('📥 [LIVE] Received partial text:', part.text);
                        this.currentTurnText += part.text;
                        if (this.onIncrementalText) this.onIncrementalText(this.currentTurnText);
                        this._resetSilenceTimeout(); // Reset timer on activity
                    }

                    // HANDLE FUNCTION CALLS INSIDE PARTS
                    const fnCall = part.functionCall || part.function_call;
                    if (fnCall) {
                        console.log('⚡ [LIVE] Function Call Detected:', fnCall.name);
                        if (this.onToolCall) {
                            this.onToolCall(fnCall.name, fnCall.args);
                        }
                    }
                });
            }

            // Check specifically for turn_complete flag in newer API versions
            // or infer from content structure. Gemini Live usually sends turn_complete: true at root of content or modelTurn
            const turnComplete = content.turnComplete || content.turn_complete;

            if (turnComplete) {
                const text = this.currentTurnText.trim();
                console.log('✅ [LIVE] Turn Complete (Server). Text Length:', text.length);

                if (this.silenceTimeout) clearTimeout(this.silenceTimeout);

                // CRITICAL: Even if text is empty (Audio-only response), we must complete the turn!
                if (this.onContentReceived) {
                    this.onContentReceived(text || " ");
                }
                this.currentTurnText = "";
            }
        }
    }

    startMic() {
        if (!this.isConnected || this.micStarted) return;
        this.micStarted = true;
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
                this.ws.send(JSON.stringify({
                    realtime_input: { media_chunks: [{ data, mime_type: "audio/pcm;rate=16000" }] }
                }));
            }
        });
        LiveAudioStream.start();
        console.log('🎤 [LIVE] Microphone Streaming Active');
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
        console.log('🔇 [LIVE] Mic Stopped for TTS');
    }

    resumeMic() {
        this.isSpeaking = false;
        if (this.isConnected) {
            LiveAudioStream.start();
            console.log('🔊 [LIVE] Mic Resumed for User');
        }
    }

    stopMic() {
        LiveAudioStream.stop();
        this.micStarted = false;
        this.isSpeaking = false;
    }

    disconnect() {
        this.stopMic();
        this.ws?.close();
        this.ws = null;
        this.isConnected = false;
        this.isConnecting = false;
    }
}

export default new GeminiLiveService();
