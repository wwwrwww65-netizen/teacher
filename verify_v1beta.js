const WebSocket = require('ws');

const API_KEY = "AIzaSyDg93OejWfAfCC-_JLQH9cqQtIlsGQhFDM"; 
const HOST = "generativelanguage.googleapis.com";

async function testV1Beta(modelName) {
    console.log(`\n🧪 Testing Model: ${modelName} on V1 (Beta)...`);
    // تغيير v1alpha إلى v1beta
    const url = `wss://${HOST}/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;
    
    return new Promise((resolve) => {
        const ws = new WebSocket(url);

        ws.on('open', () => {
            console.log(`   ✅ Connected (V1Beta)! Sending setup...`);
            const setupMsg = {
                setup: {
                    model: modelName,
                    generation_config: { response_modalities: ["TEXT"] }
                }
            };
            ws.send(JSON.stringify(setupMsg));
        });

        ws.on('message', (data) => {
            console.log(`   📩 DATA RECEIVED: ${data.toString()}`);
            ws.close();
            resolve(true);
        });

        ws.on('close', (code, reason) => {
            console.log(`   ❌ Closed: ${code} - ${reason}`);
            resolve(false);
        });
        
        ws.on('error', (err) => {
            console.log(`   ⚠️ Error: ${err.message}`); 
            // V1Beta قد لا يدعم المسار هذا، لنتأكد
            resolve(false)
        });
    });
}

// Gemini 2.0 Flash is THE Multimodal Live model.
testV1Beta("models/gemini-2.0-flash-exp"); 
