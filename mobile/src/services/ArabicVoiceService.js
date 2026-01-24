import Tts from 'react-native-tts';
import Voice from '@react-native-voice/voice';
import { Platform } from 'react-native';
import axios from 'axios';
import RNFS from 'react-native-fs';
import SoundPlayer from 'react-native-sound-player';
import { generateVisemeTimeline } from '../utils/arabicVisemes';
// import { GOOGLE_API_KEY } from '../config/constants';
import { firebaseService } from './FirebaseService';

class ArabicVoiceService {
    constructor() {
        this.isInitialized = false;
        this.voiceCallbacks = [];
        this.isPlaying = false;
        this.isLiveMode = true;
        this.cancellationSignal = false; // 🛑 Signal to abort pending speech
    }

    async initialize() {
        if (this.isInitialized) return;
        try {
            SoundPlayer.addEventListener('FinishedPlaying', ({ success }) => {
                this.stopVisemeAnimation();
                this.isPlaying = false;
                this.onSpeechFinish();
                if (this.currentSpeakResolve) {
                    this.currentSpeakResolve(success);
                    this.currentSpeakResolve = null;
                }
            });
            
            // Fetch API Key dynamically
            const config = await firebaseService.getAppConfig();
            this.apiKey = config?.api_keys?.google_gemini || GOOGLE_API_KEY;
            
            this.isInitialized = true;
        } catch (error) {
            console.error('❌ Error initializing voice service:', error);
        }
    }

    // 🔧 Helper: تنظيف ومعالجة النص لتحسين النطق
    _preprocessText(text) {
        if (!text) return "";
        let processed = text;

        // تعريف علامات الوقف الصريحة (بما فيها الأقواس والرموز)
        const stopChars = "[:.؟?!,،؛»«(){}\\[\\]\"'\\-]";
        
        // 1. قاعدة التاء المربوطة (ة):
        // تحويل "ة" إلى "ه" عند الوقف (قبل أي علامة وقف أو نهاية النص)
        const reTaa = new RegExp("(\\u0629)([\\u064B-\\u065F]*)(?=\\s*(" + stopChars + "|$))", "g");
        processed = processed.replace(reTaa, 'ه');

        // 2. إزالة التشكيل (ما عدا الشدة \u0651) من الحرف الأخير قبل الوقف
        // النطاق تشكيل بدون الشدة: \u064B-\u0650 و \u0652-\u065F
        const reDiacritics = new RegExp("[\\u064B-\\u0650\\u0652-\\u065F]+(?=\\s*(" + stopChars + "|$))", "g");
        processed = processed.replace(reDiacritics, '');

        // 3. معالجة علامات الترقيم (فواصل زمنية)
        processed = processed.replace(/([.?!؟])/g, '$1 <break time="400ms"/>'); 
        processed = processed.replace(/([،,])/g, '$1 <break time="200ms"/>');
        processed = processed.replace(/([»«()])/g, ' ');

        return processed;
    }

