/**
 * 🎵 Simple Game Audio Service
 * Provides basic audio feedback using TTS for musical tones
 */

import Tts from 'react-native-tts';

class SimpleGameAudio {
    constructor() {
        this.isEnabled = true;
        this.isMuted = false;
    }

    /**
     * Initialize TTS for audio
     */
    async init() {
        try {
            await Tts.setDefaultLanguage('en-US');
            await Tts.setDefaultRate(0.5);
            await Tts.setDefaultPitch(1.5);
        } catch (error) {
            console.log('🔇 TTS Audio init failed:', error);
        }
    }

    /**
     * Play a success sound (high pitch beep)
     */
    playSuccess() {
        if (!this.isEnabled || this.isMuted) return;
        
        try {
            // Play a pleasant "ding" using TTS
            Tts.speak('♪', {
                androidParams: {
                    KEY_PARAM_PAN: 0,
                    KEY_PARAM_VOLUME: 0.3,
                    KEY_PARAM_STREAM: 'STREAM_MUSIC',
                }
            });
        } catch (error) {
            console.log('🔇 Success sound failed');
        }
    }

    /**
     * Play an error sound
     */
    playError() {
        if (!this.isEnabled || this.isMuted) return;
        
        try {
            Tts.speak('✗', {
                androidParams: {
                    KEY_PARAM_PAN: 0,
                    KEY_PARAM_VOLUME: 0.2,
                    KEY_PARAM_STREAM: 'STREAM_MUSIC',
                }
            });
        } catch (error) {
            console.log('🔇 Error sound failed');
        }
    }

    /**
     * Mute/Unmute
     */
    setMuted(muted) {
        this.isMuted = muted;
    }

    /**
     * Stop all sounds
     */
    stop() {
        try {
            Tts.stop();
        } catch (error) {
            console.log('🔇 Could not stop audio');
        }
    }
}

export default new SimpleGameAudio();
