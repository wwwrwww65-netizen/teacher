const axios = require('axios');

const API_KEY = 'AIzaSyDg93OejWfAfCC-_JLQH9cqQtIlsGQhFDM';

// Test cases for professional TTS
const testCases = [
    {
        name: "Isolated Letters with Diacritics",
        text: "<speak><break time=\"200ms\"/><prosody rate=\"0.75\"><say-as interpret-as=\"characters\">أَ</say-as></prosody><break time=\"300ms\"/></speak>",
        description: "Testing isolated letter 'أَ' with SSML enhancement"
    },
    {
        name: "Multiple Isolated Letters",
        text: "<speak>ردد معي: <break time=\"200ms\"/><prosody rate=\"0.75\"><say-as interpret-as=\"characters\">أَ</say-as></prosody><break time=\"300ms\"/> <break time=\"200ms\"/><prosody rate=\"0.75\"><say-as interpret-as=\"characters\">إِ</say-as></prosody><break time=\"300ms\"/> <break time=\"200ms\"/><prosody rate=\"0.75\"><say-as interpret-as=\"characters\">أُ</say-as></prosody><break time=\"300ms\"/></speak>",
        description: "Testing multiple isolated letters with pauses"
    },
    {
        name: "Regular Sentence with Waqf",
        text: "<speak>أَهْلاً بِكَ يَا هَاشِمْ</speak>",
        description: "Testing regular sentence with pausal form (sukun)"
    },
    {
        name: "Ta-Marbuta Ending",
        text: "<speak>أَنَا الْمُعَلِّمَةْ نُورَاْ</speak>",
        description: "Testing ta-marbuta with sukun"
    },
    {
        name: "Mixed Content",
        text: "<speak>الحرف <break time=\"200ms\"/><prosody rate=\"0.75\"><say-as interpret-as=\"characters\">بَ</say-as></prosody><break time=\"300ms\"/> من كلمة بَيْتْ</speak>",
        description: "Testing mixed isolated letter and regular word"
    }
];

async function testTTS(testCase, index) {
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;

    const body = {
        input: { ssml: testCase.text },
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
        console.log(`\n${'='.repeat(70)}`);
        console.log(`TEST ${index + 1}: ${testCase.name}`);
        console.log(`${'='.repeat(70)}`);
        console.log(`📝 Description: ${testCase.description}`);
        console.log(`📤 SSML Input:`);
        console.log(testCase.text);
        console.log(`\n🔄 Sending request...`);

        const response = await axios.post(url, body, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ SUCCESS!`);
        console.log(`📊 Status: ${response.status}`);
        console.log(`📦 Audio Length: ${response.data.audioContent?.length || 0} bytes`);
        console.log(`✨ Test PASSED`);

        return true;

    } catch (error) {
        console.error(`❌ FAILED!`);
        console.error(`📊 Status: ${error.response?.status}`);
        console.error(`📄 Error: ${error.response?.data?.error?.message || error.message}`);
        console.log(`💥 Test FAILED`);

        return false;
    }
}

async function runAllTests() {
    console.log('\n🎯 PROFESSIONAL ARABIC TTS TESTING SUITE');
    console.log('========================================\n');
    console.log(`📅 Date: ${new Date().toISOString()}`);
    console.log(`🔑 API Key: ${API_KEY.substring(0, 20)}...`);
    console.log(`🎤 Voice: ar-XA-Chirp3-HD-Sulafat`);
    console.log(`📚 Total Tests: ${testCases.length}\n`);

    let passed = 0;
    let failed = 0;

    for (let i = 0; i < testCases.length; i++) {
        const result = await testTTS(testCases[i], i);
        if (result) {
            passed++;
        } else {
            failed++;
        }

        // Wait between tests
        if (i < testCases.length - 1) {
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log('📊 FINAL RESULTS');
    console.log(`${'='.repeat(70)}`);
    console.log(`✅ Passed: ${passed}/${testCases.length}`);
    console.log(`❌ Failed: ${failed}/${testCases.length}`);
    console.log(`📈 Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

    if (passed === testCases.length) {
        console.log(`\n🎉 ALL TESTS PASSED! Professional TTS is working perfectly!`);
    } else {
        console.log(`\n⚠️ Some tests failed. Please review the errors above.`);
    }
}

runAllTests();
