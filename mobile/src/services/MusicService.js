import SoundPlayer from 'react-native-sound-player';

class MusicService {
    constructor() {
        this.isPlaying = false;
        this.volume = 0.1; // Low volume by default (10%)
    }

    playBackgroundMusic() {
        console.log('🎵 MusicService.playBackgroundMusic() called - Redirected to BackgroundMusic component');
        return;
        /* Legacy logic disabled to prevent SoundPlayer singleton conflicts
        try {
            // Play looped
            SoundPlayer.playSoundFile('classroom_music', 'mp3');
            // SoundPlayer doesn't support loop natively easily without listener, 
            // but let's try volume first.
            // DELAY IS CRITICAL: Some devices won't set volume until playback starts
            setTimeout(() => {
                SoundPlayer.setVolume(this.volume);
                console.log(`🎵 Music Volume set to ${this.volume}`);
            }, 500);
            this.isPlaying = true;

            // Replay when finished loop
            SoundPlayer.addEventListener('FinishedPlaying', ({ success }) => {
                if (success && this.isPlaying) {
                    SoundPlayer.playSoundFile('classroom_music', 'mp3');
                    // Ensure volume persists
                    setTimeout(() => SoundPlayer.setVolume(this.volume), 100);
                }
            });

        } catch (e) {
            console.log('Cannot play background music', e);
        }
        */
    }

    stopBackgroundMusic() {
        try {
            this.isPlaying = false;
            SoundPlayer.stop();
        } catch (e) { }
    }

    setVolume(vol) {
        this.volume = vol;
        try {
            SoundPlayer.setVolume(vol);
        } catch (e) { }
    }
}

export const musicService = new MusicService();
