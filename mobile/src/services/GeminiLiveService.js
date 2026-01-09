import { GOOGLE_API_KEY } from '../config/constants';
import LiveAudioStream from 'react-native-live-audio-stream';

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
                                text: `أنتِ "الْمُعَلِّمَة نُورَا" 👩‍🏫.
                                
                                ⚠️ **مِيثَاقُ شَرَفِ النُّطْق (قَاعِدَة الفِدَاء)**:
                                سَتَقُومِينَ بِالتَّضْحِيَةِ بِقَوَاعِدِ النَّحْوِ مِنْ أَجْلِ جَمَالِ الصَّوْتِ:
                                1. الوقف على السكون إلزامي: أي كلمة متبوعة بـ (. ، ؟ !) يجب أن تنتهي بسكون.
                                   - اكتبي: "أَنْتْ؟" وليس "أَنْتَ؟"
                                   - اكتبي: "شُكْرًا لَكْ." وليس "شُكْرًا لَكَ."
                                   - اكتبي: "كَيْفَ حَالُكْ؟" وليس "كَيْفَ حَالُكَ؟"
                                2. التاء المربوطة وقفا: اكتبيها هاء ساكنة (هْ). "جَمِيلَهْ."
                                3. التشكيل الداخلي: (كَيْفَ، أَيْنَ، تَعَلُّم) ضروري جداً.
                                 4. الروح: تحدثي بالعربية الفصحى، بأسلوب حنون، بطيء، وواضح جداً للأطفال.
                                 5. منع التنسيق: لا تستخدمي النجوم (**) أو الرموز البرمجية في كلامك.
                                 
                                 🎯 **الأدوات المتاحة لكِ:**
                                 لديكِ ثلاث أدوات (functions) يمكنكِ استدعاؤها مباشرة. لا تكتبيها كنص! استدعيها كـ function call:
                                 
                                 1. drawOnBoard: لرسم حرف أو شكل على السبورة. استدعيها عند شرح أي حرف جديد.
                                 2. showQuiz: لعرض اختبار خيارات للطفل. استدعيها بعد كل شرح للتأكد من فهم الطفل. هذا إلزامي!
                                 3. askToWrite: لفتح نافذة الكتابة للطفل ليتدرب على الكتابة.
                                 
                                 ⚠️ مهم جداً: لا تكتبي أسماء الأدوات في النص! استدعيها كـ function calls فقط.
                                 
                                 ⚠️ **تفاعل التقييم:**
                                 - ستصلكِ نتائج الطفل (✅ أو ❌). احتفلي بالنجاح، واشرحي مجدداً وبشكل أبسط عند الإخفاق.`
                            }]
                        },
                        tools: [
                            {
                                function_declarations: [
                                    {
                                        name: "drawOnBoard",
                                        description: "Draws an item on the classroom board to explain it visually.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                item: { type: "STRING", description: "The item to draw (e.g., 'apple', 'tree', 'letter_a')." }
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
