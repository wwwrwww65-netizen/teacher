import Tts from 'react-native-tts';
import Voice from '@react-native-voice/voice';
import { Platform } from 'react-native';
import { analyzeArabicText, generateVisemeTimeline } from '../utils/arabicVisemes';

/**
 * خدمة الصوت العربي الاحترافي
 * دعم كامل للنطق العربي مع مخارج الحروف
 */

class ArabicVoiceService {
    constructor() {
        this.isInitialized = false;
        this.currentLanguage = 'ar-SA';
        this.voiceCallbacks = [];
    }

    /**
     * تهيئة خدمة الصوت
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            // تكوين TTS
            await this.configureTTS();

            // تكوين Voice Recognition
            await this.configureVoiceRecognition();

            this.isInitialized = true;
            console.log('✅ Arabic Voice Service initialized');
        } catch (error) {
            console.error('❌ Error initializing voice service:', error);
        }
    }

    /**
     * تكوين TTS للعربية
     */
    async configureTTS() {
        // الحصول على الأصوات المتاحة
        const voices = await Tts.voices();

        // البحث عن أفضل صوت عربي
        const arabicVoices = voices.filter(v =>
            v.language.startsWith('ar') ||
            v.name.includes('Arabic') ||
            v.name.includes('عربي')
        );

        // ترتيب الأصوات حسب الجودة
        const preferredVoices = [
            // iOS - أصوات عالية الجودة
            'Laila',           // صوت ليلى (iOS - Enhanced)
            'Maged',           // صوت ماجد (iOS - Enhanced)
            'Tarik',           // صوت طارق (iOS)

            // Android - أصوات Google
            'ar-xa-x-arc-network',  // Google Arabic (Female)
            'ar-xa-x-ard-network',  // Google Arabic (Male)
            'ar-XA-language',       // Google Arabic Standard
        ];

        // اختيار أفضل صوت متاح
        let selectedVoice = null;
        for (const voiceName of preferredVoices) {
            const voice = arabicVoices.find(v =>
                v.name === voiceName || v.id === voiceName
            );
            if (voice) {
                selectedVoice = voice;
                break;
            }
        }

        // إذا لم يتم العثور على صوت مفضل، استخدم أول صوت عربي
        if (!selectedVoice && arabicVoices.length > 0) {
            selectedVoice = arabicVoices[0];
        }

        // تطبيق الإعدادات
        if (selectedVoice) {
            await Tts.setDefaultVoice(selectedVoice.id);
            console.log(`🎤 Selected Arabic voice: ${selectedVoice.name}`);
        }

        // إعدادات النطق
        await Tts.setDefaultLanguage('ar-SA'); // العربية السعودية (الأوضح)
        await Tts.setDefaultRate(0.45);        // سرعة بطيئة للأطفال
        await Tts.setDefaultPitch(1.15);       // نبرة أعلى قليلاً (صوت أنثوي دافئ)

        // إضافة مستمعين للأحداث
        Tts.addEventListener('tts-start', () => this.onSpeechStart());
        Tts.addEventListener('tts-finish', () => this.onSpeechFinish());
        Tts.addEventListener('tts-cancel', () => this.onSpeechCancel());
        Tts.addEventListener('tts-progress', (event) => this.onSpeechProgress(event));
    }

    /**
     * تكوين التعرف على الصوت
     */
    async configureVoiceRecognition() {
        Voice.onSpeechStart = () => console.log('🎤 Speech recognition started');
        Voice.onSpeechEnd = () => console.log('🎤 Speech recognition ended');
        Voice.onSpeechError = (e) => console.error('🎤 Speech error:', e);
        Voice.onSpeechResults = (e) => this.onSpeechResults(e);
    }

    /**
     * نطق نص عربي مع مخارج الحروف
     */
    async speak(text, options = {}) {
        const {
            language = 'ar-SA',
            rate = 0.45,
            pitch = 1.15,
            onVisemeChange = null,
        } = options;

        try {
            // إيقاف أي نطق سابق
            await Tts.stop();

            // تحليل النص للحصول على مخارج الحروف
            const { timeline, totalDuration } = generateVisemeTimeline(text);

            // حفظ callback لتغيير الفم
            if (onVisemeChange) {
                this.currentVisemeCallback = onVisemeChange;
                this.currentTimeline = timeline;
                this.startVisemeAnimation();
            }

            // النطق
            await Tts.setDefaultLanguage(language);
            await Tts.setDefaultRate(rate);
            await Tts.setDefaultPitch(pitch);
            await Tts.speak(text);

            return {
                timeline,
                totalDuration,
            };
        } catch (error) {
            console.error('❌ Error in speak:', error);
            throw error;
        }
    }

