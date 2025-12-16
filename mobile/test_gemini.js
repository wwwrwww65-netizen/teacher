const axios = require('axios');

const API_KEY = 'AIzaSyBsuAE4FdDTt2A8aLGskH_P578M6OAieis';
const PACKAGE_NAME = 'com.tinyteacher';
const CERT_SHA1 = '6A:A3:03:D2:43:58:19:DD:63:18:CD:F7:DB:CD:97:DF:F0:C2:60:23';

async function listModels() {
    console.log("Listing Gemini Models...");
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'X-Android-Package': PACKAGE_NAME,
                'X-Android-Cert': CERT_SHA1
            }
        });

        console.log("✅ Success! Available Models:");
        response.data.models.forEach(m => console.log(`- ${m.name}`));
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

listModels();
