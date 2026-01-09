const axios = require('axios');

const BACKUP_KEY = 'AIzaSyCd4HQDcNeF6WztPhTOhUbcoiqZi79Q5ug';

async function testBackupKey() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${BACKUP_KEY}`;

    const body = {
        contents: [{
            parts: [{
                text: "مرحبا"
            }]
        }]
    };

    try {
        console.log('🔍 Testing BACKUP Gemini API Key...');

        const response = await axios.post(url, body, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ SUCCESS! Backup key is working');
        console.log('📊 Response status:', response.status);

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        if (error.response) {
            console.error('📊 Status:', error.response.status);
            console.error('📄 Response:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testBackupKey();
