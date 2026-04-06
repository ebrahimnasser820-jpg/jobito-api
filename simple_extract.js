const fs = require('fs');

const content = fs.readFileSync('../Jobito/src/i18n.ts', 'utf8');

function extractBlock(content, lang) {
    const startIdx = content.indexOf(lang + ': {');
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
let sql = "INSERT INTO ptj.translations (translation_key, en, ar) VALUES\\n";
let values = [];

for (let key of allKeys) {
    const enVal = (en[key] || '').replace(/'/g, "''");
    const arVal = (ar[key] || '').replace(/'/g, "''");
    values.push(`('${key}', '${enVal}', '${arVal}')`);
}

fs.writeFileSync('translations.sql', sql + values.join(',\\n') + ';');
console.log('Done: ' + allKeys.size + ' keys');
