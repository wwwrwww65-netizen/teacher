import axios from 'axios';
import RNFS from 'react-native-fs';
import SoundPlayer from 'react-native-sound-player';
import { LAHAJATI_API_KEY } from '../config/constants';

/**
 * خدمة لهجاتي - أصوات عربية احترافية بـ 108 لهجة
 * Lahajati AI Voice Service
 */
class LahajatiVoiceService {
    constructor() {
        this.apiKey = LAHAJATI_API_KEY;
        this.baseUrl = 'https://api.lahajati.ai/v1';
        this.isPlaying = false;
    }

    /**
     * تحويل النص إلى صوت باستخدام لهجاتي
     * @param {string} text - النص العربي
     * @param {object} options - خيارات الصوت
     * @returns {Promise<string>} - مسار الملف الصوتي
     */
    async textToSpeech(text, options = {}) {
        try {
            const {
                voiceId = '1', // معرف الصوت (يجب الحصول عليه من قائمة الأصوات)
                dialectId = '1', // معرف اللهجة السعودية
                performanceId = '1', // نمط الأداء
                speed = 1.0,
                pitch = 0,
                emotion = 'neutral'
            } = options;

            console.log('🎤 Lahajati TTS Request:', {
                text: text.substring(0, 50) + '...',
                voiceId,
                dialectId
            });

            // استخدام الـ endpoint الصحيح من التوثيق الرسمي
            const response = await axios.post(
                'https://lahajati.ai/api/v1/text-to-speech-absolute-control',
                {
                    text: text,
                    id_voice: voiceId,
                    input_mode: 0, // Structured mode
                    performance_id: performanceId,
                    dialect_id: dialectId
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 30000
                }
            );

            if (response.data && response.data.audio_url) {
                console.log('✅ Lahajati TTS Success');
                return response.data.audio_url;
            } else if (response.data && response.data.audio_base64) {
                // إذا كان الرد base64، نحوله لملف
                const audioPath = await this.saveBase64Audio(response.data.audio_base64);
                return audioPath;
            } else if (response.data && response.data.url) {
                // بعض الـ APIs ترجع 'url' بدلاً من 'audio_url'
                console.log('✅ Lahajati TTS Success (url field)');
                return response.data.url;
            } else {
                console.error('Invalid Lahajati response:', response.data);
                throw new Error('Invalid response from Lahajati API');
            }
        } catch (error) {
            console.error('❌ Lahajati TTS Error:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * حفظ الصوت من base64 إلى ملف
     */
    async saveBase64Audio(base64Audio) {
        const timestamp = Date.now();
        const audioPath = `${RNFS.CachesDirectoryPath}/lahajati_${timestamp}.mp3`;

        await RNFS.writeFile(audioPath, base64Audio, 'base64');
        console.log('💾 Lahajati audio saved:', audioPath);

        return audioPath;
    }

    /**
     * تشغيل الصوت
     */
    async playAudio(audioUrl) {
        try {
            this.isPlaying = true;

            if (audioUrl.startsWith('http')) {
                // تشغيل من URL مباشرة
                await SoundPlayer.playUrl(audioUrl);
            } else {
                // تشغيل من ملف محلي
                await SoundPlayer.playSoundFile(audioUrl.replace('file://', ''), 'mp3');
            }

            return new Promise((resolve) => {
                SoundPlayer.addEventListener('FinishedPlaying', () => {
                    this.isPlaying = false;
                    SoundPlayer.removeEventListener('FinishedPlaying');
                    resolve();
                });
            });
        } catch (error) {
            this.isPlaying = false;
            console.error('❌ Lahajati Playback Error:', error);
            throw error;
        }
    }

    /**
     * إيقاف التشغيل
     */
    async stop() {
        try {
            if (this.isPlaying) {
                await SoundPlayer.stop();
                this.isPlaying = false;
            }
        } catch (error) {
            console.error('Error stopping Lahajati audio:', error);
        }
    }

    /**
     * الحصول على قائمة الأصوات المتاحة
     */
    async getAvailableVoices() {
        try {
            const response = await axios.get(`${this.baseUrl}/voices`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            return response.data.voices || [];
        } catch (error) {
            console.error('Error fetching voices:', error);
            return [];
        }
    }

    /**
     * الحصول على اللهجات المتاحة
     */
    async getAvailableDialects() {
        try {
            const response = await axios.get(`${this.baseUrl}/dialects`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            return response.data.dialects || [];
        } catch (error) {
            console.error('Error fetching dialects:', error);
            return [];
        }
    }
}

// تصدير نسخة واحدة من الخدمة
const lahajatiVoiceService = new LahajatiVoiceService();
export default lahajatiVoiceService;
