// Test WebSocket with VALID API Key
const WebSocket = require('ws');

const API_KEY = 'AIzaSyDg93OejWfAfCC-_JLQH9cqQtIlsGQhFDM'; // From constants.js
const WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

console.log('🧪 Testing WebSocket with VALID API Key...\n');

const ws = new WebSocket(WS_URL);
let audioChunks = 0;

ws.on('open', () => {
    console.log('✅ Connected');

    const setup = {
        setup: {
            model: "models/gemini-2.0-flash-exp",
            generation_config: {
                response_modalities: ["AUDIO"]
            },
            system_instruction: {
                parts: [{ text: "أنت معلمة عربية اسمها نورا. قولي مرحبا بصوتك." }]
            }
        }
    };

    console.log('📤 Sending setup...');
    ws.send(JSON.stringify(setup));
});

ws.on('message', (data) => {
    try {
        const response = JSON.parse(data.toString());
        console.log('📥 Message keys:', Object.keys(response).join(', '));

        if (response.setupComplete) {
            console.log('✅ SETUP CONFIRMED!');

            // Send text message
            setTimeout(() => {
                const msg = {
                    client_content: {
                        turns: [{
                            role: "user",
                            parts: [{ text: "مرحبا يا معلمة" }]
                        }],
                        turn_complete: true
                    }
                };
                console.log('📤 Sending user message...');
                ws.send(JSON.stringify(msg));
            }, 500);
        }

        const sc = response.serverContent || response.server_content;
        if (sc) {
            const mt = sc.modelTurn || sc.model_turn;
            if (mt && mt.parts) {
                mt.parts.forEach(p => {
                    const id = p.inlineData || p.inline_data;
                    if (id) {
                        const mime = id.mimeType || id.mime_type;
                        if (mime && mime.includes('audio')) {
                            audioChunks++;
                            const bytes = Buffer.from(id.data, 'base64').length;
                            console.log(`🔊 Audio #${audioChunks}: ${bytes} bytes, MIME: ${mime}`);
                        }
                    }
                    if (p.text) console.log(`📝 Text: "${p.text}"`);
                });
            }
            if (sc.turnComplete) {
                console.log(`\n✅ COMPLETE! Audio chunks: ${audioChunks}`);
                console.log(audioChunks > 0 ? '🎉 AUDIO IS WORKING!' : '❌ No audio received');
            }
        }
    } catch (e) {
        console.log('Parse error:', e.message);
    }
});

ws.on('error', (e) => console.log('❌ Error:', e.message));
ws.on('close', (code) => console.log(`\n🔌 Closed (code: ${code})`));

setTimeout(() => ws.close(), 20000);
