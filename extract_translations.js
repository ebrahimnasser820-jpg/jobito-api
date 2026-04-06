const fs = require('fs');
const path = require('path');

const i18nPath = path.resolve(__dirname, '../Jobito/src/i18n.ts');
const i18nContent = fs.readFileSync(i18nPath, 'utf8');

// Simple regex-based extraction for nested structure
function parseI18n(content, lang) {
    const startMarker = lang + ': {';
    const startIdx = content.indexOf(startMarker);
    if (startIdx === -1) return {};

    // Find the end of this language block by counting braces
    let depth = 0;
    let endIdx = -1;
    for (let i = startIdx + startMarker.length - 1; i < content.length; i++) {
        if (content[i] === '{') depth++;
        if (content[i] === '}') {
            depth--;
            if (depth === 0) {
                endIdx = i;
                break;
            }
        }
    }

    const block = content.substring(startIdx, endIdx + 1);
    
    const results = {};
    const stack = [];
    
    const lines = block.split('\n');
    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.endsWith('{')) {
            const keyMatch = trimmed.match(/^"?(\w+)"?\s*:/);
            if (keyMatch) stack.push(keyMatch[1]);
        } else if (trimmed === '},' || trimmed === '}') {
            stack.pop();
        } else {
            const match = trimmed.match(/^"?(\w+)"?\s*:\s*"(.*)"?,?$/);
            if (match) {
                const key = match[1];
                const value = match[2];
                const fullKey = [...stack.slice(1), key].join('.');
                results[fullKey] = value;
            }
        }
    });
    return results;
}

const en = parseI18n(i18nContent, 'en');
const ar = parseI18n(i18nContent, 'ar');

const allKeys = new Set([...Object.keys(en), ...Object.keys(ar)]);

بlet sql = "CREATE TABLE IF NOT EXISTS ptj.translations (\\n  id SERIAL PRIMARY KEY,\\n  translation_key VARCHAR(255) UNIQUE NOT NULL,\\n  en TEXT NOT NULL,\\n  ar TEXT NOT NULL,\\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\\n);\\n\\n";
sql += "INSERT INTO ptj.translations (translation_key, en, ar) VALUES\\n";
const values = [];

allKeys.forEach(key => {
    const enVal = (en[key] || '').toString().replace(/'/g, "''");
    const arVal = (ar[key] || '').toString().replace(/'/g, "''");
    values.push(`('${key}', '${enVal}', '${arVal}')`);
});

sql += values.join(",\n") + "\nON CONFLICT (translation_key) DO UPDATE SET en = EXCLUDED.en, ar = EXCLUDED.ar;";

fs.writeFileSync(path.resolve(__dirname, 'translations.sql'), sql);
console.log('Successfully generated translations.sql with ' + allKeys.size + ' keys');
