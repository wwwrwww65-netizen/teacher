import Tts from 'react-native-tts';
import Voice from '@react-native-voice/voice';
import { Platform } from 'react-native';
import axios from 'axios';
import RNFS from 'react-native-fs';
import SoundPlayer from 'react-native-sound-player';
import { generateVisemeTimeline } from '../utils/arabicVisemes';
import { GOOGLE_API_KEY } from '../config/constants';

class ArabicVoiceService {
    constructor() {
        this.isInitialized = false;
        this.voiceCallbacks = [];
        this.isPlaying = false;
        this.isLiveMode = true;
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
            this.isInitialized = true;
        } catch (error) {
            console.error('❌ Error initializing voice service:', error);
        }
    }

    async fetchGoogleTTS(text, retryCount = 0) {
        const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`;
        const ssmlText = text.startsWith('<speak>') ? text : `<speak>${text}</speak>`;
        const body = {
            input: { ssml: ssmlText },
            voice: { languageCode: 'ar-XA', name: 'ar-XA-Chirp3-HD-Sulafat', ssmlGender: 'FEMALE' },
            audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0, pitch: 0.0, volumeGainDb: 0.0 }
        };
        try {
            const response = await axios.post(url, body, { timeout: 15000 });
            return response.data.audioContent;
        } catch (error) {
            if (retryCount < 2) return this.fetchGoogleTTS(text, retryCount + 1);
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
        await this.initialize();
        try {
            const audioContent = await this.fetchGoogleTTS(text);
            console.log('📊 [TTS-DEBUG] Audio Size:', audioContent?.length);
            const path = await this.prepareAudioFile(audioContent);
            return await this.playAudioFile(path, text, options);
        } catch (error) {
            console.log('🎤 [TTS] Fallback to System TTS');
            Tts.speak(text.replace(/<[^>]+>/g, ''));
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
