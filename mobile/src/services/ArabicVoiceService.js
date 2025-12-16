import Tts from 'react-native-tts';
import Voice from '@react-native-voice/voice';
import { Platform } from 'react-native';
import axios from 'axios';
import RNFS from 'react-native-fs';
import SoundPlayer from 'react-native-sound-player';
import { analyzeArabicText, generateVisemeTimeline } from '../utils/arabicVisemes';
import { GOOGLE_API_KEY, ANDROID_PACKAGE_NAME, ANDROID_CERT_FINGERPRINT } from '../config/constants';

/**
 * خدمة الصوت العربي الاحترافي
 * دعم كامل للنطق العربي مع مخارج الحروف باستخدام Google Cloud TTS (WaveNet)
 */

class ArabicVoiceService {
    constructor() {
        this.isInitialized = false;
        this.currentLanguage = 'ar-SA'; // For STT
        this.voiceCallbacks = [];
    }

    /**
     * تهيئة خدمة الصوت
     */
    async initialize() {
        if (this.isInitialized) return;

        console.log('🔄 Initializing ArabicVoiceService...');

        try {
            // Subscribe to finish event Use a check to prevent multiple listeners
            try {
                // First remove any existing listeners if possible (library might not support removeAll easily, but let's try just adding)
                SoundPlayer.addEventListener('FinishedPlaying', ({ success }) => {
                    console.log('✅ Finished playing:', success);
                    this.stopVisemeAnimation();
                });
            } catch (e) {
                console.warn('Listener attach error', e);
            }

            // Initialize Voice Recognition (Keep native for now)
            if (Voice) {
                try {
                    await this.configureVoiceRecognition();
                } catch (voiceError) {
                    console.warn('⚠️ Failed to initialize Voice Recognition:', voiceError);
                }
            }

            this.isInitialized = true;
            console.log('✅ Arabic Voice Service initialized');
        } catch (error) {
            console.error('❌ Error initializing voice service:', error);
        }
    }

    /**
     * تكوين التعرف على الصوت
     */
    async configureVoiceRecognition() {
        try {
            Voice.onSpeechStart = () => console.log('🎤 Speech recognition started');
            Voice.onSpeechEnd = () => console.log('🎤 Speech recognition ended');
            Voice.onSpeechError = (e) => console.error('🎤 Speech error:', e);
            Voice.onSpeechResults = (e) => this.onSpeechResults(e);
        } catch (e) {
            console.warn('⚠️ Error configuring Voice:', e);
        }
    }

