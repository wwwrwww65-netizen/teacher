const axios = require('axios');

const NEW_KEY = 'AIzaSyDg93OejWfAfCC-_JLQH9cqQtIlsGQhFDM';

async function testNewKey() {
    console.log('🔍 Testing NEW Gemini API Key...\n');

    // Test 1: Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${NEW_KEY}`;

    try {
        const response = await axios.post(geminiUrl, {
            contents: [{
                parts: [{
                    text: "قل مرحبا"
                }]
            }]
        }, {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('✅ Gemini API: SUCCESS!');
        console.log('📊 Status:', response.status);
        console.log('📝 Response:', response.data.candidates[0].content.parts[0].text.substring(0, 50));

    } catch (error) {
        console.error('❌ Gemini API: FAILED');
        console.error('📊 Status:', error.response?.status);
        console.error('📄 Error:', error.response?.data?.error?.message || error.message);
        return;
    }

    // Test 2: Google TTS API
    console.log('\n🔍 Testing Google TTS API...\n');
    const ttsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${NEW_KEY}`;

    try {
        const response = await axios.post(ttsUrl, {
            input: { ssml: '<speak>مرحبا</speak>' },
            voice: {
                languageCode: 'ar-XA',
                name: 'ar-XA-Chirp3-HD-Sulafat',
                ssmlGender: 'FEMALE'
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: 1.0,
                pitch: 0.0
            }
        }, {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('✅ Google TTS: SUCCESS!');
        console.log('📊 Status:', response.status);
        console.log('📦 Audio length:', response.data.audioContent?.length || 0);

        console.log('\n🎉 ALL TESTS PASSED! Key is valid for both services.');

    } catch (error) {
        console.error('❌ Google TTS: FAILED');
        console.error('📊 Status:', error.response?.status);
        console.error('📄 Error:', error.response?.data?.error?.message || error.message);
    }
}

testNewKey();
