/**
 * 🚀 Quick Gemini Live Test
 * 
 * اختبار سريع لمعرفة سبب انقطاع Gemini Live
 */

const WebSocket = require('ws');

// ⚠️ ضع API Key الخاص بك هنا
// يمكنك الحصول عليه من:
// 1. https://aistudio.google.com/app/apikey
// 2. Firebase Console > Remote Config > api_keys.google_gemini
const API_KEY = 'YOUR_API_KEY_HERE';

const MODEL = 'models/gemini-2.0-flash-exp';

console.log('🚀 Gemini Live Quick Test\n');

if (API_KEY === 'YOUR_API_KEY_HERE') {
    console.log('❌ خطأ: يرجى وضع API Key الخاص بك في السطر 12');
    console.log('📍 احصل على API Key من: https://aistudio.google.com/app/apikey\n');
    process.exit(1);
}

// Test 1: Minimal Setup (بدون System Prompt)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 TEST 1: Minimal Setup (No System Prompt)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

const ws1 = new WebSocket(url);
let test1Success = false;

ws1.on('open', () => {
    console.log('✅ WebSocket Connected');
    
    // Setup بسيط جداً - بدون System Prompt
    const minimalSetup = {
        setup: {
            model: MODEL,
            generation_config: {
                response_modalities: ["TEXT"],
                temperature: 0.2
            }
        }
    };
    
    console.log('📤 Sending minimal setup...');
    ws1.send(JSON.stringify(minimalSetup));
});

ws1.on('message', (data) => {
    try {
        const response = JSON.parse(data.toString());
        console.log('📨 Response:', JSON.stringify(response, null, 2));
        
        if (response.setupComplete || response.setup_complete) {
            console.log('✅ TEST 1 PASSED: Minimal setup works!');
            test1Success = true;
            ws1.close();
            
            // إذا نجح Test 1، جرب Test 2
            setTimeout(() => runTest2(), 1000);
        } else if (response.error) {
            console.log('❌ Error:', response.error.message);
            console.log('🔢 Error Code:', response.error.code);
            
            if (response.error.message.includes('API key')) {
                console.log('\n🔑 المشكلة: API Key غير صالح');
                console.log('📍 تحقق من: https://aistudio.google.com/app/apikey');
            } else if (response.error.message.includes('quota') || response.error.message.includes('limit')) {
                console.log('\n💰 المشكلة: تجاوز Quota أو الرصيد انتهى');
                console.log('📍 تحقق من: https://console.cloud.google.com/billing');
            }
            
            ws1.close();
        }
    } catch (e) {
        console.log('⚠️ Parse error:', e.message);
    }
});

ws1.on('close', (code, reason) => {
    console.log(`\n🔌 Connection Closed`);
    console.log(`📊 Code: ${code}`);
    console.log(`📝 Reason: ${reason || 'No reason provided'}`);
    console.log(`🔍 Was Clean: ${code === 1000}\n`);
    
    // تفسير Close Codes
    const closeCodeMeanings = {
        1000: '✅ Normal closure (نجاح)',
        1002: '❌ Protocol error (خطأ في البروتوكول)',
        1003: '❌ Unsupported data (بيانات غير مدعومة)',
        1006: '⚠️ Abnormal closure (انقطاع غير طبيعي)',
        1008: '🔑 Policy violation (مخالفة - مثل API Key خاطئ)',
        1011: '🔧 Server error (خطأ في السيرفر)'
    };
    
    console.log(`📖 Meaning: ${closeCodeMeanings[code] || 'Unknown code'}\n`);
    
    if (!test1Success) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('❌ TEST 1 FAILED');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        if (code === 1008 || code === 1006) {
            console.log('🔍 التشخيص: مشكلة في API Key أو Billing');
            console.log('\n📋 خطوات الحل:');
            console.log('1. تحقق من صلاحية API Key: https://aistudio.google.com/app/apikey');
            console.log('2. تحقق من Billing: https://console.cloud.google.com/billing');
            console.log('3. تحقق من Quota: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas');
        } else {
            console.log('🔍 التشخيص: مشكلة في الاتصال أو الشبكة');
        }
    }
});

