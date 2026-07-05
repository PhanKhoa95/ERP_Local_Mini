import fs from 'fs';

const html = fs.readFileSync('C:/Users/pkhoa/.gemini/antigravity/brain/e572c9fa-8149-43a3-940b-5456bbfcec6a/.system_generated/steps/989/content.md', 'utf8');

// Find all matches for "/botcake/st-..." or similar
const regex = /"path"\s*:\s*"(st-[^"]+)"/g;
let links = new Set();
let match;
while ((match = regex.exec(html)) !== null) {
  links.add(match[1]);
}

// Find any substring containing botcake/st-
const botcakeRegex = /\/botcake\/(st-[a-zA-Z0-9_\-\/]+)/g;
while ((match = botcakeRegex.exec(html)) !== null) {
  links.add(match[1]);
}

console.log(`\n=== DISCOVERED BOTCAKE PAGES (${links.size}) ===\n`);
console.log(Array.from(links).sort().map(l => `https://docs.pancake.biz/botcake/${l}?lang=vi`).join('\n'));
