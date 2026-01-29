/**
 * 📏 System Prompt Size Analyzer
 * 
 * يحلل حجم System Prompt الحالي ويقترح تحسينات
 */

const fs = require('fs');
const path = require('path');

console.log('📏 System Prompt Size Analyzer\n');

// قراءة ملف GeminiLiveService.js
const filePath = path.join(__dirname, 'mobile', 'src', 'services', 'GeminiLiveService.js');

if (!fs.existsSync(filePath)) {
    console.log('❌ File not found:', filePath);
    process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');

// استخراج System Prompt من الكود
// البحث عن const localSystemPrompt = `...`
const promptMatch = content.match(/const localSystemPrompt = `([\s\S]*?)`;/);

if (!promptMatch) {
    console.log('❌ Could not find localSystemPrompt in the file');
    process.exit(1);
}

const systemPrompt = promptMatch[1];

// تحليل الحجم
const charCount = systemPrompt.length;
const lineCount = systemPrompt.split('\n').length;
const wordCount = systemPrompt.split(/\s+/).filter(w => w.length > 0).length;
const byteSize = Buffer.byteLength(systemPrompt, 'utf8');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 CURRENT SYSTEM PROMPT STATISTICS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log(`📝 Characters: ${charCount.toLocaleString()}`);
console.log(`📄 Lines: ${lineCount.toLocaleString()}`);
console.log(`🔤 Words: ${wordCount.toLocaleString()}`);
console.log(`💾 Size: ${(byteSize / 1024).toFixed(2)} KB`);

// تقييم الحجم
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('⚖️ SIZE EVALUATION');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const recommendedMax = 8000;
const warningThreshold = 10000;

if (charCount <= recommendedMax) {
    console.log('✅ Size: OPTIMAL');
    console.log(`   (${charCount} chars ≤ ${recommendedMax} recommended)`);
} else if (charCount <= warningThreshold) {
    console.log('⚠️ Size: ACCEPTABLE but could be optimized');
    console.log(`   (${charCount} chars > ${recommendedMax} recommended)`);
    console.log(`   Reduction needed: ${charCount - recommendedMax} chars`);
} else {
    console.log('❌ Size: TOO LARGE');
    console.log(`   (${charCount} chars > ${warningThreshold} warning threshold)`);
    console.log(`   Reduction needed: ${charCount - recommendedMax} chars`);
    console.log(`   Excess: ${((charCount / recommendedMax - 1) * 100).toFixed(0)}% over recommended`);
}

// تحليل المحتوى
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 CONTENT ANALYSIS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// عد الأمثلة
const exampleMatches = systemPrompt.match(/مِثَالٌ \d+:/g);
const exampleCount = exampleMatches ? exampleMatches.length : 0;
console.log(`📚 Examples found: ${exampleCount}`);

// عد القواعد
const ruleMatches = systemPrompt.match(/قَاعِدَةٌ|قَوَاعِدُ/g);
const ruleCount = ruleMatches ? ruleMatches.length : 0;
console.log(`📋 Rules sections: ${ruleCount}`);

// عد الأقسام
const sectionMatches = systemPrompt.match(/═{10,}/g);
const sectionCount = sectionMatches ? sectionMatches.length : 0;
console.log(`📑 Sections: ${sectionCount}`);

// اقتراحات التحسين
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('💡 OPTIMIZATION SUGGESTIONS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const suggestions = [];

if (charCount > recommendedMax) {
    suggestions.push({
        priority: 'HIGH',
        action: 'Reduce total size',
        target: `Remove ${charCount - recommendedMax} characters`,
        impact: `${((charCount - recommendedMax) / charCount * 100).toFixed(0)}% reduction needed`
    });
}

if (exampleCount > 3) {
    const exampleChars = exampleCount * 500; // تقدير متوسط
    suggestions.push({
        priority: 'MEDIUM',
        action: 'Reduce examples',
        target: `Keep only 2-3 most important examples (currently ${exampleCount})`,
        impact: `~${exampleChars} chars saved`
    });
}

if (systemPrompt.includes('────────────────')) {
    suggestions.push({
        priority: 'LOW',
        action: 'Remove decorative lines',
        target: 'Remove separator lines (────, ════)',
        impact: '~500 chars saved'
    });
}

if (systemPrompt.match(/\n{3,}/g)) {
    suggestions.push({
        priority: 'LOW',
        action: 'Remove extra newlines',
        target: 'Replace multiple newlines with single ones',
        impact: '~200 chars saved'
    });
}

// عرض الاقتراحات
suggestions.forEach((s, i) => {
    console.log(`${i + 1}. [${s.priority}] ${s.action}`);
    console.log(`   Target: ${s.target}`);
    console.log(`   Impact: ${s.impact}\n`);
});

// تقدير الحجم بعد التحسين
if (suggestions.length > 0) {
    const estimatedSavings = suggestions.reduce((sum, s) => {
        const match = s.impact.match(/~?(\d+)/);
        return sum + (match ? parseInt(match[1]) : 0);
    }, 0);
    
    const estimatedFinalSize = charCount - estimatedSavings;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 ESTIMATED RESULTS AFTER OPTIMIZATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`Current size:    ${charCount.toLocaleString()} chars`);
    console.log(`Estimated savings: -${estimatedSavings.toLocaleString()} chars`);
    console.log(`Final size:      ${estimatedFinalSize.toLocaleString()} chars`);
    console.log(`Recommended:     ${recommendedMax.toLocaleString()} chars\n`);
    
    if (estimatedFinalSize <= recommendedMax) {
        console.log('✅ After optimization: WITHIN RECOMMENDED LIMIT');
    } else {
        console.log(`⚠️ After optimization: Still ${estimatedFinalSize - recommendedMax} chars over limit`);
        console.log('   Consider more aggressive reduction');
    }
}

// مقارنة مع Setup Message الكامل
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📦 FULL SETUP MESSAGE SIZE ESTIMATE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// تقدير حجم Tools
const toolsSize = 2000; // تقدير
const configSize = 200;
const totalSetupSize = charCount + toolsSize + configSize;

console.log(`System Prompt:   ${charCount.toLocaleString()} chars`);
console.log(`Tools (est.):    ${toolsSize.toLocaleString()} chars`);
console.log(`Config (est.):   ${configSize.toLocaleString()} chars`);
console.log(`─────────────────────────────`);
console.log(`TOTAL:           ${totalSetupSize.toLocaleString()} chars`);
console.log(`                 ${(totalSetupSize / 1024).toFixed(2)} KB\n`);

if (totalSetupSize > 20000) {
    console.log('❌ WARNING: Total setup message is very large!');
    console.log('   This may cause connection issues with Gemini Live');
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Analysis Complete');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
