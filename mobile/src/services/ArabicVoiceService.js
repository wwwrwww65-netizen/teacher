import Tts from 'react-native-tts';
import Voice from '@react-native-voice/voice';
import { Platform } from 'react-native';
import axios from 'axios';
import RNFS from 'react-native-fs';
import SoundPlayer from 'react-native-sound-player';
import { analyzeArabicText, generateVisemeTimeline } from '../utils/arabicVisemes';
import { GOOGLE_API_KEY, ANDROID_PACKAGE_NAME, ANDROID_CERT_FINGERPRINT } from '../config/constants';
import lahajatiVoiceService from './LahajatiVoiceService';

/**
 * خدمة الصوت العربي الاحترافي
 * دعم Lahajati AI (108 لهجة) + Google Cloud TTS (Fallback)
 */

class ArabicVoiceService {
    constructor() {
        this.isInitialized = false;
        this.currentLanguage = 'ar-SA'; // For STT
        this.voiceCallbacks = [];
        this.isPlaying = false;
        this.isLiveMode = true; // Default to Live Mode
        this.voiceProvider = 'google'; // 'lahajati' or 'google'
        this.useLahajati = false; // تعطيل لهجاتي مؤقتاً - استخدام Google TTS
    }

    /**
     * القاموس الصوتي لتصحيح النطق
     */
    PRONUNCIATION_MAP = {
        'أ': 'أَلِفْ',
        'ب': 'بَاءْ',
        'ت': 'تَاءْ',
        'ث': 'ثَاءْ',
        'ج': 'جِيمْ',
        'ح': 'حَاءْ',
        'خ': 'خَاءْ',
        'د': 'دَالْ',
        'ذ': 'ذَالْ',
        'ر': 'رَاءْ',
        'ز': 'زَايْ',
        'س': 'سِينْ',
        'ش': 'شِينْ',
        'ص': 'صَادْ',
        'ض': 'ضَادْ',
        'ط': 'طَاءْ',
        'ظ': 'ظَاءْ',
        'ع': 'عَيْنْ',
        'غ': 'غَيْنْ',
        'ف': 'فَاءْ',
        'ق': 'قَافْ',
        'ك': 'كَافْ',
        'ل': 'لَامْ',
        'م': 'مِيمْ',
        'ن': 'نُونْ',
        'هـ': 'هَاءْ',
        'و': 'وَاوْ',
        'ي': 'يَاءْ',
        'ء': 'هَمْزَةْ',
        '1': 'وَاحِدْ',
        '2': 'إِثْنَانْ',
        '3': 'ثَلَاثَةْ',
        '4': 'أَرْبَعَةْ',
        '5': 'خَمْسَةْ',
        'كفك': 'كَفُّكَ'
    };

