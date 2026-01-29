const WebSocket = require('ws');

const API_KEY = "AIzaSyDg93OejWfAfCC-_JLQH9cqQtIlsGQhFDM"; 
const HOST = "generativelanguage.googleapis.com";

// نجرب V1ALPHA (ولكن مع موديل 2.0-flash-exp الذي ربما ما زال يعمل هنا؟)
// أو نجرب رابطاً مختلفاً إذا وجدنا

async function testModel(modelName) {
    console.log(`\n🧪 Testing Model: ${modelName} on v1alpha...`);
    // نحاول استخدام موديل معروف جداً لل Live
    const url = `wss://${HOST}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${API_KEY}`;
    
    return new Promise((resolve) => {
        const ws = new WebSocket(url);
        let receivedMessage = false;

        ws.on('open', () => {
            console.log(`   ✅ Connected! Sending setup for ${modelName}...`);
            const setupMsg = {
                setup: {
                    model: modelName,
                    generation_config: { response_modalities: ["TEXT"] } // نجرب نص
                }
            };
            ws.send(JSON.stringify(setupMsg));
        });

        ws.on('message', (data) => {
            console.log(`   📩 DATA: ${data.toString()}`);
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


async function runTests() {
    // نجرب الموديل الوحيد الذي يعمل حالياً مع Live API حسب التقارير: gemini-2.0-flash-exp (الذي قيل أنه توقف، لكن ربما البديل هو gemini-2.0-flash-001)
    
    await testModel("models/gemini-2.0-flash-exp"); // القديم
    await testModel("models/gemini-2.0-flash");     // الجديد المستقر
    // لنجرب موديل 1.5 Pro (أحيانا يدعم Bidi)
    await testModel("models/gemini-1.5-pro-latest");
}

runTests();
