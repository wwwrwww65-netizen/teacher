const WebSocket = require('ws');

const API_KEY = "AIzaSyDg93OejWfAfCC-_JLQH9cqQtIlsGQhFDM"; // مفتاحك
const HOST = "generativelanguage.googleapis.com";

async function testModel(modelName) {
    console.log(`\n🧪 Testing Model: ${modelName}`);
    const url = `wss://${HOST}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${API_KEY}`;
    
    return new Promise((resolve) => {
        const ws = new WebSocket(url);
        let receivedMessage = false;

        ws.on('open', () => {
            console.log(`   ✅ WebSocket Connected!`);
            
            // setup message
            const setupMsg = {
                setup: {
                    model: modelName,
                    generation_config: {
                        response_modalities: ["TEXT"], // نجرب نص فقط
                        temperature: 0.2
                    }
                }
            };
            
            console.log(`   📤 Sending Setup...`);
            ws.send(JSON.stringify(setupMsg));
        });

        ws.on('message', (data) => {
            receivedMessage = true;
            console.log(`   📩 Received Data: ${data.toString().substring(0, 100)}...`);
            console.log(`   ✅ SUCCESS! Model is responding.`);
            ws.close();
            resolve(true);
        });

        ws.on('close', (code, reason) => {
            if (!receivedMessage) {
                console.log(`   ❌ Closed immediately! Code: ${code}, Reason: ${reason}`);
                resolve(false);
            } else {
                console.log(`   🔌 Connection closed normally.`);
                resolve(true);
            }
        });

        ws.on('error', (err) => {
            console.log(`   ❌ Error: ${err.message}`);
            resolve(false);
        });
    });
}

async function runTests() {
    console.log("🔍 DIAGNOSTIC WEBSOCKET TEST");
    console.log("============================");
    
    // Test 1: Gemini 1.5 Flash (The reliable one)
    const res1 = await testModel("models/gemini-1.5-flash-latest");
    
    // Test 2: Gemini 2.0 Flash (The stable new one)
    const res2 = await testModel("models/gemini-2.0-flash");

    // Test 3: Gemini 2.0 Flash Exp (The deprecated one)
    const res3 = await testModel("models/gemini-2.0-flash-exp");
    
    console.log("\n============================");
    console.log("SUMMARY:");
    console.log(`gemini-1.5-flash-latest: ${res1 ? "✅ WORKING" : "❌ FAILED"}`);
    console.log(`gemini-2.0-flash:        ${res2 ? "✅ WORKING" : "❌ FAILED"}`);
    console.log(`gemini-2.0-flash-exp:    ${res3 ? "✅ WORKING" : "❌ FAILED"}`);
}

runTests();
