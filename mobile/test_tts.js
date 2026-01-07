
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testTTS() {
    console.log('🔍 Testing connection to Google Cloud TTS (Neural2)...');

    const configPath = path.resolve('e:/jjj/mobile/src/config/constants.js');
    const configContent = fs.readFileSync(configPath, 'utf8');
    const keyMatch = configContent.match(/export const GOOGLE_API_KEY = ['"]([^'"]+)['"]/);

    if (!keyMatch) {
        console.error('❌ Could not find API Key.');
        return;
    }

    const apiKey = keyMatch[1];
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

    const body = {
        input: { text: "مرحباً بكم، أنا معلمتكم تيني. كيف حالكم اليوم؟" },
        voice: {
            languageCode: 'ar-XA',
            name: 'ar-XA-Chirp3-HD-Achernar',
            ssmlGender: 'FEMALE'
        },
        audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0.0
        }
    };

    try {
        const response = await axios.post(url, body);
        if (response.data && response.data.audioContent) {
            console.log('✅ TTS Success! Audio content received.');
            console.log('Audio Data Length:', response.data.audioContent.length);
        } else {
            console.error('⚠️ Success but no audio content?');
        }
    } catch (error) {
        console.error('❌ TTS Connection Failed.');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data));
        } else {
            console.error('Msg:', error.message);
        }
    }
}

testTTS();