    /**
     * معالجة النص للنطق السليم (Phonetic Pre-processing)
     * تطبيق "ميثاق التشكيل والنطق السليم"
     */
    /**
     * معالجة النص للنطق السليم (Phonetic Pre-processing)
     * تطبيق "ميثاق التشكيل والنطق السليم"
     * NOTE: Acts as a final safety net AND enforces Pausal Forms (Waqf) on the chunk.
     */
    cleanTextForTTS(text) {
        if (!text) return "";
        let clean = text.trim();

        // 1. Remove Emojis & Symbols (safe to do globally)
        clean = clean.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');

        // 2. Remove Newlines (safe to do globally)
        clean = clean.replace(/\n/g, ' ');

        // 3. SSML-AWARE CLEANING: Protect SSML tags from ALL text processing
        // Split by tags, process only text parts, leave tags untouched
        const parts = clean.split(/(<[^>]+>)/g);

        for (let i = 0; i < parts.length; i++) {
            // Only process non-tag parts (text between tags)
            if (!parts[i].startsWith('<')) {
                let textPart = parts[i];

                // 3.1. HARDCODED CORRECTIONS (Dictionary of Truth) 📖
                textPart = textPart.replace(/نَقْلِدُ/g, 'نُقَلِّدُ'); // Fix common Gemini error
                textPart = textPart.replace(/ت[يِ]ن[يِ]/g, 'تِينِي'); // Tini -> Tiini
                textPart = textPart.replace(/م[َُِ]?ع[َُِ]?ل[َُِِ\u0651]?م[َُِ]?[ةه]/g, 'مُعَلِّمَة'); // Muallima
                textPart = textPart.replace(/نورا/g, 'نُورَا'); // Noura

                // 3.2. REPEATED WORDS SPACER (Prevent "JamalJamal" rush) 🏎️
                // DISABLED: Can cause infinite loop in some cases
                // textPart = textPart.replace(/([^\s]+)\s+\1/g, '$1، $1');

                // 3.3. SMART COMMA INSERTION (For Educational Phonics) 🎓
                textPart = textPart.replace(/(^|\s)([\u0621-\u064A][\u064B-\u065F]*)(?=\s|$)/g, '$1$2،');

                // 3.4. Remove Punctuation (but KEEP COMMAS for pause)
                textPart = textPart.replace(/[!؟.:;()\{\}\[\]_-]/g, ' ');

                // 3.5. Normalize Punctuation for Arabic Cloud TTS
                textPart = textPart.replace(/([.?!])/g, '، ');

                // 3.6. Remove generic commas/semicolons that might cause double-pauses
                textPart = textPart.replace(/[;:]/g, ' ');

                parts[i] = textPart;
            }
            // SSML tags (parts starting with '<') are left completely untouched
        }
        clean = parts.join('');

        // 4. Diacritic Normalization & Cleanup (safe to do globally on final result)
        clean = clean.replace(/[\n\r\t]/g, ' ');
        clean = clean.replace(/\s*[،,]+\s*/g, '، '); // Standardize Arabic comma spacing
        clean = clean.replace(/\s+/g, ' ').trim();

        // 5. Apply Multi-part Pronunciation Map
        // Simplified regex to avoid lookbehind which may crash on some Android JS engines
        Object.entries(this.PRONUNCIATION_MAP).forEach(([key, value]) => {
            // Use a simpler word boundary check
            const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(^|\\s)${escapedKey}($|\\s|،|,)`, 'g');
            clean = clean.replace(regex, `$1${value}$2`);
        });

        // 4. Force Pausal Form (Al-Waqf) at the very end of this chunk 🛑
        // SKIP IF ENDS WITH SSML TAG like </speak> or <break />
        if (clean.endsWith('>')) return clean;

        console.log('🧹 Pre-Waqf:', [clean]);

        clean = clean.replace(/([^\s]+)$/, (lastWord) => {
            // Check last char
            let lastChar = lastWord.slice(-1);

            // EXCEPTION: Single Letters (Educational) -> Preserve Diacritic
            // We use normalization to find the "base" character count
            const baseCharsOnly = lastWord.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');

            // If it's a single letter (or letter + punctuation we missed), keep diacritics
            if (baseCharsOnly.length === 1 || (baseCharsOnly.length === 2 && /[\u0621-\u064A][،,]/.test(baseCharsOnly))) {
                return lastWord;
            }

            // Remove Comma if it got stuck to the end of a normal word
            if (lastChar === '،' || lastChar === ',') {
                lastWord = lastWord.slice(0, -1);
                lastChar = lastWord.slice(-1);
            }

            // Strip trailing diacritics to find the actual last letter for Waqf rules
            let wordWithoutTrailingVowels = lastWord;
            while (/[\u064B-\u065F\u0670]/.test(wordWithoutTrailingVowels.slice(-1)) && wordWithoutTrailingVowels.length > 1) {
                wordWithoutTrailingVowels = wordWithoutTrailingVowels.slice(0, -1);
            }

            const finalBaseChar = wordWithoutTrailingVowels.slice(-1);

            // Case A: Ta-Marbuta (ة) -> Ha (ه) + Sukun
            if (finalBaseChar === 'ة') {
                return wordWithoutTrailingVowels.slice(0, -1) + 'ه' + '\u0652';
            }

            // Case B: Long Vowels (Alif, Waw, Ya) -> Keep as is (Implicit Sukun)
            if (/[اويى]/.test(finalBaseChar)) {
                return lastWord;
            }

            // Case C: Strong Consonant -> Force Sukun
            // Remove current trailing diacritics and add Sukun
            return wordWithoutTrailingVowels + '\u0652';
        });

        console.log('🧹 Cleaned Text (Final VoiceService):', clean);
        return clean;
    }

    /**
     * تهيئة خدمة الصوت
     */
    async initialize() {
        if (this.isInitialized) return;

        console.log('🔄 Initializing ArabicVoiceService...');

        try {
            // Check System TTS Status silently
            Tts.getInitStatus().then(() => {
                Tts.setDefaultLanguage('ar-SA')
                    .then(() => console.log('✅ System TTS: Arabic supported (Fallback Ready)'))
                    .catch(() => console.log('ℹ️ System TTS: Arabic not installed (Google Cloud will be used)'));
                Tts.setDefaultRate(0.5);
            }).catch(() => {
                // Silently ignore system tts init errors as we have Google Cloud
            });

            // Subscribe to finish event
            SoundPlayer.addEventListener('FinishedPlaying', ({ success }) => {
                console.log('✅ SoundPlayer Finished playing:', success);

                // Stop visual IMMEDIATELY
                this.stopVisemeAnimation();

                // RESOLVE IMMEDIATELY for gapless sequential playback
                this.isPlaying = false;
                if (this.currentSpeakResolve) {
                    this.currentSpeakResolve(success);
                    this.currentSpeakResolve = null;
                }
            });

            // Initialize Voice Recognition
            if (Voice) {
                try {
                    await this.configureVoiceRecognition();
                } catch (voiceError) {
                    console.warn('⚠️ Failed to initialize Voice Recognition:', voiceError);
                }
            }

            this.isInitialized = true;
            console.log('✅ Arabic Voice Service fully initialized');
        } catch (error) {
            console.error('❌ Error during voice service initialization:', error);
        }
    }

    /**
     * تكوين التعرف على الصوت
     */
    async configureVoiceRecognition() {
        try {
            Voice.onSpeechStart = () => {
                if (this.isPlaying) {
                    // Echo Cancellation Fix: Don't stop immediately. 
                    // Let the user speak over if they want, but don't cut off on false positives.
                    // this.stop(); 
                    console.log('🎤 Speech detected while playing (Ignored for stability)');
                }
            };
            Voice.onSpeechEnd = () => { };
            Voice.onSpeechError = (e) => console.error('🎤 Speech error:', e);
            Voice.onSpeechResults = (e) => this.onSpeechResults(e);
        } catch (e) {
            console.warn('⚠️ Error configuring Voice:', e);
        }
    }

    async fetchGoogleTTS(text, retryCount = 0, emotion = 'neutral') {
        const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`;
        const ssmlText = text.startsWith('<speak>') ? text : `<speak>${text}</speak>`;

        // Smart Emotion Mapping to Vocal Parameters
        let pitch = 0.0;
        let speakingRate = 1.0;

        switch (emotion?.toLowerCase()) {
            case 'happy':
                pitch = 2.0; // Slightly higher, brighter
                speakingRate = 1.05; // Slightly faster
                break;
            case 'excited':
                pitch = 4.0; // Higher, very energetic
                speakingRate = 1.1;
                break;
            case 'thinking':
            case 'serious':
                pitch = -1.2; // Deeper, more authoritative
                speakingRate = 0.95; // Slightly slower
                break;
            case 'sad':
                pitch = -3.0; // Lower, somber
                speakingRate = 0.85;
                break;
            default:
                pitch = 0.0;
                speakingRate = 1.0;
        }

        const body = {
            input: { ssml: ssmlText },
            voice: {
                languageCode: 'ar-XA',
                name: this.currentVoice || 'ar-XA-Chirp3-HD-Sulafat',
                ssmlGender: 'FEMALE'
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: speakingRate,
                pitch: pitch,
                volumeGainDb: 0.0
            }
        };

        try {
            if (retryCount === 0) {
                console.log('🎭 Vocal Emotion Profile:', {
                    Emotion: emotion,
                    Pitch: pitch,
                    Rate: speakingRate
                });
            }

            // Log for debugging
            if (retryCount === 0) {
                console.log('🚀 Requesting Google TTS (Gapless)...');
                console.log('═══════════════════════════════════════════════════════');
                console.log('🔍 DEEP DEBUG: SSML PAYLOAD TO GOOGLE');
                console.log('═══════════════════════════════════════════════════════');
                console.log(`📤 SSML Text (Raw):`);
                console.log(ssmlText);
                console.log(`\n👁️ SSML Text (Visible):`);
                console.log(ssmlText.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t'));
                console.log(`\n📏 SSML Length: ${ssmlText.length} characters`);
                console.log(`\n🎭 Voice Config:`);
                console.log(`   - Voice Name: ${body.voice.name}`);
                console.log(`   - Speaking Rate: ${body.audioConfig.speakingRate}`);
                console.log(`   - Pitch: ${body.audioConfig.pitch}`);
                console.log(`\n🔢 First 100 char codes:`);
                console.log(ssmlText.substring(0, 100).split('').map(c => c.charCodeAt(0)).join(','));
                console.log('═══════════════════════════════════════════════════════\n');
            }

            const response = await axios.post(url, body, {
                timeout: 5000, // 5 seconds timeout للانتقال السريع للـ Fallback
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Google TTS Success');
            return response.data.audioContent;
        } catch (error) {
            console.error(`⚠️ Network Attempt ${retryCount + 1} Failed:`, error.message);
            if (retryCount < 0) { // تعطيل إعادة المحاولة - الانتقال مباشرة للـ Fallback
                console.log(`🔄 Retrying in 1 second...`);
                await new Promise(r => setTimeout(r, 1000));
                return this.fetchGoogleTTS(text, retryCount + 1, emotion);
            }
            throw error;
        }

    }

    /**
     * نطق نص عربي مع مخارج الحروف - ينتظر انتهاء الصوت
     */
    /**
     * حفظ ملف الصوت مسبقاً (للتحميل المسبق)
     */
    async prepareAudioFile(audioContent) {
        if (!audioContent || audioContent.length < 100) throw new Error('Empty Audio');
        const path = `${RNFS.CachesDirectoryPath}/speech_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.mp3`;
        await RNFS.writeFile(path, audioContent, 'base64');
        return path;
    }

    /**
     * تشغيل ملف صوتي من المسار
     */
    async playAudioFile(path, text, options = {}) {
        const { onVisemeChange = null, onPlayStart = null } = options;

        return new Promise(async (resolve) => {
            let hasResolved = false;

            // Safety: If audio doesn't finish in 60s, kill it
            const safetyTimeout = setTimeout(() => {
                if (!hasResolved) {
                    console.warn('⚠️ Play safety timeout');
                    hasResolved = true;
                    this.isPlaying = false;
                    this.stopVisemeAnimation();
                    resolve(false);
                }
            }, 60000);

            const wrappedResolve = (val) => {
                if (!hasResolved) {
                    clearTimeout(safetyTimeout);
                    hasResolved = true;
                    this.currentSpeakResolve = null;
                    resolve(val);
                }
            };

            try {
                // Determine if we need to stop previous audio? 
                // For gapless, we might assume previous is done if we are called sequentially.
                // But let's be safe.
                await this.stop();
                this.currentSpeakResolve = wrappedResolve;

                if (Platform.OS === 'web') {
                    // Web fallback (still uses base64 usually, but here we might need adjustment if using paths)
                    // For now assuming Android/iOS main target.
                    wrappedResolve(false);
                } else {
                    console.log(`🔊 Playing from: ${path}`);

                    // Verify file exists
                    const exists = await RNFS.exists(path);
                    if (!exists) {
                        console.error('❌ Audio file does not exist at path:', path);
                        wrappedResolve(false);
                        return;
                    }

                    if (onVisemeChange) {
                        this.currentVisemeCallback = onVisemeChange;
                        this.startVisemeAnimation(text);
                    }

                    if (onPlayStart) onPlayStart();

                    SoundPlayer.setVolume(1.0);
                    this.isPlaying = true;
                    SoundPlayer.playUrl('file://' + path);
                }
            } catch (e) {
                console.error("Audio Playback Error:", e);
                wrappedResolve(false);
            }
        });
    }

    /**
     * نطق نص عربي مع مخارج الحروف
     */
    async speak(text, options = {}) {
        const emotion = options.emotion || 'neutral';
        console.log(`🎙️ speak() initiated [Emotion: ${emotion}] for:`, text.substring(0, 40));

        try {
            let processedText = this.cleanTextForTTS(text);
            console.log(`🗣️ Speaking (Phonetic): ${processedText}`);

            // 1. Try Lahajati AI First (Premium Quality)
            if (this.useLahajati) {
                try {
                    console.log('🌟 Attempting Lahajati AI (Premium)...');
                    const audioUrl = await lahajatiVoiceService.textToSpeech(processedText, {
                        voiceId: '1', // صوت أنثوي احترافي
                        dialectId: '1', // اللهجة السعودية
                        performanceId: '1' // أداء طبيعي
                    });

                    if (options.onPlayStart) options.onPlayStart();

                    // تشغيل الصوت من لهجاتي
                    await lahajatiVoiceService.playAudio(audioUrl);

                    console.log('✅ Lahajati AI Success!');
                    return true;
                } catch (lahajatiError) {
                    console.warn('⚠️ Lahajati failed, falling back to Google TTS:', lahajatiError.message);
                    // Continue to Google TTS fallback
                }
            }

            // 2. Google Cloud TTS (Fallback)
            try {
                console.log('🔄 Using Google TTS Fallback...');
                const audioContent = await this.fetchGoogleTTS(processedText, 0, emotion);
                const path = await this.prepareAudioFile(audioContent);
                console.log('🔈 Audio file prepared, attempting playback...');
                return await this.playAudioFile(path, processedText, options);
            } catch (googleError) {
                console.error('❌ Google TTS Path Failed:', googleError.message);
                throw googleError; // Trigger final fallback
            }
        } catch (error) {
            console.error('❌ Critical error in speak():', error);

            // 3. Final Fallback: Native System TTS
            console.log('🔄 Attempting System TTS Fallback...');
            return new Promise(async (resolve) => {
                try {
                    if (options.onPlayStart) options.onPlayStart();

                    Tts.stop();
                    // Extra clean for system TTS: remove diacritics as they can confuse some engines
                    const plainText = text.replace(/<[^>]+>/g, '').replace(/[\u064B-\u065F]/g, '');

                    const finishSub = Tts.addEventListener('tts-finish', () => {
                        console.log('✅ System TTS Finished');
                        finishSub.remove();
                        resolve(true);
                    });

                    const errorSub = Tts.addEventListener('tts-error', (err) => {
                        console.error('❌ System TTS Error Event:', err);
                        errorSub.remove();
                        resolve(false);
                    });

                    Tts.speak(plainText);
                } catch (fallbackError) {
                    console.error('❌ System TTS Exception:', fallbackError);
                    resolve(false);
                }
            });
        }
    }

    startVisemeAnimation(text) {
        const { timeline } = generateVisemeTimeline(text);
        this.currentTimeline = timeline;
        if (!this.currentTimeline || !this.currentVisemeCallback) return;

        let currentIndex = 0;
        const startTime = Date.now();
        const animate = () => {
            if (currentIndex >= this.currentTimeline.length) {
                this.stopVisemeAnimation();
                return;
            }
            const elapsed = Date.now() - startTime;
            while (currentIndex < this.currentTimeline.length && elapsed >= this.currentTimeline[currentIndex].time) {
                const current = this.currentTimeline[currentIndex];
                this.currentVisemeCallback(current.shape, current.path);
                currentIndex++;
            }
            this.visemeAnimationFrame = requestAnimationFrame(animate);
        };
        animate();
    }

    stopVisemeAnimation() {
        if (this.visemeAnimationFrame) {
            cancelAnimationFrame(this.visemeAnimationFrame);
            this.visemeAnimationFrame = null;
        }
        this.currentTimeline = null;
        this.currentVisemeCallback = null;
    }

    /**
     * الاستماع المستمر مع محاولة الحفاظ على الجلسة نشطة قدر الإمكان لتقليل الفجوات
     * نقوم بإعادة تعيين المحرك كل 20 ثانية لضمان عدم تجمد النظام عند الصمت الطويل
     */
    async listen(language = 'ar-SA') {
        // HARD STOP: Never listen if we are currently speaking
        if (this.isPlaying) {
            console.log('⚠️ Listen blocked: Audio is currently playing (Internal Guard)');
            return null;
        }

        return new Promise(async (resolve) => {
            let hasResolved = false;
            const startTime = Date.now();
            const SESSION_TIMEOUT = 20000; // 20 seconds session window

            const setupListeners = () => {
                // Partial Results - Shows what mic hears in real-time
                Voice.onSpeechPartialResults = (e) => {
                    if (e.value && e.value[0]) {
                        console.log('═══════════════════════════════════════════════════════');
                        console.log('🔍 DEEP DEBUG: PARTIAL RESULT (Real-time)');
                        console.log('═══════════════════════════════════════════════════════');
                        console.log(`👂 Partial Result: "${e.value[0]}"`);
                        console.log(`📏 Length: ${e.value[0].length} characters`);
                        console.log(`⏱️ Time since mic start: ${Date.now() - startTime}ms`);
                        console.log('═══════════════════════════════════════════════════════\n');
                    }
                };

                Voice.onSpeechResults = (e) => {
                    if (!hasResolved && e.value && e.value[0]) {
                        console.log('═══════════════════════════════════════════════════════');
                        console.log('🔍 DEEP DEBUG: FINAL RESULT');
                        console.log('═══════════════════════════════════════════════════════');
                        console.log(`🎤 Final Speech recognized: "${e.value[0]}"`);
                        console.log(`📏 Length: ${e.value[0].length} characters`);
                        console.log(`⏱️ Total session time: ${Date.now() - startTime}ms`);
                        console.log('═══════════════════════════════════════════════════════\n');
                        hasResolved = true;
                        cleanup().then(() => resolve(e.value[0]));
                    }
                };

                Voice.onSpeechError = (e) => {
                    console.log('🎤 Voice Internal Error:', e);

                    const elapsed = Date.now() - startTime;
                    if (!hasResolved && elapsed < SESSION_TIMEOUT) {
                        // Slower retry on actual errors (like network code 2) 
                        // to give the system time to breathe. Silence (code 7) can retry fast.
                        const waitTime = (e.error?.code === '7') ? 200 : 2000;
                        setTimeout(startVoice, waitTime);
                    } else if (!hasResolved) {
                        hasResolved = true;
                        cleanup().then(() => resolve(null));
                    }
                };
            };

            const startVoice = async () => {
                if (hasResolved) return;
                try {
                    const micStartTime = Date.now();
                    console.log('═══════════════════════════════════════════════════════');
                    console.log('🔍 DEEP DEBUG: MICROPHONE START');
                    console.log('═══════════════════════════════════════════════════════');
                    console.log(`🎤 Mic Trigger Time: ${new Date(micStartTime).toISOString()}`);

                    await Voice.stop().catch(() => { });
                    setupListeners();
                    await Voice.start(language);

                    const micReadyTime = Date.now();
                    const latency = micReadyTime - micStartTime;
                    console.log(`✅ Mic Status: Fully Ready`);
                    console.log(`⏱️ Time since trigger: ${latency}ms`);
                    console.log(`⚠️ Latency Warning: ${latency > 300 ? '❌ HIGH (>300ms)' : '✅ ACCEPTABLE'}`);
                    console.log('═══════════════════════════════════════════════════════\n');
                } catch (err) {
                    console.log('🎤 Voice Start Exception:', err);
                    if (!hasResolved) {
                        const elapsed = Date.now() - startTime;
                        if (elapsed < SESSION_TIMEOUT) {
                            await Voice.destroy().catch(() => { });
                            setTimeout(startVoice, 500);
                        } else {
                            hasResolved = true;
                            resolve(null);
                        }
                    }
                }
            };

            const cleanup = async () => {
                try {
                    await Voice.stop().catch(() => { });
                    await Voice.destroy().catch(() => { });
                    Voice.removeAllListeners();
                } catch (e) { }
            };

            // Initial session start
            startVoice();

            // Safety timeout
            setTimeout(() => {
                if (!hasResolved) {
                    console.log('🎤 Session window auto-reset (Silence)');
                    hasResolved = true;
                    cleanup().then(() => resolve(null));
                }
            }, SESSION_TIMEOUT + 200);
        });
    }


    async stop() {
        try {
            this.isPlaying = false;
            SoundPlayer.stop();
        } catch (e) { }
        this.stopVisemeAnimation();
        if (this.currentSpeakResolve) {
            this.currentSpeakResolve(false);
            this.currentSpeakResolve = null;
        }
    }

    async cancel() {
        try {
            await Voice.cancel();
            this.isPlaying = false;
        } catch (e) { }
    }

    async setLanguage(language) { this.currentLanguage = language; }
    onSpeechStart() { this.voiceCallbacks.forEach(cb => cb.onStart && cb.onStart()); }
    onSpeechFinish() { this.stopVisemeAnimation(); this.voiceCallbacks.forEach(cb => cb.onFinish && cb.onFinish()); }
    onSpeechCancel() { this.stopVisemeAnimation(); this.voiceCallbacks.forEach(cb => cb.onCancel && cb.onCancel()); }
    onSpeechProgress(event) { this.voiceCallbacks.forEach(cb => cb.onProgress && cb.onProgress(event)); }
    onSpeechResults(event) { this.voiceCallbacks.forEach(cb => cb.onResults && cb.onResults(event)); }
    addListener(callback) { this.voiceCallbacks.push(callback); }
    removeListener(callback) {
        const index = this.voiceCallbacks.indexOf(callback);
        if (index > -1) this.voiceCallbacks.splice(index, 1);
    }
}

const arabicVoiceService = new ArabicVoiceService();
export default arabicVoiceService;
