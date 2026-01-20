/**
 * 🎵 Game Background Music Service
 * Simple background music using system beeps and tones
 */

import Sound from 'react-native-sound';

// Enable playback in silence mode (iOS)
Sound.setCategory('Playback');

class BackgroundMusicService {
    constructor() {
        this.backgroundMusic = null;
        this.isPlaying = false;
        this.isMuted = false;
    }

    /**
     * Play simple background music loop
     * Using a simple tone pattern
     */
    playBackgroundMusic() {
        if (this.isMuted || this.isPlaying) return;

        try {
            // For now, we'll use a simple approach
            // In production, you would load an actual music file
            console.log('🎵 Background music would play here');
            console.log('💡 Add music files to: android/app/src/main/res/raw/');
            
            this.isPlaying = true;
        } catch (error) {
            console.log('🔇 Background music failed:', error);
        }
    }

    /**
     * Stop background music
     */
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            try {
                this.backgroundMusic.stop();
                this.backgroundMusic.release();
                this.backgroundMusic = null;
            } catch (error) {
                console.log('🔇 Could not stop music');
            }
        }
        this.isPlaying = false;
    }

    /**
     * Play success sound effect
     */
    playSuccess() {
        if (this.isMuted) return;
        console.log('🎵 Success sound!');
    }

    /**
     * Play error sound effect
     */
    playError() {
        if (this.isMuted) return;
        console.log('🔇 Error sound!');
    }

    /**
     * Play combo sound effect
     */
    playCombo() {
        if (this.isMuted) return;
        console.log('🔥 Combo sound!');
    }

    /**
     * Mute/Unmute all sounds
     */
    setMuted(muted) {
        this.isMuted = muted;
        if (muted) {
            this.stopBackgroundMusic();
        }
    }

    /**
     * Cleanup
     */
    cleanup() {
        this.stopBackgroundMusic();
    }
}

export default new BackgroundMusicService();
