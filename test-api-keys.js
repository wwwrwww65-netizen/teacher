/**
 * سكريبت اختبار المفاتيح (API Keys Test)
 * يختبر Google TTS و Lahajati API
 */

// المفاتيح
const GOOGLE_API_KEY = 'AIzaSyC_etWPTE9ZXHIa-a7TxeM2rCg69erBERU';
const LAHAJATI_API_KEY = 'sk_eyJpdiI6IkgvSEdXMVNPUVJXeHR2ZTlBRVpaWnc9PSIsInZhbHVlIjoiMjBLZGUrNTBETjhubFljT0pjSHFiM0Fud1FBeWpCWTdjSEV0U04rbXB3T2g4YWlLSmV5aytEcWRGdkZnVm4yZyIsIm1hYyI6IjNlNmRiMzJlYTk0ZmU1Y2JiY2E2Mjk4YjQ3ZTVjNTYyMDVjYzYxNjAyNGFmNzQ4NTIyMDRkZWIxM2JjNzEzMWQiLCJ0YWciOiIifQ==';

console.log('🔍 بدء اختبار المفاتيح...\n');

// ========================================
// 1. اختبار Google TTS API
// ========================================
async function testGoogleTTS() {
    console.log('📡 اختبار Google TTS API...');

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    input: {
                        ssml: '<speak>مرحباً</speak>'
                    },
                    voice: {
                        languageCode: 'ar-XA',
                        name: 'ar-XA-Wavenet-D',
                        ssmlGender: 'FEMALE'
                    },
                    audioConfig: {
                        audioEncoding: 'MP3',
                        speakingRate: 1.0,
                        pitch: 0.0,
                        volumeGainDb: 0.0
                    }
                }),
                signal: controller.signal
            }
        );

        clearTimeout(timeout);

        if (response.ok) {
            const data = await response.json();
            if (data && data.audioContent) {
                console.log('✅ Google TTS: يعمل بنجاح!');
                console.log(`   حجم الملف الصوتي: ${data.audioContent.length} حرف (base64)`);
                return true;
            } else {
                console.log('❌ Google TTS: رد غير صحيح');
                return false;
            }
        } else {
            console.log('❌ Google TTS: فشل الاتصال');
            console.log(`   كود الخطأ: ${response.status}`);
            const errorData = await response.text();
            console.log(`   تفاصيل: ${errorData.substring(0, 200)}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Google TTS: فشل الاتصال');
        console.log(`   الخطأ: ${error.message}`);
        return false;
    }
}

// ========================================
// 2. اختبار Lahajati API
// ========================================
async function testLahajatiAPI() {
    console.log('\n📡 اختبار Lahajati API...');

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(
            'https://lahajati.ai/api/v1/text-to-speech-absolute-control',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${LAHAJATI_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    text: 'مرحباً',
                    id_voice: '1',
                    input_mode: 0,
                    performance_id: '1',
                    dialect_id: '1'
                }),
                signal: controller.signal
            }
        );

        clearTimeout(timeout);

        if (response.ok) {
            const data = await response.json();
            if (data && (data.audio_url || data.url || data.audio_base64)) {
                console.log('✅ Lahajati: يعمل بنجاح!');
                console.log(`   الرد: ${JSON.stringify(data).substring(0, 100)}...`);
                return true;
            } else {
                console.log('❌ Lahajati: رد غير صحيح');
                console.log(`   الرد الكامل: ${JSON.stringify(data)}`);
                return false;
            }
        } else {
            console.log('❌ Lahajati: فشل الاتصال');
            console.log(`   كود الخطأ: ${response.status}`);
            const errorData = await response.text();
            console.log(`   تفاصيل: ${errorData.substring(0, 200)}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Lahajati: فشل الاتصال');
        console.log(`   الخطأ: ${error.message}`);
        return false;
    }
}

// ========================================
// 3. اختبار الاتصال بالإنترنت
// ========================================
async function testInternetConnection() {
    console.log('\n🌐 اختبار الاتصال بالإنترنت...');

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('https://www.google.com', {
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (response.ok) {
            console.log('✅ الاتصال بالإنترنت: يعمل بنجاح!');
            return true;
        } else {
            console.log('⚠️ الاتصال بالإنترنت: استجابة غير متوقعة');
            return false;
        }
    } catch (error) {
        console.log('❌ الاتصال بالإنترنت: فشل');
        console.log(`   الخطأ: ${error.message}`);
        return false;
    }
}

// ========================================
// تشغيل جميع الاختبارات
// ========================================
async function runAllTests() {
    console.log('═══════════════════════════════════════');
    console.log('   🧪 اختبار جاهزية المفاتيح');
    console.log('═══════════════════════════════════════\n');

    const internetOk = await testInternetConnection();
    const googleOk = await testGoogleTTS();
    const lahajatiOk = await testLahajatiAPI();

    console.log('\n═══════════════════════════════════════');
    console.log('   📊 ملخص النتائج');
    console.log('═══════════════════════════════════════');
    console.log(`🌐 الإنترنت:      ${internetOk ? '✅ يعمل' : '❌ لا يعمل'}`);
    console.log(`📡 Google TTS:    ${googleOk ? '✅ يعمل' : '❌ لا يعمل'}`);
    console.log(`🎤 Lahajati:      ${lahajatiOk ? '✅ يعمل' : '❌ لا يعمل'}`);
    console.log('═══════════════════════════════════════\n');

    if (!internetOk) {
        console.log('⚠️  تحذير: لا يوجد اتصال بالإنترنت!');
        console.log('   الحل: تحقق من اتصال الجهاز بالإنترنت\n');
    }

    if (!googleOk && internetOk) {
        console.log('⚠️  تحذير: Google TTS لا يعمل!');
        console.log('   الأسباب المحتملة:');
        console.log('   1. المفتاح منتهي الصلاحية');
        console.log('   2. تم تجاوز الحد المجاني');
        console.log('   3. المفتاح محظور أو غير صحيح\n');
    }

    if (!lahajatiOk && internetOk) {
        console.log('⚠️  تحذير: Lahajati لا يعمل!');
        console.log('   الأسباب المحتملة:');
        console.log('   1. الحساب غير مُفعّل بالكامل');
        console.log('   2. المفتاح غير صحيح');
        console.log('   3. معرفات الأصوات خاطئة');
        console.log('   4. نفذت النقاط المجانية\n');
    }

    if (googleOk || lahajatiOk) {
        console.log('✅ التطبيق جاهز للعمل!\n');
    } else {
        console.log('❌ التطبيق غير جاهز - يرجى حل المشاكل أعلاه\n');
    }
}

// تشغيل الاختبارات
runAllTests().catch(err => {
    console.error('❌ خطأ غير متوقع:', err);
});
