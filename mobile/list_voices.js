
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function listVoices() {
    console.log('🔍 Listing available Arabic voices...');

    const configPath = path.resolve('e:/jjj/mobile/src/config/constants.js');
    const configContent = fs.readFileSync(configPath, 'utf8');
    const keyMatch = configContent.match(/export const GOOGLE_API_KEY = ['"]([^'"]+)['"]/);
    const apiKey = keyMatch[1];

    const url = `https://texttospeech.googleapis.com/v1/voices?key=${apiKey}`;

    try {
        const response = await axios.get(url);
        const voices = response.data.voices.filter(v => v.languageCodes.includes('ar-XA'));
        console.log('Available ar-XA voices:');
        voices.forEach(v => {
            console.log(`- ${v.name} (${v.ssmlGender})`);
        });
    } catch (error) {
        console.error('❌ Failed to list voices.');
        if (error.response) console.error(JSON.stringify(error.response.data));
    }
}

listVoices();