    async fetchGoogleTTS(text, retryCount = 0) {
        // 🛡️ Ensure initialization
        if (!this.apiKey) {
            console.log('⚠️ [TTS] API Key missing, re-initializing...');
            await this.initialize();
        }

        const key = this.apiKey || GOOGLE_API_KEY;
        if (!key) {
            console.error('❌ [TTS] No API Key found even after initialization!');
            throw new Error('No API Key');
        }

        const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`;
        
        // ✨ تطبيق المعالجة المسبقة
        // 1. Remove HTML/XML tags first
        let safeText = text.replace(/<[^>]+>/g, '');
        // 2. Remove Markdown asterisks and underscores
        safeText = safeText.replace(/[*_#`]/g, ' '); 
        // 3. Remove SSML reserved characters (<, >, &, ", ') entirely to prevent 400 errors
        safeText = safeText.replace(/[<>&"']/g, ' ');

        const cleanText = this._preprocessText(safeText); 
        const ssmlText = `<speak>${cleanText}</speak>`;

        const body = {
            input: { ssml: ssmlText },
            voice: { languageCode: 'ar-XA', name: 'ar-XA-Chirp3-HD-Sulafat', ssmlGender: 'FEMALE' },
            audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0, pitch: 0.0, volumeGainDb: 0.0 }
        };

        try {
            console.log(`📡 [TTS] Fetching audio (Attempt ${retryCount + 1}). Text len: ${cleanText.length}`);
            const response = await axios.post(url, body, { timeout: 15000 });
            return response.data.audioContent;
        } catch (error) {
            console.error(`❌ [TTS] Error (Attempt ${retryCount + 1}):`, error.message);
            if (error.response) {
                console.error('❌ [TTS] Response Data:', JSON.stringify(error.response.data));
            }
            
            if (retryCount < 2) {
                console.log('🔄 [TTS] Retrying...');
                await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
                return this.fetchGoogleTTS(text, retryCount + 1);
            }
            throw error;
        }
    }

    async prepareAudioFile(audioContent) {
        const path = `${RNFS.CachesDirectoryPath}/speech_${Date.now()}.mp3`;
        await RNFS.writeFile(path, audioContent, 'base64');
        return path;
    }

    async playAudioFile(path, text, options = {}) {
        const { onVisemeChange = null, onPlayStart = null } = options;
        return new Promise((resolve) => {
            (async () => {
                try {
                    this.currentSpeakResolve = resolve;
                    if (onVisemeChange) {
                        this.currentVisemeCallback = onVisemeChange;
                        this.startVisemeAnimation(text);
                    }
                    if (onPlayStart) onPlayStart();
                    SoundPlayer.setVolume(1.0);
                    this.isPlaying = true;
                    SoundPlayer.playUrl('file://' + path);
                } catch (e) {
                    console.error("Audio Playback error:", e);
                    resolve(false);
                }
            })();
        });
    }

    async speak(text, options = {}) {
        this.cancellationSignal = false; // ✅ Reset signal on new speak request
        await this.initialize();
        try {
            console.log('🔊 [TEACHER-SPEAK] Teacher starting to speak:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
            
            // ⚡ تحسين: استخدام الصوت المُحمّل مسبقاً إن وجد
            let audioContent;
            if (options.preloadedAudio) {
                console.log('⚡ [TTS-FAST] Using preloaded audio!');
                audioContent = options.preloadedAudio;
            } else {
                console.log('⏱️ [TTS-SLOW] Fetching audio now (no preload)...');
                audioContent = await this.fetchGoogleTTS(text);
            }

            // 🛑 Check for cancellation race-condition (e.g. User left screen during fetch)
            if (this.cancellationSignal) {
                console.log('🛑 [TTS] Speak was cancelled during fetch/prep. Aborting playback.');
                return false;
            }
            
            console.log('📊 [TTS-DEBUG] Audio Size:', audioContent?.length);
            const path = await this.prepareAudioFile(audioContent);
            
            console.log('🔊 [TEACHER-SPEAK] Teacher audio prepared, starting playback...');
            const result = await this.playAudioFile(path, text, options);
            console.log('🔊 [TEACHER-SPEAK] Teacher finished speaking');
            return result;
        } catch (error) {
            console.log('🎤 [TTS] Fallback to System TTS');
            Tts.speak(text.replace(/<[^>]+>/g, ''));
            console.log('🔊 [TEACHER-SPEAK] Teacher spoke via fallback TTS');
            return true;
        }
    }

    startVisemeAnimation(text) {
        const { timeline } = generateVisemeTimeline(text);
        if (!timeline || !this.currentVisemeCallback) return;
        let currentIndex = 0;
        const startTime = Date.now();
        const animate = () => {
            if (!this.isPlaying || currentIndex >= timeline.length) {
                this.stopVisemeAnimation();
                return;
            }
            const elapsed = Date.now() - startTime;
            while (currentIndex < timeline.length && elapsed >= timeline[currentIndex].time) {
                this.currentVisemeCallback(timeline[currentIndex].shape, timeline[currentIndex].path);
                currentIndex++;
            }
            this.visemeAnimationFrame = requestAnimationFrame(animate);
        };
        animate();
    }

    stopVisemeAnimation() {
        if (this.visemeAnimationFrame) cancelAnimationFrame(this.visemeAnimationFrame);
        this.visemeAnimationFrame = null;
        this.currentVisemeCallback = null;
    }

    async stop() {
        this.cancellationSignal = true; // 🛑 Set signal immediately
        this.isPlaying = false;
        SoundPlayer.stop();
        this.stopVisemeAnimation();
    }

    onSpeechFinish() { this.voiceCallbacks.forEach(cb => cb.onFinish && cb.onFinish()); }
    addListener(callback) { this.voiceCallbacks.push(callback); }
    removeListener(callback) {
        const index = this.voiceCallbacks.indexOf(callback);
        if (index > -1) this.voiceCallbacks.splice(index, 1);
    }
    async listen() { console.log('🎤 [TTS] listen() called but bypassed in Live Mode.'); return ""; }
    async cancel() { await this.stop(); Tts.stop(); }
}

export default new ArabicVoiceService();
