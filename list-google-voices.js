/**
 * سكريبت عرض جميع الأصوات العربية المتاحة في Google TTS
 */

const GOOGLE_API_KEY = 'AIzaSyC_etWPTE9ZXHIa-a7TxeM2rCg69erBERU';

console.log('🔍 جاري الحصول على قائمة الأصوات العربية من Google TTS...\n');

async function getAvailableVoices() {
    try {
        const response = await fetch(
            `https://texttospeech.googleapis.com/v1/voices?key=${GOOGLE_API_KEY}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            console.log('❌ فشل الحصول على قائمة الأصوات');
            console.log(`   كود الخطأ: ${response.status}`);
            const errorData = await response.text();
            console.log(`   تفاصيل: ${errorData}`);
            return;
        }

        const data = await response.json();

        // تصفية الأصوات العربية فقط
        const arabicVoices = data.voices.filter(voice =>
            voice.languageCodes.some(code => code.startsWith('ar'))
        );

        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`   📊 وجدنا ${arabicVoices.length} صوت عربي متاح`);
        console.log('═══════════════════════════════════════════════════════════════\n');

        // تجميع الأصوات حسب النوع
        const voicesByType = {
            'Standard': [],
            'WaveNet': [],
            'Neural2': [],
            'Studio': [],
            'Journey': [],
            'Polyglot': [],
            'News': [],
            'Other': []
        };

        arabicVoices.forEach(voice => {
            const name = voice.name;
            if (name.includes('Standard')) {
                voicesByType['Standard'].push(voice);
            } else if (name.includes('Wavenet')) {
                voicesByType['WaveNet'].push(voice);
            } else if (name.includes('Neural2')) {
                voicesByType['Neural2'].push(voice);
            } else if (name.includes('Studio')) {
                voicesByType['Studio'].push(voice);
            } else if (name.includes('Journey')) {
                voicesByType['Journey'].push(voice);
            } else if (name.includes('Polyglot')) {
                voicesByType['Polyglot'].push(voice);
            } else if (name.includes('News')) {
                voicesByType['News'].push(voice);
            } else {
                voicesByType['Other'].push(voice);
            }
        });

        // عرض الأصوات حسب النوع
        Object.keys(voicesByType).forEach(type => {
            const voices = voicesByType[type];
            if (voices.length > 0) {
                console.log(`\n🎤 ${type} (${voices.length} صوت):`);
                console.log('─────────────────────────────────────────────────────────────');

                voices.forEach(voice => {
                    const gender = voice.ssmlGender === 'MALE' ? '👨 ذكر' :
                        voice.ssmlGender === 'FEMALE' ? '👩 أنثى' : '⚪ محايد';
                    const languages = voice.languageCodes.join(', ');

                    console.log(`   ${voice.name}`);
                    console.log(`      الجنس: ${gender}`);
                    console.log(`      اللغات: ${languages}`);

                    if (voice.naturalSampleRateHertz) {
                        console.log(`      معدل العينة: ${voice.naturalSampleRateHertz} Hz`);
                    }
                    console.log('');
                });
            }
        });

        // عرض ملخص سريع للأصوات الأنثوية (للمعلمة)
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('   👩 الأصوات الأنثوية المتاحة (للمعلمة نورا):');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const femaleVoices = arabicVoices.filter(v => v.ssmlGender === 'FEMALE');
        femaleVoices.forEach((voice, index) => {
            const quality = voice.name.includes('Neural2') ? '⭐⭐⭐⭐⭐ (الأفضل)' :
                voice.name.includes('Wavenet') ? '⭐⭐⭐⭐ (ممتاز)' :
                    voice.name.includes('Journey') ? '⭐⭐⭐⭐⭐ (حديث)' :
                        voice.name.includes('Studio') ? '⭐⭐⭐⭐⭐ (احترافي)' :
                            '⭐⭐⭐ (جيد)';

            console.log(`${index + 1}. ${voice.name}`);
            console.log(`   الجودة: ${quality}`);
            console.log('');
        });

        // توصية
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('   💡 التوصيات:');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const recommended = femaleVoices.filter(v =>
            v.name.includes('Wavenet') || v.name.includes('Neural2')
        );

        if (recommended.length > 0) {
            console.log('الأصوات الموصى بها للمعلمة نورا:\n');
            recommended.forEach((voice, index) => {
                console.log(`${index + 1}. ${voice.name}`);
            });
            console.log('\nلتغيير الصوت، افتح:');
            console.log('mobile/src/services/ArabicVoiceService.js');
            console.log('وغيّر السطر:');
            console.log(`name: this.currentVoice || 'ar-XA-Wavenet-D'`);
            console.log('إلى أي صوت من القائمة أعلاه');
        }

        console.log('\n');

    } catch (error) {
        console.error('❌ خطأ:', error.message);
    }
}

// تشغيل
getAvailableVoices();
