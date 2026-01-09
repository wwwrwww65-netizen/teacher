const axios = require('axios');

const GOOGLE_API_KEY = 'AIzaSyC_etWPTE9ZXHIa-a7TxeM2rCg69erBERU';

async function testGoogleTTS() {
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`;

    const body = {
        input: { ssml: '<speak>مرحبا</speak>' },
        voice: {
            languageCode: 'ar-XA',
            name: 'ar-XA-Chirp3-HD-Sulafat',
            ssmlGender: 'FEMALE'
        },
        audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0.0,
            volumeGainDb: 0.0
        }
    };

    try {
        console.log('🔍 Testing Google Cloud TTS...');
        console.log('📤 Voice:', body.voice.name);
        console.log('📤 Text:', body.input.ssml);

        const response = await axios.post(url, body, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ SUCCESS! Google TTS is working');
        console.log('📊 Response status:', response.status);
        console.log('📦 Audio content length:', response.data.audioContent?.length || 0);

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        if (error.response) {
            console.error('📊 Status:', error.response.status);
            console.error('📄 Response:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testGoogleTTS();
