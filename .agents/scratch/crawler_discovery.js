import fs from 'fs';

const html = fs.readFileSync('e:/ERP_Local_Mini/.agents/scratch/crm_main_page.html', 'utf8');

// Find all matches for "path":"st-..." or similar
const regex = /"path"\s*:\s*"(st-[^"]+)"/g;
let links = new Set();
let match;
while ((match = regex.exec(html)) !== null) {
  links.add(match[1]);
}

// Find all matches for "/st-..." in strings
const pathRegex = /\/(st-[a-zA-Z0-9_\-\/]+)/g;
while ((match = pathRegex.exec(html)) !== null) {
  links.add(match[1]);
}

console.log(`\n=== DISCOVERED PAGES EXTENDED (${links.size}) ===\n`);
console.log(Array.from(links).sort().map(l => `https://docs.pancake.biz/crm/${l}?lang=vi`).join('\n'));
