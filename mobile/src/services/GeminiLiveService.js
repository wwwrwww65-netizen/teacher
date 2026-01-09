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
        this.audioOptions = {
            sampleRate: 16000,
            channels: 1,
            bitsPerSample: 16,
            audioSource: 6,
            bufferSize: 4096
        };
    }

    connect(userName = 'هاشم', userGrade = 'الصف الثالث') {
        return new Promise((resolve, reject) => {
            const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GOOGLE_API_KEY}`;
            console.log('📡 [LIVE] Connecting to Gemini...');
            this.ws = new WebSocket(url);

            this.ws.onopen = () => {
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
                                4. الروح: لهجة سعودية حنونة، بطيئة، وواضحة جداً. لا تستخدمي الرموز التعبيرية (Emoji) بكثرة.`
                            }]
                        }
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
                    // console.log('WS Parse skip'); 
                }
            };

            this.ws.onclose = () => {
                console.log('📡 [LIVE] Connection Closed 🔌');
                this.isConnected = false;
                this.stopMic();
                if (this.onDisconnect) this.onDisconnect();
            };
        });
    }

    handleResponse(response) {
        if (response.setupComplete || response.setup_complete) {
            console.log('✅ [LIVE] Setup Complete. Mic Starting...');
            this.startMic();
        }

        const serverContent = response.serverContent || response.server_content;
        if (serverContent) {
            const modelTurn = serverContent.modelTurn || serverContent.model_turn;
            if (modelTurn?.parts) {
                this.isSpeaking = true;
                modelTurn.parts.forEach(part => {
                    if (part.text) {
                        console.log('📥 [LIVE] Received partial text:', part.text);
                        this.currentTurnText += part.text;
                        // نرسل النص المتراكم فوراً لتحديث الشاشة
                        if (this.onIncrementalText) this.onIncrementalText(this.currentTurnText);
                    }
                });
            }

            if (serverContent.turnComplete) {
                const text = this.currentTurnText.trim();
                console.log('✅ [LIVE] Turn Complete. Full Text:', text);
                this.currentTurnText = "";
                if (text && this.onContentReceived) {
                    this.onContentReceived(text);
                }
            }
        }
    }

    startMic() {
        if (!this.isConnected || this.micStarted) return;
        this.micStarted = true;
        LiveAudioStream.init(this.audioOptions);
        LiveAudioStream.on('data', data => {
            if (this.isSpeaking || !this.isConnected) return;
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    realtime_input: { media_chunks: [{ data, mime_type: "audio/pcm;rate=16000" }] }
                }));
            }
        });
        LiveAudioStream.start();
        console.log('🎤 [LIVE] Microphone Streaming Active');
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
    }
}

export default new GeminiLiveService();
