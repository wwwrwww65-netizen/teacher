/**
 * 🔥 Firebase Config Checker
 * 
 * This script checks if Firebase Remote Config has the Gemini API key
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'mobile', 'android', 'app', 'google-services.json');

console.log('🔥 Firebase Config Checker');
console.log('═══════════════════════════════════════════\n');

try {
    // Check if google-services.json exists
    const fs = require('fs');
    if (!fs.existsSync(serviceAccountPath)) {
        console.log('❌ google-services.json not found at:', serviceAccountPath);
        console.log('ℹ️  This script needs Firebase Admin SDK credentials');
        console.log('📍 Alternative: Check Firebase Console directly');
        console.log('   https://console.firebase.google.com/project/YOUR_PROJECT/config\n');
        process.exit(1);
    }

    console.log('✅ Found google-services.json');
    console.log('📍 Path:', serviceAccountPath);
    
    // Note: This is a simplified check
    // For full Firebase Remote Config access, you need Firebase Admin SDK with proper credentials
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 MANUAL CHECK REQUIRED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('To check your Firebase Remote Config:');
    console.log('1. Go to: https://console.firebase.google.com');
    console.log('2. Select your project');
    console.log('3. Navigate to: Remote Config');
    console.log('4. Look for these keys:');
    console.log('   - api_keys.google_gemini');
    console.log('   - ai_settings.model_name');
    console.log('   - ai_settings.system_prompt\n');
    
    console.log('Expected structure:');
    console.log(JSON.stringify({
        "api_keys": {
            "google_gemini": "AIza...",
            "revenuecat_android": "..."
        },
        "ai_settings": {
            "model_name": "models/gemini-2.0-flash-exp",
            "system_prompt": "..."
        }
    }, null, 2));
    
} catch (e) {
    console.log('❌ Error:', e.message);
}
