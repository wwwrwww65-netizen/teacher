// Test new setup with voice config
const WebSocket = require('ws');

const API_KEY = 'AIzaSyDg93OejWfAfCC-_JLQH9cqQtIlsGQhFDM';
const WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

console.log('🧪 Testing voice config...\n');

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
    console.log('✅ Connected');

    // Test with speech_config
    const setup = {
        setup: {
            model: "models/gemini-2.0-flash-exp",
            generation_config: {
                response_modalities: ["AUDIO", "TEXT"],
                speech_config: {
                    voice_config: {
                        prebuilt_voice_config: {
                            voice_name: "Aoede"
                        }
                    }
                }
            }
        }
    };

    console.log('📤 Sending setup with speech_config...');
    ws.send(JSON.stringify(setup));
});

ws.on('message', (data) => {
    const r = JSON.parse(data.toString());
    console.log('📥 Keys:', Object.keys(r).join(', '));
    if (r.setupComplete) console.log('✅ SETUP OK!');
    if (r.error) console.log('❌ Error:', JSON.stringify(r.error));
});

ws.on('close', (code) => console.log('🔌 Closed:', code));
ws.on('error', (e) => console.log('❌ Error:', e.message));

setTimeout(() => ws.close(), 5000);
