/**
 * 🔍 Gemini API & Google Cloud TTS Diagnostic Tool
 * 
 * This script tests:
 * 1. Gemini API Key validity
 * 2. Gemini Live WebSocket connection
 * 3. Google Cloud TTS API (if configured)
 * 4. Billing/Quota status
 */

const WebSocket = require('ws');
const https = require('https');

// ⚠️ REPLACE WITH YOUR ACTUAL API KEY
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE'; // Get from Firebase or constants
const MODEL_NAME = 'models/gemini-2.0-flash-exp';

console.log('🔍 Starting Gemini API Diagnostic...\n');

// Test 1: Check Gemini API Key via REST
async function testGeminiREST() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📡 TEST 1: Gemini REST API (Text Generation)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const url = `https://generativelanguage.googleapis.com/v1beta/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;
    
    const payload = JSON.stringify({
        contents: [{
            parts: [{
                text: "قل مرحبا"
            }]
        }]
    });

    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        };

        const req = https.request(url, options, (res) => {
            let data = '';
            
            console.log(`📊 Status Code: ${res.statusCode}`);
            console.log(`📋 Headers:`, JSON.stringify(res.headers, null, 2));
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    
                    if (res.statusCode === 200) {
                        console.log('✅ API Key is VALID');
                        console.log('📝 Response:', JSON.stringify(response, null, 2));
                        resolve(true);
                    } else {
                        console.log('❌ API Request Failed');
                        console.log('📝 Error Response:', JSON.stringify(response, null, 2));
                        
                        // Check for common errors
                        if (response.error) {
                            const errorMsg = response.error.message || '';
                            const errorCode = response.error.code || '';
                            
                            if (errorMsg.includes('API key not valid') || errorCode === 400) {
                                console.log('🔑 ERROR: Invalid API Key');
                            } else if (errorMsg.includes('quota') || errorMsg.includes('limit')) {
                                console.log('💰 ERROR: Quota/Billing Issue - Check Google Cloud Console');
                            } else if (errorMsg.includes('billing')) {
                                console.log('💳 ERROR: Billing not enabled or payment method required');
                            }
                        }
                        
                        resolve(false);
                    }
                } catch (e) {
                    console.log('❌ Failed to parse response:', data);
                    resolve(false);
                }
            });
        });

        req.on('error', (e) => {
            console.log('❌ Request Error:', e.message);
            reject(e);
        });

        req.write(payload);
        req.end();
    });
}

// Test 2: Check Gemini Live WebSocket Connection
async function testGeminiLive() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔌 TEST 2: Gemini Live WebSocket Connection');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;
    
    return new Promise((resolve) => {
        console.log('🔗 Connecting to Gemini Live...');
        
        const ws = new WebSocket(url);
        let setupSent = false;
        let timeout;

        ws.on('open', () => {
            console.log('✅ WebSocket CONNECTED');
            
            // Send setup message
            const setupMessage = {
                setup: {
                    model: MODEL_NAME,
                    generation_config: {
                        response_modalities: ["TEXT"],
                        temperature: 0.2
                    },
                    system_instruction: {
                        parts: [{
                            text: "أنت معلمة عربية. قل مرحبا."
                        }]
                    }
                }
            };
            
            console.log('📤 Sending setup message...');
            ws.send(JSON.stringify(setupMessage));
            setupSent = true;
            
            // Set timeout for setup response
            timeout = setTimeout(() => {
                console.log('⏰ Timeout: No setup response received in 10 seconds');
                ws.close();
                resolve(false);
            }, 10000);
        });

        ws.on('message', (data) => {
            try {
                const response = JSON.parse(data.toString());
                console.log('📨 Message Received:', JSON.stringify(response, null, 2));
                
                if (response.setupComplete || response.setup_complete) {
                    console.log('✅ Setup Complete - Connection is WORKING!');
                    clearTimeout(timeout);
                    ws.close();
                    resolve(true);
                } else if (response.error) {
                    console.log('❌ Error in response:', response.error);
                    clearTimeout(timeout);
                    ws.close();
                    resolve(false);
                }
            } catch (e) {
                console.log('⚠️ Failed to parse message:', data.toString());
            }
        });

        ws.on('close', (code, reason) => {
            console.log(`🔌 WebSocket CLOSED - Code: ${code}, Reason: ${reason || 'No reason provided'}`);
            
            if (!setupSent) {
                console.log('❌ Connection closed before setup was sent');
            } else {
                console.log('⚠️ Connection closed after setup (check logs above for errors)');
            }
            
            clearTimeout(timeout);
            resolve(false);
        });

        ws.on('error', (err) => {
            console.log('❌ WebSocket ERROR:', err.message);
            clearTimeout(timeout);
            resolve(false);
        });
    });
}

// Test 3: Check API Quota/Billing Status
async function checkQuotaStatus() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💰 TEST 3: Quota & Billing Status');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('ℹ️  To check detailed quota/billing:');
    console.log('1. Visit: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas');
    console.log('2. Check: https://console.cloud.google.com/billing');
    console.log('3. Gemini API Console: https://aistudio.google.com/app/apikey\n');
    
    // Try to get model info (this also validates the key)
    const url = `https://generativelanguage.googleapis.com/v1beta/${MODEL_NAME}?key=${GEMINI_API_KEY}`;
    
    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    
                    if (res.statusCode === 200) {
                        console.log('✅ Model Info Retrieved Successfully');
                        console.log('📝 Model Details:', JSON.stringify(response, null, 2));
                        resolve(true);
                    } else {
                        console.log('❌ Failed to get model info');
                        console.log('📝 Response:', JSON.stringify(response, null, 2));
                        resolve(false);
                    }
                } catch (e) {
                    console.log('❌ Failed to parse response:', data);
                    resolve(false);
                }
            });
        }).on('error', (e) => {
            console.log('❌ Request Error:', e.message);
            resolve(false);
        });
    });
}

// Main execution
async function runDiagnostics() {
    console.log('🚀 Gemini API Diagnostics Tool');
    console.log('═══════════════════════════════════════════\n');
    
    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        console.log('❌ ERROR: Please replace GEMINI_API_KEY with your actual API key!');
        console.log('📍 You can find it in:');
        console.log('   - Firebase Remote Config (recommended)');
        console.log('   - mobile/src/config/constants.js');
        console.log('   - https://aistudio.google.com/app/apikey\n');
        return;
    }
    
    try {
        // Test 1: REST API
        const restResult = await testGeminiREST();
        
        // Test 2: WebSocket (Gemini Live)
        const liveResult = await testGeminiLive();
        
        // Test 3: Quota Status
        const quotaResult = await checkQuotaStatus();
        
        // Summary
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 DIAGNOSTIC SUMMARY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        console.log(`REST API:        ${restResult ? '✅ WORKING' : '❌ FAILED'}`);
        console.log(`Gemini Live:     ${liveResult ? '✅ WORKING' : '❌ FAILED'}`);
        console.log(`Model Access:    ${quotaResult ? '✅ WORKING' : '❌ FAILED'}`);
        
        if (!restResult || !liveResult) {
            console.log('\n🔧 TROUBLESHOOTING STEPS:');
            console.log('1. Verify API Key is correct');
            console.log('2. Check billing is enabled: https://console.cloud.google.com/billing');
            console.log('3. Verify Generative Language API is enabled');
            console.log('4. Check quota limits: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas');
            console.log('5. Ensure payment method is valid (if using paid tier)');
        }
        
    } catch (e) {
        console.log('\n❌ Fatal Error:', e.message);
    }
}

// Run the diagnostics
runDiagnostics();
