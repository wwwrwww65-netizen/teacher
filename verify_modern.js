const WebSocket = require('ws');

const API_KEY = "AIzaSyDg93OejWfAfCC-_JLQH9cqQtIlsGQhFDM"; 
const HOST = "generativelanguage.googleapis.com";

async function testModernPath(modelName) {
    console.log(`\n🧪 Testing Modern Path: ${modelName}...`);
    // النمط الجديد: /v1alpha/models/{model}:bidiGenerateContent
    const url = `wss://${HOST}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${API_KEY}`;
    
    // لنجرب مساراً بديلاً أحياناً ينجح
    // const url = `wss://${HOST}/v1alpha/models/${modelName}:bidiGenerateContent?key=${API_KEY}`; 
    // ^ للأسف مكتبة ws لا تدعم HTTP Upgrade standard لهذا المسار بسهولة إلا إذا كان السيرفر يدعمه

    return new Promise((resolve) => {
        const ws = new WebSocket(url);

        ws.on('open', () => {
            console.log(`   ✅ Connected! Sending setup...`);
            const setupMsg = {
                setup: {
                    model: modelName,
                    generation_config: { response_modalities: ["TEXT"] }
                }
            };
            ws.send(JSON.stringify(setupMsg));
        });

        ws.on('message', (data) => {
            console.log(`   📩 WORKING! DATA: ${data.toString()}`);
            ws.close();
            resolve(true);
        });

        ws.on('close', (code, reason) => {
            console.log(`   ❌ Closed: ${code} - ${reason}`);
            resolve(false);
        });
        
        ws.on('error', (err) => console.log(`   ⚠️ Error: ${err.message}`));
    });
}

// هذه هي المحاولة الحاسمة. إذا فشلت، فالموديل ببساطة لا يدعم Bidi لهذا المفتاح.
testModernPath("models/gemini-2.0-flash-exp"); 
