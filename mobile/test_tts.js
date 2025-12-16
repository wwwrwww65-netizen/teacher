const axios = require('axios');

const API_KEY = 'AIzaSyC-xdocKTINJOPZLllWBaAkLvTA1UY33z0'; // New Key
const PACKAGE_NAME = 'com.tinyteacher';
const CERT_SHA1 = '6A:A3:03:D2:43:58:19:DD:63:18:CD:F7:DB:CD:97:DF:F0:C2:60:23';

async function testTTS() {
    console.log("Testing Google Cloud TTS...");
    try {
        const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;
        const body = {
            input: { text: "Hello, can you hear me?" },
            voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
            audioConfig: { audioEncoding: 'MP3' }
        };

        const response = await axios.post(url, body, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log("✅ Success! TTS Audio Content received (Length: " + response.data.audioContent.length + ")");
    } catch (error) {
        console.error("❌ Error:");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

testTTS();
