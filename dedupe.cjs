const fs = require('fs');
const path = require('path');

const enPath = 'C:/Users/baghe/.openclaw/workspace/etsyseolab-6/locales/en.ts';
const frPath = 'C:/Users/baghe/.openclaw/workspace/etsyseolab-6/locales/fr.ts';

let enContent = fs.readFileSync(enPath, 'utf8');
let frContent = fs.readFileSync(frPath, 'utf8');

// For en.ts: Remove duplicate landing_faq lines at the end.
const faqRegexEn = /\s*"landing_faq_1_q"[\s\S]*?"landing_faq_4_a": "[^"]*",\s*}/g;
// actually, just replace everything after the first `landing_faq_4_a` if it was duplicated down the file
let matchEn = faqRegexEn.exec(enContent);
if (matchEn) {
    // we'll just fix it by replacing the duplicate bottom part
}

// Safer approach: Read lines, track seen keys, and remove duplicate key lines.
function dedupeKeys(content) {
    const lines = content.split('\n');
    const seen = new Set();
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const match = line.match(/^\s*"([^"]+)":/);
        if (match) {
            const key = match[1];
            if (seen.has(key)) {
                // Duplicate key found, skip this line
                console.log('Removed duplicate key:', key);
                continue;
            } else {
                seen.add(key);
            }
        }
        result.push(line);
    }
    return result.join('\n');
}

fs.writeFileSync(enPath, dedupeKeys(enContent), 'utf8');
fs.writeFileSync(frPath, dedupeKeys(frContent), 'utf8');
console.log('Deduplication complete.');
