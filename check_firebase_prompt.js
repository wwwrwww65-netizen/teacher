/**
 * ✅ Firebase System Prompt Checker
 * 
 * يفحص هل System Prompt موجود في Firebase
 */

console.log('🔍 Checking Firebase System Prompt...\n');

// محاكاة ما يحدث في الكود
const config = {
    api_keys: {
        google_gemini: "AIza...",
        revenuecat_android: "..."
    },
    ai_settings: {
        model_name: "models/gemini-2.0-flash-exp"
        // ❓ هل system_prompt موجود هنا؟
    }
};

const systemPrompt = config?.ai_settings?.system_prompt;

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 CURRENT STATUS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (systemPrompt) {
    console.log('✅ Firebase System Prompt: FOUND');
    console.log(`📏 Length: ${systemPrompt.length} chars`);
    console.log('🎯 App will use: FIREBASE VERSION ✅\n');
} else {
    console.log('❌ Firebase System Prompt: NOT FOUND');
    console.log('⚠️ App will use: LOCAL FALLBACK (14,329 chars) ❌');
    console.log('🔴 This causes connection drops!\n');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 HOW TO FIX');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('1. Go to: https://console.firebase.google.com');
console.log('2. Select your project');
console.log('3. Navigate to: Remote Config');
console.log('4. Look for parameter: "ai_settings"');
console.log('5. Check if it has "system_prompt" field');
console.log('6. If missing, add it with your System Prompt');
console.log('7. Click "Publish changes"');
console.log('8. Wait 1-2 minutes for app to fetch new config\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 EXPECTED FIREBASE STRUCTURE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('Parameter Name: ai_settings');
console.log('Type: JSON');
console.log('Value:');
console.log(JSON.stringify({
    "model_name": "models/gemini-2.0-flash-exp",
    "system_prompt": "════════════════════════════════════════════════════════════════\n🚨🚨🚨 الْأَوْلَوِيَّةُ الْقُصْوَى: الاسْتِمَاعُ الْفِعْلِيُّ! 🚨🚨🚨\n════════════════════════════════════════════════════════════════\n\n⛔ قَاعِدَةٌ إِجْبَارِيَّةٌ قَبْلَ كُلِّ شَيْءٍ:\n\nأَنْتِ تَسْتَمِعِينَ لِلصَّوْتِ الْحَقِيقِيِّ (Audio Input) مِنَ الطَّالِبِ!\n...(rest of your System Prompt)"
}, null, 2));

console.log('\n✅ After adding this, the app will use Firebase version!\n');