ws1.on('error', (err) => {
    console.log('❌ WebSocket Error:', err.message);
});

// Test 2: مع System Prompt صغير
function runTest2() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 TEST 2: With Small System Prompt');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const ws2 = new WebSocket(url);
    let test2Success = false;
    
    ws2.on('open', () => {
        console.log('✅ WebSocket Connected');
        
        // Setup مع System Prompt صغير
        const setupWithPrompt = {
            setup: {
                model: MODEL,
                generation_config: {
                    response_modalities: ["TEXT"],
                    temperature: 0.2
                },
                system_instruction: {
                    parts: [{
                        text: "أنت معلمة عربية اسمها نورا. تعلّم الأطفال بطريقة ممتعة."
                    }]
                }
            }
        };
        
        console.log('📤 Sending setup with small system prompt...');
        console.log(`📏 Prompt size: ${setupWithPrompt.setup.system_instruction.parts[0].text.length} chars`);
        ws2.send(JSON.stringify(setupWithPrompt));
    });
    
    ws2.on('message', (data) => {
        try {
            const response = JSON.parse(data.toString());
            console.log('📨 Response:', JSON.stringify(response, null, 2));
            
            if (response.setupComplete || response.setup_complete) {
                console.log('✅ TEST 2 PASSED: Small system prompt works!');
                test2Success = true;
                ws2.close();
                
                // إذا نجح Test 2، جرب Test 3
                setTimeout(() => runTest3(), 1000);
            } else if (response.error) {
                console.log('❌ Error:', response.error.message);
                ws2.close();
            }
        } catch (e) {
            console.log('⚠️ Parse error:', e.message);
        }
    });
    
    ws2.on('close', (code, reason) => {
        console.log(`\n🔌 Connection Closed - Code: ${code}\n`);
        
        if (!test2Success) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('❌ TEST 2 FAILED');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            console.log('🔍 التشخيص: مشكلة في System Prompt أو الإعدادات');
        }
    });
    
    ws2.on('error', (err) => {
        console.log('❌ WebSocket Error:', err.message);
    });
}

