import SoundPlayer from 'react-native-sound-player';
import Sound from 'react-native-sound';

// Enable playback in silence mode AND mix with others
Sound.setCategory('Playback', true);

class GlobalAudioService {
    constructor() {
        this.isBackgroundMusicPlaying = false;
        
        // Settings
        this.isMuted = false; // Master mute (affects everything logic, mostly music)
        this.volume = 1.0; // Master volume (0.0 - 1.0)
        this.isSfxEnabled = true; // Toggle for click/interaction sounds
        
        // No persistent click sound instance needed for one-shot strategy,
        // but we can keep a placeholder if needed for logic consistency.
        this.clickSound = null;
    }

    /**
     * Set Master Volume (0.0 to 1.0)
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        console.log(`🔊 Volume set to: ${this.volume}`);
        
        // Update Music Player Volume immediately
        try {
            SoundPlayer.setVolume(this.volume);
        } catch (e) { console.log('Error setting music volume', e); }
    }

    /**
     * Toggle Sound Effects (Clicks)
     */
    toggleSfx() {
        this.isSfxEnabled = !this.isSfxEnabled;
        console.log(`👆 SFX Enabled: ${this.isSfxEnabled}`);
        return this.isSfxEnabled;
    }

    /**
     * Only toggle Background Music
     */
    toggleMusic() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopAppBackgroundMusic();
        } else {
            this.playAppBackgroundMusic();
        }
        return this.isMuted;
    }

    /**
     * Play app background music
     */
    playAppBackgroundMusic() {
        if (this.isMuted || this.isBackgroundMusicPlaying) return;
        
        try {
            SoundPlayer.playSoundFile('app_music', 'mp3');
            SoundPlayer.setVolume(this.volume); // Apply current volume
            this.isBackgroundMusicPlaying = true;
            console.log('🎵 App background music started');
            
            if (this.finishedListener) {
                try { this.finishedListener.remove(); } catch(e){}
            }

            this.finishedListener = SoundPlayer.addEventListener('FinishedPlaying', ({ success }) => {
                if (success && this.isBackgroundMusicPlaying && !this.isMuted) {
                    SoundPlayer.playSoundFile('app_music', 'mp3');
                    SoundPlayer.setVolume(this.volume);
                }
            });
        } catch (error) {
            console.log('🔇 App background music failed:', error);
        }
    }

    stopAppBackgroundMusic() {
        try {
            SoundPlayer.stop();
            this.isBackgroundMusicPlaying = false;
            console.log('🔇 App background music stopped');
        } catch (error) {
            console.log('🔇 Could not stop music');
        }
    }

    playClickSound() {
        // Check Master Mute AND SFX Toggle
        if (this.isMuted) return; 
        if (!this.isSfxEnabled) return;

        // console.log('⚡ Creating fresh click instance...'); // Reduced logs
        // Strategy: Create -> Play -> Destroy
        const oneShotSound = new Sound('click', Sound.MAIN_BUNDLE, (error) => {
            if (error) {
                console.log('❌ Failed to load one-shot sound:', error);
                return;
            }
            // Ready to play - WITH VOLUME
            oneShotSound.setVolume(this.volume);
            
            oneShotSound.play((success) => {
                if (!success) {
                    console.log('❌ Fresh Playback FAILED');
                }
                // Cleanup immediately
                oneShotSound.release();
            });
        });
    }

    setMuted(muted) {
        this.isMuted = muted;
        if (muted) {
            this.stopAppBackgroundMusic();
        }
    }

    cleanup() {
        this.stopAppBackgroundMusic();
    }
}

export default new GlobalAudioService();
