const axios = require('axios');
const fs = require('fs');

// Using the correct key from constants.js
const API_KEY = 'AIzaSyC_etWPTE9ZXHIa-a7TxeM2rCg69erBERU';

async function testGoogleCloudTTS() {
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;

    console.log(`🔍 Testing Google Cloud TTS API with Key: ${API_KEY.substring(0, 10)}...`);

    const body = {
        input: { text: "Hello, this is a test." },
        voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
        audioConfig: { audioEncoding: "MP3" }
    };

    try {
        const response = await axios.post(url, body);
        console.log('✅ SUCCESS! The Cloud API Key is WORKING.');
        console.log(`Returned Audio Content Length: ${response.data.audioContent.length}`);
    } catch (error) {
        console.log('❌ FAILED! Cloud API Key Error.');
        if (error.response) {
            console.log('Status Code:', error.response.status);
            console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error Message:', error.message);
        }
    }
}

testGoogleCloudTTS();
