
// Voice Recognition Helper (Web)
let recognition = null;

const startWebVoice = (callbacks) => {
    if (!('webkitSpeechRecognition' in window)) {
        console.warn("Speech recognition not supported on this browser");
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        try {
            recognition = new window.webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'ar-SA'; // Default to Arabic

            recognition.onstart = () => {
                console.log("Web Voice: Started");
                if (callbacks.onSpeechStart) callbacks.onSpeechStart();
            };

            recognition.onend = () => {
                console.log("Web Voice: Ended");
                if (callbacks.onSpeechEnd) callbacks.onSpeechEnd();
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log("Web Voice Result:", transcript);
                if (callbacks.onSpeechResults) {
                    // React Native Voice expects an object with value array
                    callbacks.onSpeechResults({ value: [transcript] });
                }
            };

            recognition.onerror = (e) => {
                console.error("Web Voice Error:", e);
                // if (callbacks.onSpeechError) callbacks.onSpeechError(e);
            };

            recognition.start();
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};

const stopWebVoice = () => {
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
    return Promise.resolve();
};

// TTS Helper (Web)
const speakWeb = (text) => {
    return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA'; // Arabic
        utterance.onend = () => {
            resolve();
        };
        window.speechSynthesis.speak(utterance);
    });
};


const MockNative = {
    // Sound Player
    playSoundFile: () => console.log('Mock: PlaySoundFile'),
    addEventListener: () => ({ remove: () => { } }),
    loadSoundFile: () => { },
    play: () => console.log('Mock: Play'),

    // Voice (Stateful for callbacks)
    _voiceListeners: {},
    onSpeechStart(e) { },
    onSpeechEnd(e) { },
    onSpeechResults(e) { },

    start: (locale) => {
        // In RN-Voice, users attach listeners directly to the module or use hooks.
        // We simulate the module behavior by calling the methods attached to the default export if any.
        // But normally usage is Voice.onSpeechStart = fn.
        return startWebVoice({
            onSpeechStart: MockNative.onSpeechStart,
            onSpeechEnd: MockNative.onSpeechEnd,
            onSpeechResults: MockNative.onSpeechResults
        });
    },
    stop: () => stopWebVoice(),
    destroy: () => stopWebVoice(),
    removeAllListeners: () => { },

    // FS
    DocumentDirectoryPath: '/tmp',
    writeFile: () => Promise.resolve(),
    readFile: () => Promise.resolve(''),
    unlink: () => Promise.resolve(),
    exists: () => Promise.resolve(false),

    // Image Picker
    launchCamera: () => Promise.resolve({ didCancel: true }),
    launchImageLibrary: () => Promise.resolve({ didCancel: true }),

    // AsyncStorage
    getItem: (key) => Promise.resolve(localStorage.getItem(key)),
    setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
    removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
    clear: () => Promise.resolve(localStorage.clear()),
    getAllKeys: () => Promise.resolve(Object.keys(localStorage)),

    // Tts
    getInitStatus: () => Promise.resolve(),
    speak: (text) => {
        console.log('Mock: Tts Speak:', text);
        speakWeb(text);
        return Promise.resolve();
    },
    stop: () => {
        window.speechSynthesis.cancel();
        return Promise.resolve();
    },
    setDefaultLanguage: () => Promise.resolve(),
    setDefaultRate: () => Promise.resolve(),
    setDefaultPitch: () => Promise.resolve(),
    addEventListener: () => ({ remove: () => { } }),
};

// Default export
export default MockNative;

// Named exports
export const launchCamera = MockNative.launchCamera;
export const launchImageLibrary = MockNative.launchImageLibrary;
export const DocumentDirectoryPath = MockNative.DocumentDirectoryPath;
export const writeFile = MockNative.writeFile;
export const readFile = MockNative.readFile;
export const unlink = MockNative.unlink;
export const exists = MockNative.exists;
export const Tts = MockNative;
