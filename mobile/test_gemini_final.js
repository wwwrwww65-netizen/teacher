const axios = require('axios');

const API_KEY = 'AIzaSyC-xdocKTINJOPZLllWBaAkLvTA1UY33z0'; // Current New Key
const PACKAGE_NAME = 'com.tinyteacher';
const CERT_SHA1 = '6A:A3:03:D2:43:58:19:DD:63:18:CD:F7:DB:CD:97:DF:F0:C2:60:23';

async function testGemini() {
    console.log("Testing Gemini API (gemini-flash-latest)...");
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`;
        const body = {
            contents: [{ parts: [{ text: "Hello Gemini, are you working?" }] }]
        };

        const response = await axios.post(url, body, {
            headers: {
                'Content-Type': 'application/json',
                'X-Android-Package': PACKAGE_NAME,
                'X-Android-Cert': CERT_SHA1
            }
        });

        console.log("✅ Success! Gemini Response:");
        if (response.data.candidates && response.data.candidates.length > 0) {
            console.log(response.data.candidates[0].content.parts[0].text);
        } else {
            console.log("(Empty response, but 200 OK)");
        }

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

testGemini();