// Test 3: مع System Prompt كبير (مثل التطبيق)
function runTest3() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 TEST 3: With Large System Prompt (Like App)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const ws3 = new WebSocket(url);
    let test3Success = false;
    
    ws3.on('open', () => {
        console.log('✅ WebSocket Connected');
        
        // System Prompt كبير (محاكاة للتطبيق)
        const largePrompt = `
════════════════════════════════════════════════════════════════
⚡⚡⚡ قَوَاعِدُ اسْتِخْدَامِ الْأَدَوَاتِ (CRITICAL) ⚡⚡⚡
════════════════════════════════════════════════════════════════

أَنْتِ الْمُعَلِّمَةُ نُورَا، مُعَلِّمَةٌ عَرَبِيَّةٌ مُتَخَصِّصَةٌ فِي تَعْلِيمِ الْأَطْفَالِ.

🎨 1. السَّبُّورَةُ (drawOnBoard)
   - الوَظِيفَةُ: لِكِتَابَةِ مَا تَشْرَحِينَهُ (حَرْف، رَقَم، كَلِمَة، نَصّ، مُعَادَلَة).
   - الصِّيغَةُ: drawOnBoard(item="النص_هنا")

✍️ 2. نَافِذَةُ الكِتَابَةِ (askToWrite)
   - الوَظِيفَةُ: لِفَتْحِ شَاشَةٍ لِلطِّفْلِ لِيَكْتُبَ حَرْفًا، رَقَمًا، كَلِمَةً، أَوْ اسْمًا.
   - الصِّيغَةُ: askToWrite(letter="المحتوى")

🎯 3. نَافِذَةُ الِاخْتِبَارِ (showQuiz)
   - الوَظِيفَةُ: لِعَرْضِ سُؤَالٍ مَعَ 3 خِيَارَاتٍ.
   - الصِّيغَةُ: showQuiz(question="السؤال", options=["خيار1", "خيار2", "خيار3"], answer="الصحيح")

💾 4. حِفْظُ التَّقَدُّمِ (markLessonComplete)
   - الوَظِيفَةُ: لِحِفْظِ مَا تَمَّ إِنجَازُهُ بِنَجَاحٍ.
   - الصِّيغَةُ: markLessonComplete(lesson="عنوان الدرس", topic="التفاصيل")

════════════════════════════════════════════════════════════════
🚨 قَوَاعِدُ حَاسِمَةٌ لِلْمُعَلِّمَةِ
════════════════════════════════════════════════════════════════

1. ✅ تَحَدَّثِي دَائِمًا بِالْعَرَبِيَّةِ الْفُصْحَى مَعَ التَّشْكِيلِ
2. ✅ كُونِي مُشَجِّعَةً، لَطِيفَةً، صَبُورَةً
3. ✅ اسْتَخْدِمِي الْأَدَوَاتِ بِذَكَاءٍ
4. ✅ اخْتِمِي كُلَّ رَدٍّ بِسُؤَالٍ

════════════════════════════════════════════════════════════════
👤 بيانات الطالب:
════════════════════════════════════════════════════════════════
• الاسم: هاشم
• الصف الدراسي: الصف الثالث
• العمر: 8 سنوات
        `.trim();
        
        const setupWithLargePrompt = {
            setup: {
                model: MODEL,
                generation_config: {
                    response_modalities: ["TEXT"],
                    temperature: 0.2
                },
                system_instruction: {
                    parts: [{
                        text: largePrompt
                    }]
                },
                tools: [
                    {
                        function_declarations: [
                            {
                                name: "drawOnBoard",
                                description: "رسم محتوى على السبورة",
                                parameters: {
                                    type: "OBJECT",
                                    properties: {
                                        item: { type: "STRING", description: "المحتوى للعرض" }
                                    },
                                    required: ["item"]
                                }
                            },
                            {
                                name: "showQuiz",
                                description: "عرض اختبار",
                                parameters: {
                                    type: "OBJECT",
                                    properties: {
                                        question: { type: "STRING" },
                                        options: { type: "ARRAY", items: { type: "STRING" } },
                                        answer: { type: "STRING" }
                                    },
                                    required: ["question", "options", "answer"]
                                }
                            }
                        ]
                    }
                ]
            }
        };
        
        console.log('📤 Sending setup with large system prompt...');
        console.log(`📏 Prompt size: ${largePrompt.length} chars`);
        console.log(`📦 Total payload size: ~${JSON.stringify(setupWithLargePrompt).length} chars`);
        ws3.send(JSON.stringify(setupWithLargePrompt));
    });
    
    ws3.on('message', (data) => {
        try {
            const response = JSON.parse(data.toString());
            console.log('📨 Response:', JSON.stringify(response, null, 2));
            
            if (response.setupComplete || response.setup_complete) {
                console.log('✅ TEST 3 PASSED: Large system prompt works!');
                test3Success = true;
                ws3.close();
                
                console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('🎉 ALL TESTS PASSED!');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                console.log('✅ API Key: صالح');
                console.log('✅ Billing: مفعّل');
                console.log('✅ System Prompt: يعمل');
                console.log('\n🔍 المشكلة قد تكون في:');
                console.log('1. System Prompt الحالي كبير جداً (15KB)');
                console.log('2. مشكلة في الشبكة أو Firewall');
                console.log('3. مشكلة في التوقيت (Timing issue)');
            } else if (response.error) {
                console.log('❌ Error:', response.error.message);
                ws3.close();
            }
        } catch (e) {
            console.log('⚠️ Parse error:', e.message);
        }
    });
    
    ws3.on('close', (code, reason) => {
        console.log(`\n🔌 Connection Closed - Code: ${code}\n`);
        
        if (!test3Success) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('❌ TEST 3 FAILED');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            console.log('🔍 التشخيص: System Prompt كبير جداً!');
            console.log('\n📋 الحل:');
            console.log('1. قلّص System Prompt إلى أقل من 8,000 حرف');
            console.log('2. احذف الأمثلة المكررة');
            console.log('3. اختصر التعليمات');
        }
    });
    
    ws3.on('error', (err) => {
        console.log('❌ WebSocket Error:', err.message);
    });
}
