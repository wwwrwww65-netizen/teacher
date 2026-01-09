// Test both API keys
const https = require('https');

const keys = [
    { name: 'constants.js', key: 'AIzaSyDg93OejWfAfCC-_JLQH9cqQtIlsGQhFDM' },
    { name: 'ApiKeys.js', key: 'AIzaSyCd4HQDcNeF6WztPhTOhUbcoiqZi79Q5ug' }
];

function testKey(keyObj) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models?key=${keyObj.key}`,
            method: 'GET'
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`✅ ${keyObj.name}: VALID`);
                } else {
                    console.log(`❌ ${keyObj.name}: INVALID (${res.statusCode})`);
                }
                resolve();
            });
        });
        req.on('error', () => {
            console.log(`❌ ${keyObj.name}: ERROR`);
            resolve();
        });
        req.end();
    });
}

console.log('🧪 Testing API Keys...\n');

(async () => {
    for (const k of keys) {
        await testKey(k);
    }
    console.log('\n✅ Done');
})();
