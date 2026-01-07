const axios = require('axios');

// Using the key currently in constants.js
const API_KEY = 'AIzaSyC_etWPTE9ZXHIa-a7TxeM2rCg69erBERU';

async function testGemini() {
    // Testing the model name found in the list
    const model = 'gemini-flash-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    console.log(`🔍 Testing Gemini API...`);
    console.log(`🔑 Key: ${API_KEY.substring(0, 10)}...`);
    console.log(`🤖 Model: ${model}`);

    const body = {
        contents: [{
            parts: [{ text: "Hello, are you working?" }]
        }]
    };

    try {
        const response = await axios.post(url, body, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('✅ SUCCESS! Gemini is RESPONDING.');
        console.log('Response:', response.data.candidates[0].content.parts[0].text);
    } catch (error) {
        console.log('❌ FAILED! Connection error.');
        if (error.response) {
            console.log('Status Code:', error.response.status);
            console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error Message:', error.message);
        }
    }
}

testGemini();
