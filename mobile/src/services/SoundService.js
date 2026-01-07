import SoundPlayer from 'react-native-sound-player';

/**
 * SoundService
 * Manages UI sound effects (pop, click, success).
 * 
 * NOTE: This assumes sound files exist in the bundle. 
 * Since we don't have them yet, we will wrap calls in try-catch
 * effectively being "silent" until files are added, or we can use 
 * system sounds if available (limited in RN).
 */

class SoundService {
    constructor() {
        this.enabled = true;
    }

    play(soundName) {
        if (!this.enabled) return;

        try {
            // Mapping friendly names to potential file names
            // 'pop' -> 'pop.mp3'
            // 'success' -> 'success.mp3'
            SoundPlayer.playSoundFile(soundName, 'mp3');
        } catch (e) {
            console.log(`[SoundService] Functionality stubbed. Would play: ${soundName}`);
        }
    }

    playPop() {
        this.play('pop');
    }

    playClick() {
        this.play('click');
    }

    playSuccess() {
        this.play('success');
    }

    playWrong() {
        this.play('wrong');
    }

    playFailure() {
        this.play('wrong');
    }
}

export const soundService = new SoundService();
