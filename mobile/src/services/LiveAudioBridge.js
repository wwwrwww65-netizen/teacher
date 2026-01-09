export const LIVE_AUDIO_HTML = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { background: #000; color: #0f0; font-family: monospace; font-size: 16px; padding: 10px; }
        #log { white-space: pre-wrap; word-break: break-all; }
    </style>
</head>
<body>
    <div id="status">🔴 OFFLINE</div>
    <button id="authBtn" style="width:100%; height:200px; opacity:0; position:absolute; top:0; left:0;" onclick="activate()">ACTIVATE</button>
    <div id="log"></div>

    <script>
        const logEl = document.getElementById('log');
        const statusEl = document.getElementById('status');
        
        function log(msg) {
            console.log(msg);
            logEl.textContent = msg + "\\n" + logEl.textContent.substring(0, 500);
        }

        let audioCtx = null;
        let nextStartTime = 0;

        function activate() {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
                log("CTX Created: " + audioCtx.state);
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume().then(() => {
                    log("CTX Resumed: " + audioCtx.state);
                    statusEl.innerText = "🟢 ONLINE";
                });
            } else {
                statusEl.innerText = "🟢 ONLINE";
            }
            // Reset scheduling for new stream
            nextStartTime = 0;
        }

        // Auto-activate on load
        window.addEventListener('load', () => setTimeout(activate, 500));
        document.addEventListener('click', activate);

        function playPCM(base64) {
            console.log('🔊 playPCM called');
            if (!audioCtx) activate();
            if (audioCtx.state === 'suspended') {
                audioCtx.resume().then(() => console.log('🔊 AudioContext resumed'));
            }
            if (!base64) return;

            try {
                // Decode Base64 to Binary String
                const binary = atob(base64);
                const len = binary.length;
                
                // Convert to Int16 (PCM 16-bit)
                const bytes = new Int16Array(len / 2);
                for (let i = 0; i < len; i += 2) {
                    // Little Endian: Low byte first
                    const low = binary.charCodeAt(i);
                    const high = binary.charCodeAt(i + 1);
                    bytes[i / 2] = (high << 8) | low;
                }

                // Convert to Float32 for Web Audio API
                const float32 = new Float32Array(bytes.length);
                for (let i = 0; i < bytes.length; i++) {
                    // Normalize -32768..32767 to -1.0..1.0, BOOST VOLUME x3
                    float32[i] = (bytes[i] / 32768.0) * 3.0;
                }

                // Schedule Playback
                const buffer = audioCtx.createBuffer(1, float32.length, 24000);
                buffer.copyToChannel(float32, 0);

                const source = audioCtx.createBufferSource();
                source.buffer = buffer;
                source.connect(audioCtx.destination);

                const now = audioCtx.currentTime;
                // Ensure continuity
                if (nextStartTime < now) nextStartTime = now;
                
                source.start(nextStartTime);
                nextStartTime += buffer.duration;
                console.log('🔊 Audio chunk scheduled, duration:', buffer.duration);
                statusEl.innerText = "🔊 PLAYING";
            } catch (e) {
                console.log('ERR: ' + e.message);
            }
        }

        // Listen for messages from React Native
        document.addEventListener('message', handleMessage);
        window.addEventListener('message', handleMessage);
        
        function handleMessage(event) {
            try {
                const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                log('MSG: ' + msg.type);
                if (msg.type === 'audio') {
                    // Force activate on first audio
                    if (!audioCtx) {
                        activate();
                        log('Forced activate on first audio');
                    }
                    if (audioCtx && audioCtx.state === 'suspended') {
                        audioCtx.resume();
                        log('Resumed suspended context');
                    }
                    playPCM(msg.data);
                }
            } catch (e) {
                log('ERR: ' + e.message);
            }
        }
        
        // Auto-activate immediately
        activate();
        log('Script loaded, activate called');
    </script>
</body>
</html>
`;
