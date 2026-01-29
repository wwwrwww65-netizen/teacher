// import { GOOGLE_API_KEY } from '../config/constants'; // Deprecated via Firebase
import LiveAudioStream from 'react-native-live-audio-stream';
import { aiService } from './AIService';
import { firebaseService } from './FirebaseService';
import Voice from '@react-native-voice/voice'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 

class GeminiLiveService {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.onContentReceived = null;
        this.onIncrementalText = null;
        this.onToolCall = null;
        this.currentTurnText = "";
        this.isSpeaking = false;
        this.isConnecting = false;
        this.audioOptions = {
            sampleRate: 16000, 
            channels: 1,
            bitsPerSample: 16,
            audioSource: 6, 
            bufferSize: 8192 
        };
        this.silenceTimeout = null;
        
        // Voice Recognition
        this.localTranscript = ""; 
        this.isLocalVoiceActive = false; 

        // Warm-up configuration
        this.isWarmUpReady = false; 
    }

    // ------------------------------------------------------------------------
    // CORE REST STREAMING LOGIC
    // ------------------------------------------------------------------------

    async connect() {
        if (this.isConnected) return;
        this.isConnecting = true;
        
        console.log('🚀 [LIVE] Starting REST Stream Session (Stable Hybrid Mode)...');

        try {
            // 1. Get Config
            const config = await firebaseService.getAppConfig();
            
            // 2. Setup API Key & Model
            this.apiKey = config?.api_keys?.google_gemini || GOOGLE_API_KEY; // Use global variable if config fails
            this.modelName = config?.ai_settings?.model_name || "models/gemini-2.0-flash"; // Reliable model (Corrected Name)

            if (!this.apiKey) {
                console.error('❌ [LIVE] Critical: No API Key found!');
                this.isConnecting = false;
                return;
            }

            // 3. Prepare System Prompt with User Context
            const remotePrompt = config?.ai_settings?.system_prompt || "You are Teacher Nora.";
            const userProfile = aiService.getUserProfile();
            const { name, grade, age } = userProfile;
            
            this.finalSystemPrompt = remotePrompt + `\n\n[USER CONTEXT: Name=${name}, Grade=${grade}, Age=${age}]`;

            console.log('🧠 [LIVE] System Prompt Prepared. Length:', this.finalSystemPrompt.length);
            console.log('🤖 [LIVE] Model Set To:', this.modelName);

            // 🕵️ DEBUG: Check available models (Disabled for production)
            // this.checkAvailableModels(this.apiKey);

            // 4. Set Ready State
            this.isConnected = true;
            this.isConnecting = false;
            
            // Notify UI we are ready (Mocking old WS behavior)
            if (this.ws && typeof this.ws.onopen === 'function') {
                this.ws.onopen(); 
            } else {
                // If UI is listening to 'open' event via some other mechanism (not implemented here but kept for safety)
            }
            
            
            console.log('✅ [LIVE] Session Ready. Waiting for VAD input...');
            
            // 🚀 AUTO-START: Send Greeting
            setTimeout(() => {
                 const greetingContext = aiService.getGreetingContext();
                 console.log('💬 [LIVE] Sending Initial Greeting:', greetingContext);
                 this._sendGreetingMessage(greetingContext);
            }, 500);


        } catch (error) {
            console.error('❌ [LIVE] Connection Setup Failed:', error);
            this.isConnecting = false;
        }
    }

    async disconnect() {
        console.log('🔌 [LIVE] Ending Session...');
        this.isConnected = false;
        this.stopMic(); // Stop VAD
        this._stopLocalVoiceRecognition();
    }

    async sendText(text) {
        if (!text || !text.trim()) return;
        console.log('📤 [LIVE] Sending Text (Stream):', text);
        
        this.isSpeaking = true; // Teacher thinking/speaking state
        this.currentTurnText = "";
        
        try {
            // Ensure model name has 'models/' prefix
            let safeModelName = this.modelName;
            if (!safeModelName.startsWith('models/')) {
                safeModelName = `models/${safeModelName}`;
            }

            // Using Standard GenerateContent Endpoint (More Stable)
            const url = `https://generativelanguage.googleapis.com/v1beta/${safeModelName}:generateContent?key=${this.apiKey}`;
            
            console.log('🔗 [LIVE] Request URL:', url); // Debug URL
            
            const payload = {
                contents: [
                    {
                        role: "user",
                        parts: [{ text: this.finalSystemPrompt + "\n\n" + "الطالب قال: " + text }] 
                    }
                ],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 800
                }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log(`📡 [LIVE] HTTP Status: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                // Check for 400 Bad Request which usually means context too long
                if (response.status === 400) {
                     console.error('❌ [LIVE] 400 Bad Request. Likely Context Limit Exceeded.');
                     // Fallback: Try with shorter prompt if possible (future enhancement)
                }
                console.error(`❌ [LIVE] API Error (${response.status}):`, errorText);
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            // Handle Response (Single Object)
            const data = await response.json(); 
            this._processChunk(data);
            
            if (this.currentTurnText.length === 0) {
                 console.log('⚠️ [LIVE] Response was empty. Raw Data:', JSON.stringify(data).substring(0, 500));
            } else {
                 // 🚀 CRITICAL: Trigger UI/TTS with the full text
                 if (this.onContentReceived) {
                     console.log('📤 [LIVE] Delivery to UI/TTS:', this.currentTurnText.length, 'chars');
                     this.onContentReceived(this.currentTurnText);
                 }
            }
            
            console.log('🏁 [LIVE] Response Complete. Final Text Length:', this.currentTurnText.length);
            this.isSpeaking = false;

        } catch (error) {
            console.error('❌ [LIVE] REST Request Error:', error);
            this.isSpeaking = false;
            // Fallback: Notify UI of error
             if (this.onContentReceived) this.onContentReceived("... (حدث خطأ في الاتصال)");
        }
    }
    
    _processChunk(chunk) {
        try {
            const candidate = chunk?.candidates?.[0];
            
            // 1. Text Content
            const textPart = candidate?.content?.parts?.find(p => p.text);
            if (textPart?.text) {
                 this.currentTurnText += textPart.text;
                 // Emit update to UI
                 if (this.onIncrementalText) this.onIncrementalText(this.currentTurnText);
            } else {
                // Debug why text is missing
                if (candidate?.finishReason) {
                    console.log('⚠️ [LIVE] No text content. Finish Reason:', candidate.finishReason);
                }
            }
            
            // 2. Function Calls (Tools)
            // REST API returns functionCall/function_call inside parts
            const functionCallPart = candidate?.content?.parts?.find(p => p.functionCall || p.function_call);
            if (functionCallPart) {
                const fn = functionCallPart.functionCall || functionCallPart.function_call;
                console.log('⚡ [LIVE] Tool Call Detected:', fn.name);
                
                if (this.onToolCall) {
                    this.onToolCall({
                        name: fn.name,
                        args: fn.args
                    });
                }
            }
            
        } catch (e) {
            // ignore malformed chunk
        }
    }

    // ------------------------------------------------------------------------
    // VAD & MIC (UNCHANGED LOGIC kept for compatibility)
    // ------------------------------------------------------------------------
    
    startMic() {
        if (this.micStarted) return;
        this.micStarted = true;
        console.log('🎤 [LIVE] Mic Started (Managed by VAD UI)');
        this._startLocalVoiceRecognition();
    }

    stopMic() {
        this.micStarted = false;
        console.log('mic stopped');
        this._stopLocalVoiceRecognition();
    }

    // 🚩 FIX: Added missing methods for ClassroomScreen compatibility
    pauseMic() {
        console.log('⏸️ [LIVE] Mic Paused');
        this.stopMic();
    }

    resumeMic() {
        console.log('▶️ [LIVE] Mic Resumed');
        this.startMic();
    }
    
    // ------------------------------------------------------------------------
    // LEGACY / PLACEHOLDER METHODS (To prevent crashes in UI)
    // ------------------------------------------------------------------------
    
    _resetSilenceTimeout() {}
    _triggerTurnComplete() {}
    
    async _startLocalVoiceRecognition() {
         try {
            await Voice.destroy(); // 🧹 Clean start
            
            Voice.onSpeechStart = () => console.log('🎤 [VOICE-LIB] Started');
            Voice.onSpeechEnd = () => console.log('🎤 [VOICE-LIB] Ended');
            Voice.onSpeechError = (e) => {
                console.error('❌ [VOICE-LIB] Error:', e);
                // Auto-restart on "No Match" (7) or "No Speech" (6)
                if (e.error?.code === '7' || e.error?.code === '6') {
                    console.log('🔄 [VOICE-LIB] No match/speech, restarting mic...');
                    setTimeout(() => {
                        if (!this.isSpeaking && this.isConnected) {
                            try { Voice.start('ar-SA'); } catch(err) {}
                        }
                    }, 500);
                }
            };
            
            Voice.onSpeechResults = (e) => {
                if (e.value && e.value.length > 0) {
                    const transcript = e.value[0];
                    this.localTranscript = transcript;
                    console.log('🗣️ [LOCAL MIC - تفريغ صوتي]:', transcript);
                    
                    // 🔥 CRITICAL FIX: Send text to AI immediately upon detection
                    if (!this.isSpeaking && transcript.trim().length > 0) {
                         console.log('🚀 [VAD] Speech detected -> Sending to Gemini...');
                         this.stopMic(); // Stop detecting while thinking
                         this.sendText(transcript);
                    }
                }
            };
            Voice.onSpeechPartialResults = (e) => {
                 if (e.value && e.value[0]) this.localTranscript = e.value[0];
            };
            await Voice.start('ar-SA');
         } catch(e) {
             console.error('❌ [VOICE-LIB] Start Failed:', e);
         }
    }

    // ------------------------------------------------------------------------
    // GREETING LOGIC
    // ------------------------------------------------------------------------
    async _sendGreetingMessage(context) {
        if (!context) return;
        
        console.log('📨 [LIVE] Injecting Greeting Context...');
        
        const triggerMessage = `
(🔴 SYSTEM INSTRUCTION - HIDDEN FROM USER)
This is a new session trigger.
User Situation: ${context.type === 'first_visit' ? 'First time ever meeting you.' : 'Returning student.'}
Context Message: "${context.message}"

ACTION REQUIRED:
1. Ignore the above "Context Message" text as if the user said it. instead, UNDERSTAND the situation.
2. WELCOME the student nicely using the details provided (Name: ${context.message.includes('احمد') ? 'Ahmed' : 'Student'}).
3. Speak in Arabic (Fusha with Tashkeel).
4. Ask what they want to learn today.
`;
        // Send this silently to trigger the AI's first turn
        await this.sendText(triggerMessage);
    }
    
    async _stopLocalVoiceRecognition() {
        try { await Voice.stop(); await Voice.destroy(); } catch(e) {}
    }
    
    initializeWarmUpConnection() { console.log('Warmup skipped in REST mode'); }
    waitForWarmUp() { return Promise.resolve(); }
    async checkAvailableModels(apiKey) {
        try {
            console.log('🕵️ [DEBUG] Listing available models...');
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const data = await response.json();
            if (data.models) {
                console.log('📋 [DEBUG] Available Models:', data.models.map(m => `${m.name} (${m.supportedGenerationMethods})`).join('\n'));
            } else {
                console.log('⚠️ [DEBUG] Could not list models:', data);
            }
        } catch (e) {
            console.error('❌ [DEBUG] checkAvailableModels failed:', e);
        }
    }
}
export default new GeminiLiveService();
