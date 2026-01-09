const axios = require('axios');

const GOOGLE_API_KEY = 'AIzaSyC_etWPTE9ZXHIa-a7TxeM2rCg69erBERU';

async function testGeminiAPI() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GOOGLE_API_KEY}`;

    const body = {
        contents: [{
            parts: [{
                text: "مرحبا، كيف حالك؟"
            }]
        }]
    };

    try {
        console.log('🔍 Testing Gemini API...');
        console.log('📤 URL:', url);

        const response = await axios.post(url, body, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ SUCCESS! Gemini API is working');
        console.log('📊 Response status:', response.status);
        console.log('📝 Response:', response.data.candidates[0].content.parts[0].text);

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        if (error.response) {
            console.error('📊 Status:', error.response.status);
            console.error('📄 Response:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testGeminiAPI();
