import SoundPlayer from 'react-native-sound-player';

class MusicService {
    constructor() {
        this.isPlaying = false;
        this.volume = 0.1; // Low volume by default (10%)
    }

    playBackgroundMusic() {
        console.log('🎵 MusicService.playBackgroundMusic() called - Redirected to BackgroundMusic component');
        return;
    }

    stopBackgroundMusic() {
        try {
            this.isPlaying = false;
            SoundPlayer.stop();
        } catch (err) {
            console.log('Error stopping background music:', err);
        }
    }

    setVolume(vol) {
        this.volume = vol;
        try {
            SoundPlayer.setVolume(vol);
        } catch (err) {
            console.log('Error setting music volume:', err);
        }
    }
}

export const musicService = new MusicService();
