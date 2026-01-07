
const axios = require('axios');
const GOOGLE_API_KEY = 'YOUR_API_KEY'; // I need to get the actual key from the constants file

async function testConnection() {
    console.log('🔍 Testing connection to Google Gemini API...');

    // In a real scenario, I'd read this from the config file, but for a quick check I'll try to reach the endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GOOGLE_API_KEY}`;

    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Hello, this is a connection test. Reply with 'OK'." }] }]
        });

        console.log('✅ Success! Gemini is reachable.');
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('❌ Connection Failed.');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Reason:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Message:', error.message);
        }
    }
}

// I need to read the actual key first
const fs = require('fs');
const path = require('path');

const configPath = path.resolve('e:/jjj/mobile/src/config/constants.js');
try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const keyMatch = configContent.match(/export const GOOGLE_API_KEY = ['"]([^'"]+)['"]/);
    if (keyMatch) {
        const actualKey = keyMatch[1];
        const finalUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${actualKey}`;

        axios.post(finalUrl, {
            contents: [{ parts: [{ text: "Hello, connection test." }] }]
        }).then(res => {
            console.log('✅ Connection Successful!');
            process.exit(0);
        }).catch(err => {
            console.error('❌ Connection Failed.');
            if (err.response) {
                console.error('Status:', err.response.status);
                console.error('Error:', JSON.stringify(err.response.data));
            } else {
                console.error('Msg:', err.message);
            }
            process.exit(1);
        });
    } else {
        console.error('Could not find API Key in constants.js');
    }
} catch (e) {
    console.error('Error reading config:', e.message);
}