    /**
     * تشغيل animation لمخارج الحروف
     */
    startVisemeAnimation() {
        if (!this.currentTimeline || !this.currentVisemeCallback) return;

        let currentIndex = 0;
        const startTime = Date.now();

        const animate = () => {
            if (currentIndex >= this.currentTimeline.length) {
                this.stopVisemeAnimation();
                return;
            }

            const elapsed = Date.now() - startTime;
            const current = this.currentTimeline[currentIndex];

            if (elapsed >= current.time) {
                this.currentVisemeCallback(current.shape, current.path);
                currentIndex++;
            }

            this.visemeAnimationFrame = requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * إيقاف animation
     */
    stopVisemeAnimation() {
        if (this.visemeAnimationFrame) {
            cancelAnimationFrame(this.visemeAnimationFrame);
            this.visemeAnimationFrame = null;
        }
        this.currentTimeline = null;
        this.currentVisemeCallback = null;
    }

    /**
     * الاستماع للصوت (Speech Recognition)
     */
    async listen(language = 'ar-SA') {
        return new Promise((resolve, reject) => {
            let hasResolved = false;

            const onResults = (e) => {
                if (hasResolved) return;
                if (e.value && e.value[0]) {
                    console.log('🎤 Heard:', e.value[0]);
                    cleanup();
                    hasResolved = true;
                    resolve(e.value[0]);
                }
            };

            const onError = (e) => {
                if (hasResolved) return;
                console.log('🎤 Error:', e);
                cleanup();
                hasResolved = true;
                reject(e);
            };

            const cleanup = () => {
                Voice.destroy().then(Voice.removeAllListeners);
            };

            Voice.onSpeechResults = onResults;
            Voice.onSpeechError = onError;

            Voice.start(language)
                .then(() => console.log('🎤 Listening started...'))
                .catch((e) => {
                    console.error(e);
                    if (!hasResolved) {
                        hasResolved = true;
                        reject(e);
                    }
                });

            // Timeout
            setTimeout(() => {
                if (!hasResolved) {
                    console.log('🎤 Timeout');
                    cleanup();
                    hasResolved = true;
                    resolve(''); // Empty result on timeout
                }
            }, 10000); // 10 seconds
        });
    }

    /**
     * إيقاف النطق
     */
    async stop() {
        await Tts.stop();
        this.stopVisemeAnimation();
    }

    /**
     * تغيير اللغة
     */
    async setLanguage(language) {
        this.currentLanguage = language;
        await Tts.setDefaultLanguage(language);
    }

    /**
     * Event handlers
     */
    onSpeechStart() {
        this.voiceCallbacks.forEach(cb => cb.onStart && cb.onStart());
    }

    onSpeechFinish() {
        this.stopVisemeAnimation();
        this.voiceCallbacks.forEach(cb => cb.onFinish && cb.onFinish());
    }

    onSpeechCancel() {
        this.stopVisemeAnimation();
        this.voiceCallbacks.forEach(cb => cb.onCancel && cb.onCancel());
    }

    onSpeechProgress(event) {
        this.voiceCallbacks.forEach(cb => cb.onProgress && cb.onProgress(event));
    }

    onSpeechResults(event) {
        this.voiceCallbacks.forEach(cb => cb.onResults && cb.onResults(event));
    }

    /**
     * إضافة مستمع
     */
    addListener(callback) {
        this.voiceCallbacks.push(callback);
    }

    /**
     * إزالة مستمع
     */
    removeListener(callback) {
        const index = this.voiceCallbacks.indexOf(callback);
        if (index > -1) {
            this.voiceCallbacks.splice(index, 1);
        }
    }
}

// Singleton instance
const arabicVoiceService = new ArabicVoiceService();

export default arabicVoiceService;
