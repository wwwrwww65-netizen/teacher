const axios = require('axios');

const API_KEY = 'AIzaSyDg93OejWfAfCC-_JLQH9cqQtIlsGQhFDM';

async function listModels() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
        const response = await axios.get(url);

        console.log('--- Available Models ---');
        const models = response.data.models;
        models.forEach(m => {
            if (m.name.includes('gemini-2.0') || m.name.includes('gemini-exp')) {
                console.log(`✅ [FOUND] ${m.name}`);
                console.log(`   Description: ${m.description}`);
                console.log(`   Capabilities: ${m.supportedGenerationMethods.join(', ')}`);
                console.log('---');
            } else {
                // console.log(`   (Other) ${m.name}`);
            }
        });

        // Specifically check for flash 2.0 live
        const liveModel = models.find(m => m.name.includes('gemini-2.0-flash-exp') || m.name.includes('gemini-2.0-flash-001'));
        if (liveModel) {
            console.log(`\n🚀 GREAT NEWS: Gemini 2.0 Flash is AVAILABLE (${liveModel.name})!`);
        } else {
            console.log('\n⚠️ Gemini 2.0 Flash not found in available models list.');
        }

    } catch (error) {
        console.error('❌ Error checking models:', error.response ? error.response.data : error.message);
    }
}

listModels();
