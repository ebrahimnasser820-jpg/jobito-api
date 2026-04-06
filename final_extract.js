const fs = require('fs');
const path = require('path');

try {
    const i18nPath = path.resolve('c:/Users/MOHAM/Project/Jobito/Jobito/src/i18n.ts');
    console.log('Reading from:', i18nPath);
    const content = fs.readFileSync(i18nPath, 'utf8');

    function extractBlock(content, lang) {
        const marker = lang + ': {';
        const startIdx = content.indexOf(marker);
        if (startIdx === -1) {
            console.error('Marker not found for:', lang);
            return '';
        }
        let depth = 0;
        let started = false;
        let res = '';
        for (let i = startIdx; i < content.length; i++) {
            if (content[i] === '{') { depth++; started = true; }
            if (content[i] === '}') depth--;
            if (started) res += content[i];
            if (started && depth === 0) break;
        }
        return res;
    }

    const enBlock = extractBlock(content, 'en');
    const arBlock = extractBlock(content, 'ar');

    function getKeys(block) {
        const lines = block.split('\n');
        let stack = [];
        let results = {};
        for (let line of lines) {
            line = line.trim();
            if (line.includes('{')) {
                const m = line.match(/^"?(\w+)"?\s*:\s*\{/);
                if (m) stack.push(m[1]);
            } else if (line.startsWith('}') || line.startsWith('},')) {
                stack.pop();
            } else {
                const m = line.match(/^"?(\w+)"?\s*:\s*"(.*)"?,?$/);
                if (m) {
                    const key = [...stack.slice(1), m[1]].join('.');
                    results[key] = m[2];
                }
            }
        }
        return results;
    }

    const en = getKeys(enBlock);
    const ar = getKeys(arBlock);

    const allKeys = new Set([...Object.keys(en), ...Object.keys(ar)]);
    console.log('Total keys found:', allKeys.size);

    let sql = "CREATE TABLE IF NOT EXISTS ptj.translations (\\n  id SERIAL PRIMARY KEY,\\n  translation_key VARCHAR(255) UNIQUE NOT NULL,\\n  en TEXT NOT NULL,\\n  ar TEXT NOT NULL,\\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\\n);\\n\\n";
    sql += "INSERT INTO ptj.translations (translation_key, en, ar) VALUES\\n";
    let values = [];

    for (let key of allKeys) {
        const enVal = (en[key] || '').replace(/'/g, "''");
        const arVal = (ar[key] || '').replace(/'/g, "''");
        values.push(`('${key}', '${enVal}', '${arVal}')`);
    }

    sql += values.join(",\\n") + "\\nON CONFLICT (translation_key) DO UPDATE SET en = EXCLUDED.en, ar = EXCLUDED.ar;";

    const outputPath = path.resolve('c:/Users/MOHAM/Project/Jobito/jobito-api/translations.sql');
    fs.writeFileSync(outputPath, sql);
    console.log('Successfully wrote to:', outputPath);

} catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
}
