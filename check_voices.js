const https = require('https');

const GOOGLE_API_KEY = 'AIzaSyDg93OejWfAfCC-_JLQH9cqQtIlsGQhFDM';
const url = `https://texttospeech.googleapis.com/v1/voices?key=${GOOGLE_API_KEY}&languageCode=ar-XA`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            if (response.error) {
                console.error('Error:', response.error.message);
                return;
            }
            const voices = response.voices || [];

            console.log('Available Arabic (ar-XA) Voices:');
            console.log('-------------------------------');

            const types = {};

            voices.forEach(voice => {
                const parts = voice.name.split('-');
                // Name format: ar-XA-Wavenet-A or ar-XA-Standard-A or ar-XA-Neural2-A or ar-XA-Chirp-HD-A
                // We want the part after ar-XA
                const type = parts.slice(2, -1).join('-');

                if (!types[type]) types[type] = [];
                types[type].push(`${voice.name} (${voice.ssmlGender})`);
            });

            for (const [type, voiceList] of Object.entries(types)) {
                console.log(`\n[${type} Type]:`);
                voiceList.forEach(v => console.log(` - ${v}`));
            }

            // Specifically check for "Natural" or Neural2
            const hasNatural = Object.keys(types).some(t => t.toLowerCase().includes('neural') || t.toLowerCase().includes('wavenet'));
            console.log('\n-------------------------------');
            console.log(`Are Natural (Neural/WaveNet) voices available? ${hasNatural ? 'YES' : 'NO'}`);

        } catch (e) {
            console.error('Failed to parse response:', e);
        }
    });
}).on('error', (err) => {
    console.error('Request Error:', err.message);
});