    /**
     * الحصول على ملف صوتي من Google Cloud TTS
     */
    async fetchGoogleTTS(text) {
        const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`;
        const body = {
            input: { text: text },
            voice: {
                languageCode: 'ar-XA',
                name: 'ar-XA-Wavenet-A', // Standard, reliable Arabic Voice
                ssmlGender: 'FEMALE'
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: 1.1, // سرعة طبيعية (كانت 0.85 وسريعة جداً للمستخدم)
                pitch: 0.0
            }
        };

        const response = await axios.post(url, body, {
            headers: {
                'X-Android-Package': ANDROID_PACKAGE_NAME,
                'X-Android-Cert': ANDROID_CERT_FINGERPRINT
            }
        });
        return response.data.audioContent;
    }

    /**
     * نطق نص عربي مع مخارج الحروف
     */
    /**
     * نطق نص عربي مع مخارج الحروف - ينتظر انتهاء الصوت
     */
    async speak(text, options = {}) {
        const {
            language = 'ar-SA',
            rate = 0.85,
            pitch = 1.0,
            onVisemeChange = null,
            onPlayStart = null,
        } = options;

        return new Promise(async (resolve) => {
            try {
                // 1. إيقاف أي صوت حالي
                await this.stop();

                // WEB SUPPORT: Use Real Google Cloud TTS for Quality
                if (Platform.OS === 'web') {
                    console.log('🌐 Web platform detected, fetching Google Cloud TTS for quality...');
                    try {
                        const audioData = await this.fetchGoogleTTS(text);
                        const snd = new Audio("data:audio/mp3;base64," + audioData);

                        // Animation Trigger
                        if (onVisemeChange) {
                            this.currentVisemeCallback = onVisemeChange;
                            this.currentTimeline = generateVisemeTimeline(text).timeline;
                            this.startVisemeAnimation();
                        }

                        await new Promise((resolvePlay) => {
                            snd.onended = () => resolvePlay();
                            snd.onerror = (e) => {
                                console.error("Audio Playback Error", e);
                                resolvePlay();
                            };

                            // SYNC POINT: Audio is ready, about to play
                            if (onPlayStart) onPlayStart();

                            snd.play();
                        });

                        this.stopVisemeAnimation();
                        resolve(true);
                        return;

                    } catch (e) {
                        console.error("Web Google TTS Error, falling back to system:", e);

                        // Fallback to browser native TTS which works on Simulator/Web
                        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                            const utterance = new SpeechSynthesisUtterance(text);
                            utterance.lang = 'ar-SA';
                            utterance.rate = rate;
                            await new Promise(resolveSynth => {
                                utterance.onend = () => resolveSynth();
                                utterance.onerror = (err) => { console.warn('Synth error', err); resolveSynth(); };

                                if (onPlayStart) onPlayStart();
                                window.speechSynthesis.speak(utterance);

                                // Failsafe timeout in case onend never fires
                                setTimeout(resolveSynth, (text.length * 100) + 5000);
                            });
                        } else {
                            // Just simulate delay if no TTS available
                            await new Promise(r => setTimeout(r, 2000 + text.length * 50));
                        }

                        resolve(true);
                        return;
                    }
                }

                // 2. تحليل النص للحصول على مخارج الحروف (Animation)
                const { timeline, totalDuration } = generateVisemeTimeline(text);

                // 3. جلب الصوت من Google Cloud
                console.log('🔄 Fetching audio from Google Cloud...');
                const audioData = await this.fetchGoogleTTS(text);

                // 4. حفظ الملف محلياً
                const path = `${RNFS.CachesDirectoryPath}/speech_${Date.now()}.mp3`;
                await RNFS.writeFile(path, audioData, 'base64');

                // 5. إعداد مستمع الانتهاء
                const onFinish = ({ success }) => {
                    console.log('✅ Finished playing:', success);
                    this.stopVisemeAnimation();
                    if (this.finishListener) this.finishListener.remove();
                    resolve(true);
                };

                this.finishListener = SoundPlayer.addEventListener('FinishedPlaying', onFinish);

                // 6. تشغيل الصوت
                console.log('🔊 Playing audio:', path);

                // حفظ callback لتغيير الفم
                if (onVisemeChange) {
                    this.currentVisemeCallback = onVisemeChange;
                    this.currentTimeline = timeline;
                    this.startVisemeAnimation();
                }

                try {
                    // SYNC POINT: File exists, player ready
                    if (onPlayStart) onPlayStart();

                    SoundPlayer.playUrl('file://' + path);
                } catch (e) {
                    console.error('❌ SoundPlayer Error:', e);
                    this.stopVisemeAnimation();
                    if (this.finishListener) this.finishListener.remove();
                    resolve(false);
                }

            } catch (error) {
                console.error('❌ Error in speak:', error);
                resolve(false);
            }
        });
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
            // Find current viseme based on elapsed time (loop forward safely)
            while (currentIndex < this.currentTimeline.length && elapsed >= this.currentTimeline[currentIndex].time) {
                const current = this.currentTimeline[currentIndex];
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

            const cleanup = async () => {
                try {
                    await Voice.cancel();
                    await Voice.stop();
                    await Voice.destroy();
                    Voice.removeAllListeners();
                    console.log('🎤 Cleanup done');
                } catch (e) {
                    console.warn('🎤 Cleanup warning:', e);
                }
            };

            Voice.onSpeechResults = onResults;
            Voice.onSpeechError = onError;

            // التأكد من تنظيف أي جلسة سابقة
            Voice.destroy().then(() => {
                Voice.start(language)
                    .then(() => console.log('🎤 Listening started...'))
                    .catch((e) => {
                        console.error('🎤 Start Error:', e);
                        if (!hasResolved) {
                            cleanup();
                            hasResolved = true;
                            reject(e);
                        }
                    });
            });

            // Timeout - Auto stop silence
            setTimeout(() => {
                if (!hasResolved) {
                    console.log('🎤 Timeout - Silence detected');
                    cleanup();
                    hasResolved = true;
                    resolve(null); // Return null to indicate silence
                }
            }, 5000); // 5 seconds listening window
        });
    }

    /**
     * إيقاف النطق
     */
    async stop() {
        // Stop Sound
        try {
            SoundPlayer.stop();
        } catch (e) { }

        // Stop Viseme Animation
        this.stopVisemeAnimation();
    }

    /**
     * تغيير اللغة (احتياطي فقط، غير مستخدم مع قوقل حاليا)
     */
    async setLanguage(language) {
        this.currentLanguage = language;
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
