import SoundPlayer from 'react-native-sound-player';
import Sound from 'react-native-sound';

// Enable mixing globally just in case
Sound.setCategory('Playback', true);

class GameAudioService {
    constructor() {
        this.isPlaying = false;
        this.isMuted = false;
        this.isVibrationEnabled = false; // 📳 Default OFF as requested
        this.isInitialized = false;
        
        // Pre-load SFX for better performance
        this.successSound = null;
        this.errorSound = null;
        this.popSound = null;
        this.comboSound = null;
        this.victorySound = null;
        this.defeatSound = null;
        this.warningSound = null;

        // Note: initSFX will be called by init() or on first use to ensure context is ready
    }

    initSFX() {
        if (this.successSound) return; // Already init
        
        console.log('🔊 Pre-loading SFX...');
        this.successSound = this.loadSound('success');
        this.errorSound = this.loadSound('error');
        this.popSound = this.loadSound('pop');
        this.comboSound = this.loadSound('combo');
        this.victorySound = this.loadSound('victory');
        this.defeatSound = this.loadSound('defeat');
        this.warningSound = this.loadSound('warning');
    }

    loadSound(name) {
        // Android: raw resource name only (no extension)
        return new Sound(name, Sound.MAIN_BUNDLE, (error) => {
            if (error) console.log(`Failed to load ${name}:`, error);
        });
    }

    toggleVibration() {
        this.isVibrationEnabled = !this.isVibrationEnabled;
        console.log('📳 Vibration:', this.isVibrationEnabled ? 'ON' : 'OFF');
        return this.isVibrationEnabled;
    }

    toggleMusic() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopBackgroundMusic();
        } else {
            this.playBackgroundMusic();
        }
        return this.isMuted;
    }

    /**
     * Initialize audio service
     */
    init() {
        if (this.isInitialized) return;
        console.log('🎵 Game Audio Service Initialized (Mixed Mode)');
        this.initSFX();
        this.isInitialized = true;
    }

    /**
     * Play background music (looping)
     * Still uses SoundPlayer for background stream
     */
    playBackgroundMusic() {
        if (this.isMuted || this.isPlaying) return;
        
        try {
            console.log('🎵 Starting Game Music (SoundPlayer)...');
            SoundPlayer.playSoundFile('game_music', 'wav');
            this.isPlaying = true;
            
            // Re-loop listener
            if (this.finishedListener) {
                try { this.finishedListener.remove(); } catch(e){}
            }
            
            this.finishedListener = SoundPlayer.addEventListener('FinishedPlaying', ({ success }) => {
                 if (success && this.isPlaying && !this.isMuted) {
                     SoundPlayer.playSoundFile('game_music', 'wav');
                 }
            });

        } catch (error) {
            console.log('🔇 Game music failed:', error);
        }
    }

    /**
     * Stop background music
     */
    stopBackgroundMusic() {
        try {
            SoundPlayer.stop();
            this.isPlaying = false;
            console.log('🔇 Game music stopped');
        } catch (error) {
            console.log('🔇 Could not stop music');
        }
    }

    /**
     * Helper to play RNSound instance safely
     */
    playSFX(soundInstance) {
        if (this.isMuted || !soundInstance) return;
        
        if (soundInstance.isLoaded()) {
            soundInstance.setCurrentTime(0);
            soundInstance.setVolume(1.0);
            soundInstance.play((success) => {
                if (!success) soundInstance.reset();
            });
        } else {
            // Self-healing attempt if not loaded?!
            // For now, just log. Next frame it might be ready.
            console.log('⚠️ SFX not ready yet');
        }
    }

    /**
     * Play success sound
     */
    playSuccess() {
        if (!this.successSound) this.successSound = this.loadSound('success');
        this.playSFX(this.successSound);
    }

    /**
     * Play error sound
     */
    playError() {
        if (!this.errorSound) this.errorSound = this.loadSound('error');
        this.playSFX(this.errorSound);
    }
    
    /**
     * Play pop sound
     */
    playPop() {
        if (!this.popSound) this.popSound = this.loadSound('pop');
        this.playSFX(this.popSound);
    }

    /**
     * Play combo sound
     */
    playCombo(comboLevel) {
        if (!this.comboSound) this.comboSound = this.loadSound('combo');
        this.playSFX(this.comboSound);
        console.log(`🔥 Combo x${comboLevel} sound`);
    }

    /**
     * Play victory sound
     */
    playVictory(stars) {
        if (!this.victorySound) this.victorySound = this.loadSound('victory');
        this.playSFX(this.victorySound);
    }

    /**
     * Play defeat sound
     */
    playDefeat() {
        if (!this.defeatSound) this.defeatSound = this.loadSound('defeat');
        this.playSFX(this.defeatSound);
    }

    /**
     * Play warning sound
     */
    playWarning() {
        if (!this.warningSound) this.warningSound = this.loadSound('warning');
        this.playSFX(this.warningSound);
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

    cleanup() {
        this.stopBackgroundMusic();
        const sounds = [this.successSound, this.errorSound, this.popSound, this.comboSound, this.victorySound, this.defeatSound, this.warningSound];
        sounds.forEach(s => { if(s) s.release(); });
    }
}

export default new GameAudioService();
